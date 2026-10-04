// 关键词报告：逐个抓取「新加的连锁渠道 + KOL/代言人」关键词，统计各自
// 抓回多少条（去重后、落在目标周内）、其中多少被判相关、多少被丢弃。
import 'dotenv/config';
import { fetchKeyword, dedup, filterByWeek, type NewsItem } from '../lib/fetch';
import { classifyItem } from '../lib/analyze';
import { loadBrands } from '../lib/brands';
import { weekOf, previousWeek } from '../lib/week';

const CONCURRENCY = 3;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

const NEW_KEYWORDS: { country: string; kw: string; meaning: string }[] = [
  { country: 'VN', kw: 'Watsons mỹ phẩm', meaning: '屈臣氏·化妆品' },
  { country: 'VN', kw: 'Guardian mỹ phẩm', meaning: 'Guardian·化妆品' },
  { country: 'VN', kw: 'Hasaki', meaning: 'Hasaki 越南美妆连锁' },
  { country: 'VN', kw: 'đại sứ thương hiệu mỹ phẩm', meaning: '美妆品牌代言人' },
  { country: 'VN', kw: 'KOL mỹ phẩm', meaning: '美妆 KOL/达人' },
  { country: 'ID', kw: 'Watsons kosmetik', meaning: '屈臣氏·化妆品' },
  { country: 'ID', kw: 'Guardian kosmetik', meaning: 'Guardian·化妆品' },
  { country: 'ID', kw: 'brand ambassador kosmetik', meaning: '化妆品品牌代言人' },
  { country: 'ID', kw: 'kol kecantikan', meaning: '美妆 KOL/达人' },
  { country: 'TH', kw: 'Watsons เครื่องสำอาง', meaning: '屈臣氏·化妆品' },
  { country: 'TH', kw: 'Guardian เครื่องสำอาง', meaning: 'Guardian·化妆品' },
  { country: 'TH', kw: 'พรีเซนเตอร์ เครื่องสำอาง', meaning: '化妆品品牌代言人' },
  { country: 'TH', kw: 'บิวตี้บล็อกเกอร์ เครื่องสำอาง', meaning: '美妆博主/KOL' },
  { country: 'PH', kw: 'Watsons beauty Philippines', meaning: '屈臣氏·美妆' },
  { country: 'PH', kw: 'Guardian beauty Philippines', meaning: 'Guardian·美妆' },
  { country: 'PH', kw: 'beauty brand ambassador Philippines', meaning: '美妆品牌代言人' },
  { country: 'PH', kw: 'beauty influencer Philippines', meaning: '美妆达人/KOL' },
  { country: 'MY', kw: 'Watsons kosmetik', meaning: '屈臣氏·化妆品' },
  { country: 'MY', kw: 'Guardian kosmetik', meaning: 'Guardian·化妆品' },
  { country: 'MY', kw: 'duta jenama kosmetik', meaning: '化妆品品牌代言人' },
  { country: 'MY', kw: 'influencer kecantikan', meaning: '美妆达人/KOL' },
  { country: 'SG', kw: 'Watsons beauty Singapore', meaning: '屈臣氏·美妆' },
  { country: 'SG', kw: 'Guardian beauty Singapore', meaning: 'Guardian·美妆' },
  { country: 'SG', kw: 'beauty brand ambassador Singapore', meaning: '美妆品牌代言人' },
  { country: 'SG', kw: 'beauty influencer Singapore', meaning: '美妆达人/KOL' },
];

async function main() {
  const brands = await loadBrands();
  const brandNames = brands.map((b) => b.name);
  const week = previousWeek(weekOf(new Date()));

  console.log(`目标周次：${week}（只统计落在这一周的条目）\n`);

  // 逐个关键词抓取 + 去重 + 按周过滤
  const perKw: { meta: (typeof NEW_KEYWORDS)[number]; items: NewsItem[] }[] = [];
  for (const meta of NEW_KEYWORDS) {
    let items: NewsItem[] = [];
    try {
      items = filterByWeek(dedup(await fetchKeyword(meta.country, meta.kw)), week);
    } catch (e) {
      console.error(`  ⚠️ ${meta.country}「${meta.kw}」抓取失败：${(e as Error).message}`);
    }
    perKw.push({ meta, items });
  }

  // 对每个关键词的条目做筛选分类，统计相关/丢弃
  console.log('抓取完成，开始分类……\n');
  const rows: string[] = [];
  let totalFetched = 0, totalRelevant = 0, totalDiscarded = 0;
  for (const { meta, items } of perKw) {
    const results = await mapLimit(items, CONCURRENCY, (it) => classifyItem(it, brandNames));
    let relevant = 0, discarded = 0;
    for (const c of results) {
      if (c === null) continue; // 格式不合规跳过，不计
      if (c.relevant) relevant++;
      else discarded++;
    }
    totalFetched += items.length;
    totalRelevant += relevant;
    totalDiscarded += discarded;
    rows.push(
      `  ${meta.country} · ${meta.kw}（${meta.meaning}）：抓回 ${items.length} → 相关 ${relevant} · 丢弃 ${discarded}`,
    );
  }

  console.log(rows.join('\n'));
  console.log(`\n===== 新关键词合计 =====`);
  console.log(`抓回 ${totalFetched} · 相关 ${totalRelevant} · 丢弃 ${totalDiscarded}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
