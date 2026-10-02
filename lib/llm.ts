// AI 服务商切换层（说明书 9.5）
// 默认 DeepSeek（兼容 OpenAI 接口）；可切换到 Anthropic。
// 统一入口 chatJSON()：调用 → 解析 JSON → 校验 → 失败重试一次 → 还失败抛错。
import Anthropic from '@anthropic-ai/sdk';

export type Provider = 'deepseek' | 'anthropic';

export type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

/**
 * 不再重试的致命错误：缺 key、key 无效、余额不足、请求参数错误。
 * 这类错误对每条数据都一样，继续跑只是浪费额度，应当直接停止整批。
 */
export class LLMFatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMFatalError';
  }
}

/** 解析或格式校验失败，已重试仍不行。调用方应记录并跳过该条，不让整批崩掉。 */
export class LLMResponseError extends Error {
  errors: string[];
  constructor(message: string, errors: string[]) {
    super(message);
    this.name = 'LLMResponseError';
    this.errors = errors;
  }
}

function resolveProvider(): Provider {
  const raw = (process.env.LLM_PROVIDER ?? 'deepseek').toLowerCase();
  if (raw === 'deepseek' || raw === 'anthropic') return raw;
  throw new LLMFatalError(
    `LLM_PROVIDER 必须是 deepseek 或 anthropic，当前是 "${process.env.LLM_PROVIDER}"。`,
  );
}

function resolveModel(kind: 'classify' | 'analyze'): string {
  const provider = resolveProvider();
  const key = provider === 'deepseek' ? 'DEEPSEEK' : 'ANTHROPIC';
  const suffix = kind === 'classify' ? 'CLASSIFY_MODEL' : 'ANALYZE_MODEL';
  if (provider === 'deepseek') {
    return process.env[`${key}_${suffix}`] ?? 'deepseek-chat';
  }
  return process.env[`${key}_${suffix}`] ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
}

async function callDeepSeek(opts: {
  system: string;
  user: string;
  model: string;
  maxTokens: number;
}): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new LLMFatalError('没有找到 DEEPSEEK_API_KEY。请在 .env 里填上 DeepSeek 的 key。');
  }

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: opts.maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const snippet = body.slice(0, 300);
    if (res.status === 401 || res.status === 403) {
      throw new LLMFatalError(`DeepSeek key 无效（${res.status}）。请检查 .env 里的 DEEPSEEK_API_KEY。`);
    }
    if (res.status === 402) {
      throw new LLMFatalError(`DeepSeek 余额不足（402）。请到 platform.deepseek.com 充值。`);
    }
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      throw new LLMFatalError(`DeepSeek 请求错误（${res.status}）：${snippet}`);
    }
    // 429 / 5xx：临时性错误，交给重试
    throw new Error(`DeepSeek 临时错误（${res.status}）：${snippet}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 响应里没有内容。');
  return content;
}

async function callAnthropic(opts: {
  system: string;
  user: string;
  model: string;
  maxTokens: number;
}): Promise<string> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
  });
  const text = message.content.find((block) => block.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Anthropic 响应里没有文本。');
  return text.text;
}

export type ChatJSONOptions<T> = {
  system: string;
  user: string;
  kind: 'classify' | 'analyze';
  validate: (obj: unknown) => Validation<T>;
  maxTokens?: number;
  /** 校验失败时的额外重试次数，默认 1。 */
  retries?: number;
};

/**
 * 调一次 AI，让它返回 JSON，并做解析 + 格式校验。
 * 解析或校验失败会重试（默认一次）；重试后仍失败抛出 LLMResponseError。
 * 致命错误（缺 key / key 无效 / 余额不足）直接抛出 LLMFatalError。
 */
export async function chatJSON<T>(opts: ChatJSONOptions<T>): Promise<T> {
  const provider = resolveProvider();
  const model = resolveModel(opts.kind);
  const maxTokens = opts.maxTokens ?? (opts.kind === 'classify' ? 500 : 2000);
  const retries = opts.retries ?? 1;

  let lastValidationErrors: string[] = [];

  for (let attempt = 0; attempt <= retries; attempt++) {
    let raw: string;
    try {
      raw =
        provider === 'deepseek'
          ? await callDeepSeek({ system: opts.system, user: opts.user, model, maxTokens })
          : await callAnthropic({ system: opts.system, user: opts.user, model, maxTokens });
    } catch (error) {
      if (error instanceof LLMFatalError) throw error;
      if (attempt >= retries) throw error;
      console.warn(`     AI 调用失败，重试（${attempt + 1}/${retries}）：${(error as Error).message}`);
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      if (attempt >= retries) {
        lastValidationErrors = ['返回内容不是合法 JSON'];
        break;
      }
      console.warn(`     AI 返回非 JSON，重试（${attempt + 1}/${retries}）`);
      continue;
    }

    const result = opts.validate(parsed);
    if (result.ok) return result.value;
    if (attempt >= retries) {
      lastValidationErrors = result.errors;
      break;
    }
    console.warn(`     AI 返回格式不合规，重试（${attempt + 1}/${retries}）：${result.errors.join('；')}`);
  }

  throw new LLMResponseError(`AI 返回格式不合规（已重试 ${retries} 次）`, lastValidationErrors);
}
