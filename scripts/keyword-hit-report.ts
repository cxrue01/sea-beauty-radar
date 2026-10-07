// 关键词命中报告（基于数据库）：统计回补的四周里，每个新关键词的相关条目命中数。
// 用法：
//   DATABASE_URL="file:../data/prod.db" npx tsx scripts/keyword-hit-report.ts
// 命中数 = 数据库里 keyword 精确匹配的相关条目数（政策+市场都算）。
import 'dotenv/config';
import { prisma } from '../lib/db';
import { NEW_KEYWORDS, type NewKeyword } from '../config/new-keywords';
import { countries } from '../config/keywords';
import { formatWeekRange } from '../lib/week';

const WEEKS = ['2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'];

async function main() {
  const rows = await prisma.item.findMany({
    where: { keyword: { not: null } },
    select: { keyword: true, week: true },
  });

  // keyword -> week -> count
  const byKw = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const kw = r.keyword!;
    if (!byKw.has(kw)) byKw.set(kw, new Map());
    const m = byKw.get(kw)!;
    m.set(r.week, (m.get(r.week) ?? 0) + 1);
  }
  const countIn = (kw: string, week: string) => byKw.get(kw)?.get(week) ?? 0;

  // 按关键词字符串去重（Watsons/Guardian kosmetik 在印尼和马来共用同一词）
  const seen = new Set<string>();
  const unique: NewKeyword[] = [];
  for (const k of NEW_KEYWORDS) {
    if (seen.has(k.kw)) continue;
    seen.add(k.kw);
    unique.push(k);
  }

  const countryName: Record<string, string> = Object.fromEntries(countries.map((c) => [c.code, c.name]));

  console.log('===== 五周新关键词命中报告（相关条目数） =====\n');
  console.log(`周次：${WEEKS.map((w) => formatWeekRange(w)).join(' ｜ ')}\n`);

  const order = countries.map((c) => c.code);
  let zeroCount = 0;
  const zeroList: string[] = [];

  for (const code of order) {
    const list = unique.filter((k) => k.country === code);
    if (list.length === 0) continue;
    console.log(`【${countryName[code]}】`);
    for (const k of list) {
      const perWeek = WEEKS.map((w) => countIn(k.kw, w));
      const total = perWeek.reduce((a, b) => a + b, 0);
      if (total === 0) {
        zeroCount++;
        zeroList.push(k.kw);
      }
      const mark = total === 0 ? '  ★ 零命中' : '';
      console.log(`  ${k.kw}（${k.meaning}）：${perWeek.join(' / ')} ｜ 合计 ${total}${mark}`);
    }
    console.log('');
  }

  console.log('===== 小结 =====');
  console.log(`新关键词 ${unique.length} 个（去重后）里，五周零命中 ${zeroCount} 个。`);
  if (zeroList.length) console.log(`建议删除：${zeroList.join('、')}`);
  console.log('\n注：Watsons kosmetik / Guardian kosmetik 在印尼和马来共用同一词，按词去重统计。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
