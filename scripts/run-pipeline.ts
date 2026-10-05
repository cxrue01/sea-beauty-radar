// 完整流水线：抓取 → AI 筛选/分类 → 标题相似合并 → 三段式解读 → 每周汇总 → 落库 → 发邮件。
// 用法：
//   npm run pipeline                  # 全部数据源，dry run（不真发邮件）
//   npm run pipeline -- --send        # 真的发邮件（需 RESEND_API_KEY）
//   npm run pipeline -- --vn          # 只跑越南（测试）
//   npm run pipeline -- --limit 20    # 只处理前 20 条（测试）
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { sources } from '../config/sources';
import { countries } from '../config/keywords';
import { fetchSource, dedup, filterByWeek, type NewsItem } from '../lib/fetch';
import { brandNameMap, loadBrands } from '../lib/brands';
import {
  classifyItem,
  interpretItem,
  mergeSimilar,
  summarizeWeek,
  type Classification,
  type Interpretation,
  type MergedGroup,
  type RelevantItem,
  type SummaryInput,
} from '../lib/analyze';
import { prisma } from '../lib/db';
import { weekOf, previousWeek, formatWeekRange } from '../lib/week';
import { sendWeekIssue } from '../lib/newsletter';
import type { RunReport } from '../lib/email';

const CONCURRENCY = 3;

// 带并发上限地跑一批异步任务，结果保持原顺序。
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function parseUrls(s: string): string[] {
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

function toNewsItem(g: MergedGroup): NewsItem {
  return {
    title: g.title,
    url: g.urls[0] ?? '',
    snippet: g.snippet,
    source: g.sources.join('、'),
    sourceId: g.members[0].sourceId,
    sourceType: g.members[0].sourceType,
    language: g.language,
    country: g.country,
    publishedAt: g.publishedAt,
  };
}

// 把汇总生成的 top3 一句话，匹配回对应的 item id（让 top3 可点击）。匹配不上就留空、只当纯文本。
function matchTop3(
  top3: string[],
  candidates: { id: string; oneLine: string }[],
): { id: string; line: string }[] {
  const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
  return top3.map((line) => {
    const nl = norm(line);
    let bestId = '';
    let bestScore = 0;
    for (const c of candidates) {
      const o = norm(c.oneLine);
      if (!o) continue;
      if (nl === o || nl.includes(o) || o.includes(nl)) {
        bestId = c.id;
        break;
      }
      const overlap = [...o].filter((ch) => nl.includes(ch)).length / Math.max(o.length, 1);
      if (overlap > bestScore && overlap >= 0.6) {
        bestScore = overlap;
        bestId = c.id;
      }
    }
    return { id: bestId, line };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const send = args.includes('--send');
  const onlyVN = args.includes('--vn');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 && Number(args[limitIdx + 1]) > 0 ? Number(args[limitIdx + 1]) : 0;

  console.log('===== 流水线启动 =====');
  console.log(`服务商：${process.env.LLM_PROVIDER ?? 'deepseek'}｜发送邮件：${send ? '是' : '否（dry run）'}\n`);

  // 本期覆盖「上一个完整周」（周一到周日），标题显示那一周的日期范围（说明书 6.3 / 11.3）。
  // 加 --week=YYYY-MM-DD 可指定回补某一周（回补只存数据、不发邮件）。
  const weekArg = argValue('week');
  const week = weekArg ?? previousWeek(weekOf(new Date()));
  console.log(`本期周次：${week}（${formatWeekRange(week)}）${weekArg ? ' [回补模式]' : ''}\n`);

  const brands = await loadBrands();
  const brandNames = brands.map((b) => b.name);
  const brandByName = brandNameMap(brands);

  // 1. 抓取
  const targets = onlyVN
    ? sources.filter((s) => s.countries.length === 1 && s.countries[0] === 'VN')
    : sources.filter((s) => s.enabled);
  console.log(`数据源（${targets.length} 个）：${targets.map((s) => s.name).join('、')}\n`);

  const sourceCounts: { name: string; fetched: number }[] = [];
  const fetched: NewsItem[] = [];
  let failedSources = 0;
  for (const s of targets) {
    try {
      const items = await fetchSource(s);
      fetched.push(...items);
      sourceCounts.push({ name: s.name, fetched: items.length });
      console.log(`  ✅ ${s.name}：${items.length} 条`);
    } catch (e) {
      failedSources++;
      sourceCounts.push({ name: s.name, fetched: 0 });
      console.error(`  ❌ ${s.name} 失败：${(e as Error).message}`);
    }
  }

  // 保险：大部分数据源失败（超过一半）→ 判为失败，避免「绿勾但什么都没干」。
  if (failedSources * 2 > targets.length) {
    console.error(
      `\n❌ 大部分数据源抓取失败（${failedSources}/${targets.length}），疑似被限流。本次运行判为失败，不生成周刊。`,
    );
    process.exitCode = 1;
    return;
  }

  const deduped = dedup(fetched);
  const recent = filterByWeek(deduped, week);

  // 2. 省 token：跳过数据库里已经分析过的 URL
  const existingRows = await prisma.item.findMany({ select: { urls: true } });
  const existingUrls = new Set(existingRows.flatMap((r) => parseUrls(r.urls)));
  const fresh = recent.filter((it) => !existingUrls.has(it.url));
  const batch = limit > 0 ? fresh.slice(0, limit) : fresh;

  console.log(
    `\n去重前 ${fetched.length} 条 → 去重后 ${deduped.length} 条 → 上一周 ${formatWeekRange(week)} ${recent.length} 条 → 跳过已分析 ${recent.length - fresh.length} 条 → 待分析 ${batch.length} 条\n`,
  );

  if (batch.length === 0) {
    console.log('没有需要分析的新条目，结束。');
    return;
  }

  // 3. 第一步：筛选 + 分类
  console.log('----- 第一步：筛选 + 分类 -----');
  const results = await mapLimit(batch, CONCURRENCY, async (item) => {
    const c = await classifyItem(item, brandNames);
    return { item, c };
  });
  const relevant: RelevantItem[] = [];
  let discarded = 0;
  let skipped = 0;
  for (const { item, c } of results) {
    if (c === null) skipped++;
    else if (!c.relevant) discarded++;
    else relevant.push({ ...item, classification: c });
  }
  console.log(`相关 ${relevant.length} 条 · 丢弃 ${discarded} 条 · 跳过（AI 格式不合规）${skipped} 条\n`);

  if (relevant.length === 0) {
    console.log('没有相关条目，结束（不生成周刊）。');
    return;
  }

  // 4. 第二步：标题相似合并（同国家内）
  console.log('----- 第二步：标题相似合并 -----');
  const merged = await mergeSimilar(relevant, brandNames);
  const mergedMulti = merged.filter((g) => g.members.length > 1);
  console.log(`相关 ${relevant.length} 条 → 合并后 ${merged.length} 组（${mergedMulti.length} 组由多条合并）\n`);

  // 5. 第三步：三段式解读
  console.log('----- 第三步：三段式解读 -----');
  const interps = await mapLimit(merged, CONCURRENCY, async (g) => {
    const interp = await interpretItem(toNewsItem(g), g.classification);
    return interp ? { group: g, interp } : null;
  });
  const interpreted = interps.filter((x): x is { group: MergedGroup; interp: Interpretation } => x !== null);
  console.log(`解读成功 ${interpreted.length} 条 / ${merged.length} 组\n`);

  if (interpreted.length === 0) {
    console.log('没有可入库的条目，结束。');
    return;
  }

  // 6. 每周汇总
  console.log('----- 每周汇总 -----');
  const summaryInputs: SummaryInput[] = interpreted.map(({ group: g, interp }) => ({
    one_line: interp.one_line,
    country: g.classification.country ?? g.country,
    category: g.classification.category ?? '',
    section: g.classification.section ?? 'market',
    impact_level: g.classification.impact_level,
    brands: g.classification.brands ?? [],
    isBenchmark: (g.classification.brands ?? []).some((b) => brandByName.has(b)),
  }));
  const summary = await summarizeWeek(summaryInputs);
  if (!summary) console.log('（每周汇总生成失败，周刊将用兜底内容）');

  // 7. 落库

  // 有真实数据了，示例数据不再显示：清掉旧的示例数据（示例数据只在完全没有真实数据时才有）
  const delItems = await prisma.item.deleteMany({ where: { isSample: true } });
  const delIssues = await prisma.issue.deleteMany({ where: { isSample: true } });
  if (delItems.count || delIssues.count) {
    console.log(`\n已清除示例数据（条目 ${delItems.count} 条 / 周刊 ${delIssues.count} 期）`);
  }

  const rows = interpreted.map(({ group: g, interp }) => {
    const c = g.classification;
    return {
      id: randomUUID(),
      urls: JSON.stringify(g.urls),
      titleOriginal: g.title,
      snippetOriginal: g.snippet || null,
      source: g.sources.join('、') || g.members[0]?.source || '',
      sourceType: g.members[0].sourceType,
      keyword: g.members[0]?.keyword ?? null,
      language: g.language,
      country: c.country ?? g.country,
      publishedAt: g.publishedAt || null,
      section: c.section ?? 'market',
      category: c.category ?? '',
      brands: JSON.stringify(c.brands ?? []),
      impactLevel: c.impact_level ?? null,
      affected: c.affected ?? null,
      oneLine: interp.one_line,
      whatHappened: interp.what_happened,
      whyItMatters: interp.why_it_matters,
      implications: interp.implications,
      week,
      isSample: false,
    };
  });

  await prisma.item.createMany({ data: rows });

  const top3Raw = summary?.top3 ?? [];
  const top3Entries = matchTop3(
    top3Raw,
    interpreted.map((it, i) => ({ id: rows[i].id, oneLine: it.interp.one_line })),
  );
  const policySummary = summary?.policy_summary ?? '本周各国无重大进入政策变化。';

  const maxIssue = await prisma.issue.aggregate({ _max: { issueNumber: true } });
  const issueNumber = (maxIssue._max.issueNumber ?? 0) + 1;

  await prisma.issue.upsert({
    where: { week },
    create: { week, issueNumber, top3: JSON.stringify(top3Entries), policySummary, isSample: false },
    update: { issueNumber, top3: JSON.stringify(top3Entries), policySummary, isSample: false },
  });

  const policyCount = rows.filter((r) => r.section === 'policy').length;
  const marketCount = rows.length - policyCount;

  // 运行报告（附在邮件底部 + 控制台）：各源条数、相关数、政策/市场数、零命中关键词。
  const hitKeywords = new Set(relevant.filter((r) => r.keyword).map((r) => r.keyword as string));
  const scopedCountries = new Set(targets.flatMap((s) => s.countries));
  const zeroHitKeywords: { country: string; keyword: string }[] = [];
  for (const c of countries) {
    if (!scopedCountries.has(c.code)) continue;
    for (const kw of [...c.market, ...c.policy]) {
      if (!hitKeywords.has(kw)) zeroHitKeywords.push({ country: c.name, keyword: kw });
    }
  }
  const runReport: RunReport = {
    sources: sourceCounts,
    relevantTotal: relevant.length,
    policyCount,
    marketCount,
    zeroHitKeywords,
  };

  console.log('\n===== 落库完成 =====');
  console.log(`周次：${week}（${formatWeekRange(week)}）· 第 ${issueNumber} 期`);
  console.log(`入库 ${rows.length} 条（政策 ${policyCount} 条 · 市场 ${marketCount} 条）`);
  if (top3Entries.length) {
    console.log('本周 3 件事：');
    top3Entries.forEach((t, i) => console.log(`  ${i + 1}. ${t.line}`));
  }
  console.log(`政策小结：${policySummary}`);

  // 运行报告（控制台）
  console.log('\n----- 运行报告 -----');
  console.log(`数据源抓取：${sourceCounts.map((s) => `${s.name} ${s.fetched} 条`).join(' · ')}`);
  console.log(`AI 判相关：${relevant.length} 条（政策 ${policyCount} · 市场 ${marketCount}）`);
  console.log(
    `零命中关键词（${zeroHitKeywords.length} 个）：${zeroHitKeywords.map((e) => `${e.country} ${e.keyword}`).join('、') || '无'}`,
  );

  // 8. 发邮件
  console.log('\n----- 发送周刊 -----');
  await sendWeekIssue(week, { dryRun: !send, runReport });

  console.log('\n===== 流水线结束 =====');
  console.log('提示：运行 `npm run dev` 后在浏览器打开 http://localhost:3000 查看。');
}

main()
  .catch((e) => {
    console.error(`\n流水线失败：${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
