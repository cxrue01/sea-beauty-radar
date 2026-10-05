// 新闻抓取 + 统一格式 + 去重（说明书 6.1 / 6.3）
// 所有来源抓回来后统一转换成 NewsItem，再做去重。
import { get } from 'https';
import Parser from 'rss-parser';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { sources, type Source, type SourceType } from '../config/sources';
import { countries } from '../config/keywords';
import { weekRange } from './week';

// —— 统一格式（说明书 6.1）——
export type NewsItem = {
  title: string; // 原文标题
  url: string; // 链接
  snippet: string; // 原文摘要
  source: string; // 来源媒体名（如 VnExpress / EBRUN.com）
  sourceId: string; // 数据源 id（如 google-news-vn）
  sourceType: SourceType;
  language: string; // 原文语言
  country: string; // 国家（VN / ID / … / multi）
  publishedAt: string; // 发布时间
  keyword?: string; // 命中的搜索关键词（google_news 有；rss / site 为空）
};

// —— 代理：国内访问 Google 需要，GitHub Actions 里不设 ——
let cachedAgent: HttpsProxyAgent<string> | undefined;
function getAgent(): HttpsProxyAgent<string> | undefined {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  if (!proxyUrl) return undefined;
  if (!cachedAgent) cachedAgent = new HttpsProxyAgent(proxyUrl);
  return cachedAgent;
}

// —— 限流缓解：相邻请求间隔 + 失败重试（带随机抖动）——
const REQUEST_DELAY_MS = 2_000; // 相邻请求之间的间隔（给 Google 留冷却）
const RETRY_WAITS_MS = [10_000, 30_000]; // 第 1、2 次重试前分别等待

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// 等待时间加 0–50% 随机抖动，避免多请求齐刷刷重试
function jitter(ms: number): number {
  return Math.round(ms * (1 + Math.random() * 0.5));
}

function fetchXml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = get(
      u,
      {
        agent: getAgent(),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; sea-beauty-radar/1.0)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}（疑似被限流/拦截）：${url}`));
            return;
          }
          resolve(data);
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error(`超时：${url}`)));
  });
}

const parser = new Parser();

async function fetchFeed(url: string): Promise<Parser.Item[]> {
  let lastErr!: Error;
  for (let attempt = 0; attempt <= RETRY_WAITS_MS.length; attempt++) {
    try {
      const xml = await fetchXml(url);
      try {
        const feed = await parser.parseString(xml);
        return (feed.items ?? []) as Parser.Item[];
      } catch (e) {
        throw new Error(
          `解析失败（疑似返回 HTML 验证页）：${(e as Error).message}｜开头：${xml.slice(0, 120).replace(/\s+/g, ' ')}`,
        );
      }
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt < RETRY_WAITS_MS.length) {
        const wait = jitter(RETRY_WAITS_MS[attempt]);
        console.warn(
          `  ↻ 抓取失败，${(wait / 1000).toFixed(1)} 秒后重试（第 ${attempt + 1}/${RETRY_WAITS_MS.length} 次）：${lastErr.message}`,
        );
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

function googleNewsUrl(query: string, hl: string, gl: string, ceid: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

function toNewsItem(raw: Parser.Item, source: Source, country: string, keyword?: string): NewsItem {
  let title = (raw.title ?? '').trim();
  let sourceName = source.name;

  // Google News 的标题格式是「标题 - 来源」，拆开；固定 RSS 的标题不含来源后缀
  if (source.type === 'google_news' || source.type === 'google_news_site') {
    const m = title.match(/ - ([^-]+)$/);
    if (m && m.index) {
      sourceName = m[1].trim();
      title = title.slice(0, m.index).trim();
    }
  }

  return {
    title,
    url: raw.link ?? '',
    snippet: raw.contentSnippet ?? raw.content ?? '',
    source: sourceName,
    sourceId: source.id,
    sourceType: source.type,
    language: source.language,
    country,
    publishedAt: raw.isoDate ?? raw.pubDate ?? '',
    keyword,
  };
}

// 抓取单个数据源。google_news 会展开成该国家每个关键词一次查询；
// 单个关键词失败只报错、不中断（说明书 6.3「报错响亮但不崩」）。
export async function fetchSource(source: Source): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  if (source.type === 'rss') {
    if (!source.feedUrl) return [];
    const rawItems = await fetchFeed(source.feedUrl);
    for (const raw of rawItems) items.push(toNewsItem(raw, source, 'multi'));
    return items;
  }

  if (source.type === 'google_news_site') {
    if (!source.site) return [];
    const query = `site:${source.site}${source.query ? ' ' + source.query : ''}`;
    const rawItems = await fetchFeed(googleNewsUrl(query, source.language, 'CN', 'CN:zh-Hans'));
    for (const raw of rawItems) items.push(toNewsItem(raw, source, 'multi'));
    return items;
  }

  // google_news：该国家所有关键词
  const country = countries.find((c) => c.code === source.countries[0]);
  if (!country) return [];
  const keywords = [...country.market, ...country.policy];
  let attempted = 0;
  let errors = 0;
  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    attempted++;
    try {
      const rawItems = await fetchFeed(
        googleNewsUrl(kw, country.language, country.gl, country.ceid),
      );
      for (const raw of rawItems) items.push(toNewsItem(raw, source, country.code, kw));
    } catch (err) {
      errors++;
      console.error(`  ⚠️ 关键词「${kw}」抓取失败：${(err as Error).message}`);
    }
    // 相邻请求之间留间隔，降低触发 Google 限流的概率
    if (i < keywords.length - 1) await sleep(REQUEST_DELAY_MS);
  }
  if (attempted > 0 && errors === attempted) {
    throw new Error(`「${source.name}」全部 ${attempted} 个关键词抓取失败（疑似被 Google 限流）`);
  }
  return items;
}

// 抓取单个关键词（给关键词回测/报告用，独立于 sources 配置）
export async function fetchKeyword(countryCode: string, keyword: string): Promise<NewsItem[]> {
  const country = countries.find((c) => c.code === countryCode);
  if (!country) return [];
  const source: Source = {
    id: `kw-${countryCode.toLowerCase()}`,
    name: `关键词「${keyword}」`,
    type: 'google_news',
    language: country.language,
    countries: [countryCode],
    enabled: true,
  };
  const rawItems = await fetchFeed(googleNewsUrl(keyword, country.language, country.gl, country.ceid));
  return rawItems.map((raw) => toNewsItem(raw, source, country.code, keyword));
}

// 去重：同 URL 只留一条（说明书 6.3）
export function dedup(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    if (!it.url || seen.has(it.url)) continue;
    seen.add(it.url);
    out.push(it);
  }
  return out;
}

// 只保留最近 7 天（说明书 6.3「每周运行一次，抓上周一到这周一之间的新闻」）
export function filterLast7Days(items: NewsItem[]): NewsItem[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return items.filter((it) => {
    if (!it.publishedAt) return true; // 没有时间的先保留
    const t = Date.parse(it.publishedAt);
    return Number.isNaN(t) || t >= cutoff;
  });
}

// 只保留某个完整周（周一到周日）的内容（说明书 6.3 / 11.3）
export function filterByWeek(items: NewsItem[], week: string): NewsItem[] {
  const { start, end } = weekRange(week);
  return items.filter((it) => {
    if (!it.publishedAt) return true; // 没有时间的先保留
    const t = Date.parse(it.publishedAt);
    return Number.isNaN(t) || (t >= start.getTime() && t < end.getTime());
  });
}
