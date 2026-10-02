// 阶段 3 测试脚本：抓一小批真实新闻，跑「筛选分类 → 合并 → 三段式解读 → 每周汇总」，
// 把结果整理成表格供人工审核。
//
// 用法：
//   npx tsx scripts/test-analyze.ts                    # 全部数据源，取前 15 条
//   npx tsx scripts/test-analyze.ts --vn               # 只跑越南
//   npx tsx scripts/test-analyze.ts --limit 20         # 取前 20 条
//   npx tsx scripts/test-analyze.ts --per-country 5    # 6 国各抽 5 条
import 'dotenv/config';
import { sources, type Source } from '../config/sources';
import { countries } from '../config/keywords';
import { fetchSource, dedup, filterLast7Days, type NewsItem } from '../lib/fetch';
import type { Brand } from '../config/brands';
import { loadBrands } from '../lib/brands';
import {
  classifyItem,
  interpretItem,
  mergeSimilar,
  summarizeWeek,
  type RelevantItem,
  type SummaryInput,
} from '../lib/analyze';

const TIER_LABEL: Record<string, string> = {
  direct: '直接竞品',
  benchmark: '出海标杆',
  local_leader: '当地头部',
  own: '自家品牌',
};
const ORIGIN_LABEL: Record<string, string> = { CN: '中国', local: '本土', KR: '韩国', global: '国际' };

const countryMeta = new Map(countries.map((c) => [c.code, c]));

function brandLabel(name: string, brandByName: Map<string, Brand>): string {
  const b = brandByName.get(name);
  if (!b) return name;
  return `${name}[${TIER_LABEL[b.tier] ?? b.tier}·${ORIGIN_LABEL[b.origin] ?? b.origin}]`;
}

async function fetchRecent(source: Source): Promise<NewsItem[]> {
  try {
    return filterLast7Days(dedup(await fetchSource(source)));
  } catch (e) {
    console.error(`  ❌ ${source.name} 失败：${(e as Error).message}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const onlyVN = args.includes('--vn');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 && Number(args[limitIdx + 1]) > 0 ? Number(args[limitIdx + 1]) : 15;
  const pcIdx = args.indexOf('--per-country');
  const perCountry = pcIdx >= 0 && Number(args[pcIdx + 1]) > 0 ? Number(args[pcIdx + 1]) : 0;

  const brands = await loadBrands();
  const brandNames = brands.map((b) => b.name);
  const brandByName = new Map(brands.map((b) => [b.name, b]));

  console.log('===== 阶段 3 测试：AI 筛选 / 分类 / 三段式解读 =====\n');
  console.log(`服务商：${process.env.LLM_PROVIDER ?? 'deepseek'}\n`);

  // 抓新闻
  let sample: NewsItem[];
  if (perCountry > 0) {
    const countrySources = sources.filter((s) => s.type === 'google_news' && s.countries.length === 1);
    console.log(`模式：6 国各抽 ${perCountry} 条\n`);
    const picked: NewsItem[] = [];
    for (const s of countrySources) {
      const recent = await fetchRecent(s);
      picked.push(...recent.slice(0, perCountry));
    }
    sample = picked;
  } else {
    const targets = onlyVN
      ? sources.filter((s) => s.countries.length === 1 && s.countries[0] === 'VN')
      : sources.filter((s) => s.enabled);
    console.log(`数据源：${targets.map((s) => s.name).join('、')}\n`);
    const all: NewsItem[] = [];
    for (const s of targets) all.push(...(await fetchRecent(s)));
    sample = all.slice(0, limit);
  }
  console.log(`共 ${sample.length} 条进入测试\n`);

  // 第一步：筛选 + 分类
  console.log('----- 第一步：筛选 + 分类 -----\n');
  const relevant: RelevantItem[] = [];
  const discarded: NewsItem[] = [];
  const skipped: NewsItem[] = [];

  for (const item of sample) {
    const c = await classifyItem(item, brandNames);
    if (c === null) skipped.push(item);
    else if (!c.relevant) discarded.push(item);
    else relevant.push({ ...item, classification: c });
  }

  // 按抓取来源国家分组打印
  const byCountry = new Map<string, RelevantItem[]>();
  for (const it of relevant) {
    const arr = byCountry.get(it.country) ?? [];
    arr.push(it);
    byCountry.set(it.country, arr);
  }
  for (const [code, list] of byCountry) {
    const meta = countryMeta.get(code);
    console.log(`【${meta?.flag ?? ''} ${meta?.name ?? code}】${list.length} 条相关`);
    for (const it of list) {
      const c = it.classification;
      const brandsStr = (c.brands ?? []).map((b) => brandLabel(b, brandByName)).join('、');
      const policyStr = c.section === 'policy' ? `｜影响 ${c.impact_level}｜对象 ${c.affected}` : '';
      const mismatch = c.country !== code ? ` ⚠️AI国别=${c.country}` : '';
      console.log(`  ${c.section === 'policy' ? '⚖️ 政策' : '📈 市场'} · ${c.category}${policyStr}${mismatch}`);
      console.log(`     品牌：${brandsStr || '（无）'}｜标题：${it.title}`);
    }
  }
  console.log('');
  console.log(`【判为无关、丢弃】${discarded.length} 条`);
  for (const it of discarded) console.log(`  ✗ [${it.country}] ${it.title}`);
  if (skipped.length) {
    console.log('');
    console.log(`【AI 返回不合规、跳过】${skipped.length} 条`);
    for (const it of skipped) console.log(`  ⚠️ [${it.country}] ${it.title}`);
  }

  if (relevant.length === 0) {
    console.log('\n没有相关条目，测试结束。');
    return;
  }

  // 第二步：标题相似合并（同国家内，分类不一致时重新分类）
  console.log('\n----- 第二步：标题相似合并（同国家内） -----\n');
  const merged = await mergeSimilar(relevant, brandNames);
  const mergedMulti = merged.filter((g) => g.members.length > 1);
  console.log(`相关 ${relevant.length} 条 → 合并后 ${merged.length} 组（其中 ${mergedMulti.length} 组由多条合并）`);
  for (const g of mergedMulti) {
    console.log(`  🔗 合并 ${g.members.length} 条 →「${g.title.slice(0, 50)}」`);
    for (const m of g.members) console.log(`       - ${m.title.slice(0, 50)}（${m.source}）`);
  }

  // 第三步：三段式解读
  console.log('\n----- 第三步：三段式解读 -----\n');
  const summaryInputs: SummaryInput[] = [];
  for (const g of merged) {
    const c = g.classification;
    const itemForAI: NewsItem = {
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
    const interp = await interpretItem(itemForAI, c);
    if (!interp) continue;
    summaryInputs.push({
      one_line: interp.one_line,
      country: g.country,
      category: c.category ?? '',
      section: c.section ?? 'market',
      impact_level: c.impact_level,
      brands: c.brands ?? [],
      isBenchmark: (c.brands ?? []).some((b) => brandByName.has(b)),
    });

    const brandsStr = (c.brands ?? []).map((b) => brandLabel(b, brandByName)).join('、');
    console.log(`■ ${interp.one_line}`);
    console.log(`  标签：${g.country} · ${c.section === 'policy' ? '政策' : '市场'} · ${c.category} · ${brandsStr || '无品牌'}`);
    console.log(`  发生了什么：${interp.what_happened}`);
    console.log(`  为什么重要：${interp.why_it_matters}`);
    console.log(`  意味着什么：${interp.implications}`);
    console.log(`  原文：${g.title.slice(0, 60)}${g.urls.length > 1 ? `（${g.urls.length} 个来源链接）` : ''}`);
    console.log('');
  }

  // 每周汇总
  console.log('----- 每周汇总 -----\n');
  const summary = await summarizeWeek(summaryInputs);
  if (!summary) {
    console.log('（汇总生成失败）');
  } else {
    console.log('本周 3 件事：');
    summary.top3.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
    console.log(`\n政策小结：${summary.policy_summary}`);
  }

  console.log('\n===== 测试结束 =====');
}

main().catch((e) => {
  console.error(`\n测试失败：${e.message}`);
  process.exit(1);
});
