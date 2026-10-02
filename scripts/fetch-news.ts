// 抓取测试脚本（阶段 2 用）：抓新闻并打印汇总 + 标题样例
// 用法：
//   npx tsx scripts/fetch-news.ts --vn    # 只抓越南（当地新闻）
//   npx tsx scripts/fetch-news.ts         # 抓全部启用的数据源
import 'dotenv/config';
import { sources } from '../config/sources';
import { fetchSource, dedup, filterLast7Days, type NewsItem } from '../lib/fetch';

async function main() {
  const onlyVN = process.argv[2] === '--vn';
  const targets = onlyVN
    ? sources.filter((s) => s.countries.length === 1 && s.countries[0] === 'VN')
    : sources.filter((s) => s.enabled);

  console.log(`抓取目标：${targets.map((s) => s.name).join('、')}\n`);

  const allItems: NewsItem[] = [];
  for (const source of targets) {
    try {
      const items = await fetchSource(source);
      console.log(`✅ ${source.name}（${source.id}）：抓到 ${items.length} 条`);
      allItems.push(...items);
    } catch (err) {
      console.error(`❌ ${source.name}（${source.id}）失败：${(err as Error).message}`);
    }
  }

  const deduped = dedup(allItems);
  const recent = filterLast7Days(deduped);
  console.log(`\n去重前 ${allItems.length} 条，去重后 ${deduped.length} 条，最近 7 天 ${recent.length} 条\n`);

  console.log('===== 最近 7 天各数据源条数 =====');
  const recentBySource = new Map<string, NewsItem[]>();
  for (const it of recent) {
    const arr = recentBySource.get(it.sourceId) ?? [];
    arr.push(it);
    recentBySource.set(it.sourceId, arr);
  }
  for (const source of targets) {
    console.log(`  ${source.name}（${source.id}）：${recentBySource.get(source.id)?.length ?? 0} 条`);
  }
  console.log('');

  console.log('===== 标题样例（最近 7 天）=====');
  const grouped = new Map<string, NewsItem[]>();
  for (const it of recent) {
    const arr = grouped.get(it.sourceId) ?? [];
    arr.push(it);
    grouped.set(it.sourceId, arr);
  }
  for (const [sid, arr] of grouped) {
    console.log(`\n【${sid}】共 ${arr.length} 条，示例：`);
    for (const it of arr.slice(0, 6)) {
      console.log(`  - ${it.title}  （${it.source}）`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
