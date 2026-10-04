// 回测脚本：改分类提示词后，用历史数据回测效果。
// 取「收紧前」入库的原始条目，用新提示词重新分类，看政策/市场/丢弃的变化。
import 'dotenv/config';
import { prisma } from '../lib/db';
import { classifyItem } from '../lib/analyze';
import { loadBrands } from '../lib/brands';
import type { NewsItem } from '../lib/fetch';

async function main() {
  const brands = await loadBrands();
  const brandNames = brands.map((b) => b.name);

  const items = await prisma.item.findMany({
    where: { week: '2026-09-21' },
    orderBy: { createdAt: 'asc' },
  });
  const oldest = items[0]?.createdAt.getTime();
  const original = items.filter((i) => i.createdAt.getTime() === oldest);

  let p_still = 0, p_toMarket = 0, p_drop = 0;
  let m_still = 0, m_toPolicy = 0, m_drop = 0;
  const lines: string[] = [];

  console.log(`原始批次 ${original.length} 条，用新提示词重新分类……\n`);

  for (const it of original) {
    const news: NewsItem = {
      title: it.titleOriginal,
      url: '',
      snippet: it.snippetOriginal ?? '',
      source: it.source ?? '',
      sourceId: '',
      sourceType: it.sourceType as NewsItem['sourceType'],
      language: it.language ?? '',
      country: it.country ?? '',
      publishedAt: it.publishedAt ?? '',
    };
    const c = await classifyItem(news, brandNames);
    let result: string;
    if (c === null) {
      result = '跳过（格式不合规）';
    } else if (!c.relevant) {
      result = '丢弃';
      if (it.section === 'policy') p_drop++;
      else m_drop++;
    } else if (c.section === 'market') {
      result = `市场·${c.category}`;
      if (it.section === 'policy') p_toMarket++;
      else m_still++;
    } else {
      result = `政策·${c.category}`;
      if (it.section === 'policy') p_still++;
      else m_toPolicy++;
    }
    lines.push(`  [原${it.section === 'policy' ? '政策' : '市场'}/${it.category}] ${it.titleOriginal.slice(0, 42)} → ${result}`);
  }

  console.log(lines.join('\n'));
  console.log('\n===== 收紧后重分类结果 =====');
  console.log(`原政策 19 条 → 仍政策 ${p_still} · 改市场 ${p_toMarket} · 丢弃 ${p_drop}`);
  console.log(`原市场 13 条 → 仍市场 ${m_still} · 改政策 ${m_toPolicy} · 丢弃 ${m_drop}`);
  console.log(`收紧后合计：政策 ${p_still + m_toPolicy} · 市场 ${p_toMarket + m_still} · 丢弃 ${p_drop + m_drop}（收紧前：政策 19 / 市场 13 / 丢弃 0）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
