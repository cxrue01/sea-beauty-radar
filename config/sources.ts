// 数据源插槽配置（说明书 6.1「可扩展设计」）
// 三个类型：
//   google_news       —— 关键词搜索（主干，每个国家一组关键词）
//   rss               —— 固定 RSS 订阅（如白鲸出海）
//   google_news_site  —— 用 Google News 的 site: 搜索间接抓某个站（给没有 RSS 的媒体用）

import { countries, type Country } from './keywords';

export type SourceType = 'google_news' | 'rss' | 'google_news_site';

export type Source = {
  id: string;
  name: string;
  type: SourceType;
  language: string; // hl 参数
  countries: string[]; // 覆盖国家；'multi' 表示跨国 / 不限定
  enabled: boolean;
  feedUrl?: string; // rss 类型专用
  site?: string; // google_news_site 专用：域名
  query?: string; // google_news_site 专用：附加搜索词
};

// 主干：每个国家一个 Google News 关键词搜索源（关键词见 keywords.ts）
const googleNewsSources: Source[] = countries.map((c: Country) => ({
  id: `google-news-${c.code.toLowerCase()}`,
  name: `Google News ${c.name}`,
  type: 'google_news',
  language: c.language,
  countries: [c.code],
  enabled: true,
}));

export const sources: Source[] = [
  ...googleNewsSources,

  // ② 白鲸出海（固定 RSS，说明书 6.2 ②）
  {
    id: 'baijingapp',
    name: '白鲸出海',
    type: 'rss',
    language: 'zh-CN',
    countries: ['multi'],
    enabled: true,
    feedUrl: 'https://www.baijing.cn/feed',
  },

  // ③ 无 RSS 的媒体，用 Google News 的 site: 搜索间接抓取（已测试可行）
  {
    id: 'ebrun',
    name: '亿邦动力',
    type: 'google_news_site',
    language: 'zh-CN',
    countries: ['multi'],
    enabled: true,
    site: 'ebrun.com',
    query: '美妆',
  },
  {
    id: '36kr',
    name: '36氪',
    type: 'google_news_site',
    language: 'zh-CN',
    countries: ['multi'],
    enabled: true,
    site: '36kr.com',
    query: '出海 美妆',
  },
  {
    id: 'cifnews',
    name: '雨果网',
    type: 'google_news_site',
    language: 'zh-CN',
    countries: ['multi'],
    enabled: true,
    site: 'cifnews.com',
    query: '美妆',
  },
];
