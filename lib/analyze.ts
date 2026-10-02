// AI 分析（说明书第 9 节）：筛选分类 → 标题相似合并 → 三段式解读 → 每周汇总。
// 输出全部简体中文，品牌名保留原文；只依据标题和摘要判断，不许编造。
import { chatJSON, LLMFatalError, LLMResponseError, type Validation } from './llm';
import type { NewsItem } from './fetch';

export { loadBrands } from './brands';

// —— 第一步：分类结果 ——
export type Classification = {
  relevant: boolean;
  section?: 'market' | 'policy';
  category?: string;
  country?: string;
  brands?: string[];
  impact_level?: 'high' | 'medium' | 'low';
  affected?: 'all' | 'cn_brands' | 'specific';
};

// —— 第二步：三段式解读 ——
export type Interpretation = {
  one_line: string;
  what_happened: string;
  why_it_matters: string;
  implications: string;
};

// —— 每周汇总 ——
export type WeeklySummary = {
  top3: string[];
  policy_summary: string;
};

// —— 类别与国家的合法取值 ——
export const MARKET_CATEGORIES = ['新品上市', '价格与促销', '渠道动作', '营销投放', '市场格局'];
export const POLICY_CATEGORIES = ['注册备案', '清真认证', '成分与标签', '关税与税费', '电商与平台监管', '执法与打假'];
export const ALL_CATEGORIES = [...MARKET_CATEGORIES, ...POLICY_CATEGORIES];
export const COUNTRIES = ['VN', 'ID', 'TH', 'PH', 'MY', 'SG', 'multi'];

// —— 校验器：AI 返回什么、我们就查什么 ——
function validateClassification(obj: unknown): Validation<Classification> {
  if (typeof obj !== 'object' || obj === null) return { ok: false, errors: ['不是对象'] };
  const o = obj as Record<string, unknown>;
  if (typeof o.relevant !== 'boolean') return { ok: false, errors: ['relevant 必须是 true/false'] };

  if (o.relevant === false) return { ok: true, value: { relevant: false } };

  const errors: string[] = [];
  const out: Classification = { relevant: true };

  if (o.section === 'market' || o.section === 'policy') out.section = o.section;
  else errors.push('section 必须是 market 或 policy');

  if (typeof o.category === 'string' && ALL_CATEGORIES.includes(o.category)) out.category = o.category;
  else errors.push(`category 必须是以下之一：${ALL_CATEGORIES.join(' / ')}`);

  if (typeof o.country === 'string' && COUNTRIES.includes(o.country)) out.country = o.country;
  else errors.push(`country 必须是：${COUNTRIES.join(' / ')}`);

  if (Array.isArray(o.brands)) out.brands = o.brands.map(String);
  else if (o.brands === undefined || o.brands === null) out.brands = [];
  else errors.push('brands 必须是数组');

  if (o.section === 'policy') {
    if (o.impact_level === 'high' || o.impact_level === 'medium' || o.impact_level === 'low') {
      out.impact_level = o.impact_level;
    } else errors.push('政策类必须填 impact_level（high/medium/low）');
    if (o.affected === 'all' || o.affected === 'cn_brands' || o.affected === 'specific') {
      out.affected = o.affected;
    } else errors.push('政策类必须填 affected（all/cn_brands/specific）');
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

function validateInterpretation(obj: unknown): Validation<Interpretation> {
  if (typeof obj !== 'object' || obj === null) return { ok: false, errors: ['不是对象'] };
  const o = obj as Record<string, unknown>;
  const errors: string[] = [];
  const fields = ['one_line', 'what_happened', 'why_it_matters', 'implications'] as const;
  for (const k of fields) {
    if (typeof o[k] !== 'string' || !(o[k] as string).trim()) errors.push(`${k} 必须是非空字符串`);
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      one_line: o.one_line as string,
      what_happened: o.what_happened as string,
      why_it_matters: o.why_it_matters as string,
      implications: o.implications as string,
    },
  };
}

function validateSummary(obj: unknown): Validation<WeeklySummary> {
  if (typeof obj !== 'object' || obj === null) return { ok: false, errors: ['不是对象'] };
  const o = obj as Record<string, unknown>;
  const errors: string[] = [];
  if (!Array.isArray(o.top3) || o.top3.length === 0) errors.push('top3 必须是非空数组');
  if (typeof o.policy_summary !== 'string' || !o.policy_summary.trim()) {
    errors.push('policy_summary 必须是非空字符串');
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      top3: (o.top3 as unknown[]).map(String),
      policy_summary: o.policy_summary as string,
    },
  };
}

function validateClusters(n: number): (obj: unknown) => Validation<number[][]> {
  return (obj) => {
    if (typeof obj !== 'object' || obj === null) return { ok: false, errors: ['不是对象'] };
    const o = obj as Record<string, unknown>;
    if (!Array.isArray(o.groups)) return { ok: false, errors: ['groups 必须是数组'] };
    const seen = new Set<number>();
    const groups: number[][] = [];
    for (const g of o.groups as unknown[]) {
      if (!Array.isArray(g)) return { ok: false, errors: ['groups 里每一项都必须是数组'] };
      const idxs: number[] = [];
      for (const v of g) {
        if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v >= n) {
          return { ok: false, errors: [`索引必须是 0 到 ${n - 1} 的整数，收到 ${JSON.stringify(v)}`] };
        }
        if (seen.has(v)) return { ok: false, errors: [`索引 ${v} 重复出现`] };
        seen.add(v);
        idxs.push(v);
      }
      groups.push(idxs);
    }
    return { ok: true, value: groups };
  };
}

// —— 分类系统提示词 ——
function classificationSystem(brandNames: string[]): string {
  const brandList = brandNames.length ? brandNames.join('、') : '（无）';
  return `你在为「东南亚美妆出海雷达」做新闻筛选与分类。你的任务是判断一条新闻是否与「美妆品牌在东南亚的市场动态或进入政策」相关，相关的话再分类。

只依据给出的标题和摘要判断，绝对不要编造标题里没有的事实、数字或日期。信息不足时，宁可判为不相关。

输出要求：只输出一个 JSON 对象，不要输出其他任何文字。

字段说明：
- relevant：布尔值。这条新闻与「美妆品牌在东南亚的市场或政策」相关吗？相关 true，无关 false。
- section：relevant 为 true 时才填。市场动态填 "market"，进入政策填 "policy"。
- category：relevant 为 true 时才填。必须从下面的清单里选一个：
  · 市场动态：
    - 「新品上市」新品发布、预售、首销
    - 「价格与促销」降价、大促、满减、套装
    - 「渠道动作」入驻 TikTok Shop/Shopee/Lazada、进驻当地连锁、更换代理商
    - 「营销投放」代言人、达人/KOL 合作、节日 campaign、品牌重塑、周年活动、评选颁奖
    - 「市场格局」份额报告、排行榜、市场规模、品牌进入或退出、融资并购（品牌重塑、周年活动、评选颁奖不算市场格局，算营销投放）
  · 进入政策：
    - 「注册备案」「清真认证」「成分与标签」「关税与税费」「电商与平台监管」「执法与打假」
    - 「成分与标签」是规则本身（禁什么成分、标签怎么写）；「执法与打假」是执法行动（查处假冒、下架、罚款）。查获假冒化妆品的新闻归「执法与打假」。
  · 品牌涉诉：品牌卷入诉讼时，只要涉及产品合规、货源、执法，就保留，归「执法与打假」或「市场格局」；只涉及创始人个人私事（绯闻、离婚等）才丢弃。
  · 关于中国品牌/消费品牌在东南亚整体趋势的新闻（例如「中国本土品牌在东南亚崛起」），即使标题没提美妆，也保留并归「市场格局」。
- country：relevant 为 true 时才填。这条新闻讲的是哪个国家？取值：VN（越南）/ ID（印尼）/ TH（泰国）/ PH（菲律宾）/ MY（马来西亚）/ SG（新加坡）/ multi（多国或不特指）。
- brands：相关新闻涉及到的品牌名（数组，可以空）。尽量从名单里找：${brandList}。名单外出现的品牌也要记录。品牌名保留原文，不要翻译。
- impact_level：仅 policy 时必填。影响多大？high / medium / low。
- affected：仅 policy 时必填。影响谁？all（所有品牌）/ cn_brands（中国品牌）/ specific（特定品类或品牌）。

直接丢弃（relevant=false）的例子：化妆教程、个人测评种草、只涉及创始人个人私事的花边新闻（绯闻、离婚）、纯股价财报（除非涉及东南亚市场战略）、与东南亚无关的全球新闻、中文出海媒体里和美妆/消费品无关的内容（如游戏、SaaS）。

输出格式示例：
{"relevant":true,"section":"market","category":"渠道动作","country":"VN","brands":["示例品牌A"]}
{"relevant":true,"section":"policy","category":"清真认证","country":"ID","brands":[],"impact_level":"high","affected":"all"}
{"relevant":false}`;
}

// —— 解读系统提示词 ——
const INTERPRETATION_SYSTEM = `你在为「东南亚美妆出海雷达」写一条新闻的中文解读，读者是中国美妆品牌的出海团队。

只依据给出的标题、摘要和分类信息写，绝对不要编造标题里没有的事实、数字或日期。信息不足就写「原文信息有限」。

关于数字：解读中若出现金额、规模等数字，保留原文写法并附中文换算，例如「1.77 แสนล้านบาท（约 1770 亿泰铢）」。换算规则：泰语 แสน=10万、ล้าน=100万、แสนล้าน=1000亿；印尼语 juta=100万、miliar=10亿、triliun=万亿；越南语 triệu=100万、tỷ=10亿、nghìn tỷ=万亿。不确定时只保留原文，不要硬换算，也不要推算原文没有的精确数字。

输出要求：只输出一个 JSON 对象，不要输出其他任何文字。

字段：
- one_line：一句话总结（30 字以内），给周刊和列表用。
- what_happened：发生了什么（事实，1–2 句）。
- why_it_matters：为什么重要（背后的变化或信号，1–3 句）。
- implications：对中国美妆品牌意味着什么（机会或风险、可以怎么应对，1–3 句）。

用简体中文写作，品牌名和专有名词保留原文。不要用翻译腔（避免「这使得」「值得注意的是」这类词），直接、具体、有判断。`;

// —— 汇总系统提示词 ——
const SUMMARY_SYSTEM = `你在为「东南亚美妆出海雷达」写每周汇总，读者是中国美妆品牌的出海团队。

给你本周所有相关条目的「一句话总结 + 国家 + 类别 + 影响程度」，请生成：

输出要求：只输出一个 JSON 对象，不要输出其他任何文字。

字段：
- top3：本周最值得关注的动态，最多 3 条，每条一句话。优先级：高影响政策 > 名单内品牌的重大动作 > 其他。如果本周相关条目不足 3 条，有几条就写几条，绝对不要凑数、不要写「无」「没有其他」这类占位条目。
- policy_summary：本周各国政策变化的一段话总结。如果本周没有任何政策类条目，这一项必须输出这句原话：「本周各国无重大进入政策变化。」

用简体中文，品牌名保留原文。`;

// —— 第一步：筛选 + 分类（对每条新闻）——
export async function classifyItem(item: NewsItem, brandNames: string[]): Promise<Classification | null> {
  const brief = `标题：${item.title}\n摘要：${item.snippet || '（无）'}\n来源：${item.source}\n国家（抓取来源）：${item.country}`;
  try {
    return await chatJSON<Classification>({
      kind: 'classify',
      system: classificationSystem(brandNames),
      user: brief,
      validate: validateClassification,
      maxTokens: 500,
    });
  } catch (error) {
    if (error instanceof LLMFatalError) throw error;
    // 格式不合规：记录并跳过该条，不让整批崩掉
    if (error instanceof LLMResponseError) {
      console.warn(`     ⚠️ 分类跳过「${item.title.slice(0, 40)}」：${error.errors.join('；')}`);
      return null;
    }
    throw error;
  }
}

// —— 第二步：三段式解读（只对相关条目）——
export async function interpretItem(
  item: NewsItem,
  c: Classification,
): Promise<Interpretation | null> {
  const brief = [
    `标题：${item.title}`,
    `摘要：${item.snippet || '（无）'}`,
    `来源：${item.source}`,
    `国家：${c.country}`,
    `板块：${c.section === 'policy' ? '进入政策' : '市场动态'}`,
    `类别：${c.category}`,
    `涉及品牌：${(c.brands ?? []).join('、') || '（无）'}`,
    c.section === 'policy' ? `影响程度：${c.impact_level}；影响对象：${c.affected}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  try {
    return await chatJSON<Interpretation>({
      kind: 'analyze',
      system: INTERPRETATION_SYSTEM,
      user: brief,
      validate: validateInterpretation,
      maxTokens: 2000,
    });
  } catch (error) {
    if (error instanceof LLMFatalError) throw error;
    if (error instanceof LLMResponseError) {
      console.warn(`     ⚠️ 解读跳过「${item.title.slice(0, 40)}」：${error.errors.join('；')}`);
      return null;
    }
    throw error;
  }
}

// —— 标题相似合并（只对相关条目，且只在同一国家内比较）——
export type RelevantItem = NewsItem & { classification: Classification };

export type MergedGroup = {
  country: string;
  title: string;
  snippet: string;
  urls: string[];
  sources: string[];
  language: string;
  publishedAt: string;
  classification: Classification;
  members: RelevantItem[];
};

function groupBase(members: RelevantItem[]): Omit<MergedGroup, 'classification'> {
  const first = members[0];
  return {
    country: first.classification.country ?? first.country,
    title: first.title,
    snippet: first.snippet,
    urls: [...new Set(members.map((m) => m.url).filter(Boolean))],
    sources: [...new Set(members.map((m) => m.source).filter(Boolean))],
    language: first.language,
    publishedAt: first.publishedAt,
    members,
  };
}

function toSingle(item: RelevantItem): MergedGroup {
  return { ...groupBase([item]), classification: item.classification };
}

function membersConsistent(members: RelevantItem[]): boolean {
  const keys = new Set(members.map((m) => `${m.classification.section ?? ''}|${m.classification.category ?? ''}`));
  return keys.size === 1;
}

// 合并组若分类不一致，就对代表标题重新分类一次（方案 a）
async function settleGroup(
  base: Omit<MergedGroup, 'classification'>,
  brandNames: string[],
): Promise<MergedGroup> {
  const members = base.members;
  if (members.length <= 1 || membersConsistent(members)) {
    return { ...base, classification: members[0].classification };
  }
  const representative: NewsItem = {
    title: base.title,
    snippet: base.snippet,
    url: base.urls[0] ?? '',
    source: base.sources.join('、'),
    sourceId: members[0].sourceId,
    sourceType: members[0].sourceType,
    language: base.language,
    country: base.country,
    publishedAt: base.publishedAt,
  };
  const settled = await classifyItem(representative, brandNames);
  if (!settled) return { ...base, classification: members[0].classification };
  return { ...base, classification: settled };
}

// 每个国家一次调用：把该国所有相关条目标题喂给 AI，让它返回「哪些是同一件事」。
async function clusterCountry(list: RelevantItem[]): Promise<number[][] | null> {
  const brief = list
    .map((it, i) => `${i}. 标题：${it.title}\n   来源：${it.source}`)
    .join('\n');
  const system = `你在为新闻做「去重合并」。下面是一组同一国家内的新闻条目（已编号）。

同一件事经常被多家媒体报道、标题写法略有不同。请找出「讲的是同一件事」的条目，按编号分组。

输出要求：只输出一个 JSON 对象，格式为 {"groups":[[编号,编号],...]}。每个内层数组是一组「同一事件」的条目编号，组内至少 2 个。没有重复的条目不要放进任何组。不要把只是话题相近、但讲的是不同事情的条目合并。`;
  try {
    return await chatJSON<number[][]>({
      kind: 'classify',
      system,
      user: brief,
      validate: validateClusters(list.length),
      maxTokens: 1000,
    });
  } catch (error) {
    if (error instanceof LLMFatalError) throw error;
    if (error instanceof LLMResponseError) {
      console.warn(`     ⚠️ 合并失败，该组保持不合并：${error.errors.join('；')}`);
      return null;
    }
    throw error;
  }
}

export async function mergeSimilar(items: RelevantItem[], brandNames: string[]): Promise<MergedGroup[]> {
  const byCountry = new Map<string, RelevantItem[]>();
  for (const it of items) {
    const c = it.classification.country ?? it.country ?? 'multi';
    const arr = byCountry.get(c) ?? [];
    arr.push(it);
    byCountry.set(c, arr);
  }

  const result: MergedGroup[] = [];
  for (const [country, list] of byCountry) {
    if (list.length <= 1) {
      for (const it of list) result.push(toSingle(it));
      continue;
    }
    const clusters = await clusterCountry(list);
    if (!clusters) {
      // 合并失败：整组原样保留，不崩
      for (const it of list) result.push(toSingle(it));
      continue;
    }
    const grouped = new Set<number>();
    for (const cluster of clusters) {
      const members = cluster.map((i) => list[i]).filter(Boolean);
      if (members.length < 2) continue;
      cluster.forEach((i) => grouped.add(i));
      result.push(await settleGroup(groupBase(members), brandNames));
    }
    // 没进任何组的条目 = 独立一条
    list.forEach((it, i) => {
      if (!grouped.has(i)) result.push(toSingle(it));
    });
  }
  return result;
}

// —— 每周汇总 ——
export type SummaryInput = {
  one_line: string;
  country: string;
  category: string;
  section: string;
  impact_level?: string;
  brands: string[];
  isBenchmark: boolean;
};

export async function summarizeWeek(inputs: SummaryInput[]): Promise<WeeklySummary | null> {
  if (inputs.length === 0) return null;
  const brief = inputs
    .map(
      (s, i) =>
        `${i + 1}. ${s.one_line}｜国家：${s.country}｜板块：${s.section}｜类别：${s.category}` +
        (s.impact_level ? `｜影响：${s.impact_level}` : '') +
        (s.brands.length ? `｜品牌：${s.brands.join('、')}` : '') +
        (s.isBenchmark ? '｜（名单内重点品牌）' : ''),
    )
    .join('\n');
  try {
    return await chatJSON<WeeklySummary>({
      kind: 'analyze',
      system: SUMMARY_SYSTEM,
      user: brief,
      validate: validateSummary,
      maxTokens: 2000,
    });
  } catch (error) {
    if (error instanceof LLMFatalError) throw error;
    if (error instanceof LLMResponseError) {
      console.warn(`     ⚠️ 每周汇总失败：${error.errors.join('；')}`);
      return null;
    }
    throw error;
  }
}
