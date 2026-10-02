/**
 * 插入两周示例数据 + 两期示例周刊（说明书 14.2）。
 * 品牌一律虚构（如「示例品牌A」），界面上标注「示例数据」，不冒充真实新闻。
 *
 *   npx tsx scripts/seed-demo.ts
 */
import { prisma } from '../lib/db';

type SeedItem = {
  country: string;
  section: 'market' | 'policy';
  category: string;
  brands: string[];
  impact?: 'high' | 'medium' | 'low';
  affected?: 'all' | 'cn_brands' | 'specific';
  title: string;
  snippet: string;
  oneLine: string;
  what: string;
  why: string;
  imply: string;
};

const LANG: Record<string, string> = { VN: 'vi', ID: 'id', TH: 'th', PH: 'en', MY: 'ms', SG: 'en', multi: 'en' };

const WEEK_LATEST: SeedItem[] = [
  {
    country: 'VN', section: 'policy', category: '注册备案',
    brands: [], impact: 'high', affected: 'all',
    title: '越南更新进口化妆品备案流程，简化中小企业申报',
    snippet: '越南药品管理局发布新规，简化进口化妆品备案所需材料。',
    oneLine: '越南简化进口化妆品备案流程，降低进入门槛',
    what: '越南药品管理局更新进口化妆品备案流程，减少中小企业申报所需材料。',
    why: '备案是进口化妆品在越南上市的前置条件，流程简化意味着新品牌进入越南的合规成本下降。',
    imply: '计划进入越南的中国品牌可趁流程简化窗口，加快备案节奏，抢先铺货。',
  },
  {
    country: 'VN', section: 'market', category: '新品上市',
    brands: ['示例品牌A'],
    title: '示例品牌A 在越南推出新款眼膜系列',
    snippet: '示例品牌A 宣布其新眼膜系列在越南首发。',
    oneLine: '示例品牌A 在越南首发新款眼膜',
    what: '示例品牌A 宣布新款眼膜系列在越南市场首发，主打平价。',
    why: '眼膜是出海美妆在越南的高增长细分，平价定位贴合当地价格敏感人群。',
    imply: '同赛道品牌需关注其定价和渠道，评估是否跟进差异化产品。',
  },
  {
    country: 'VN', section: 'market', category: '渠道动作',
    brands: ['示例品牌A'],
    title: '示例品牌A 进驻越南连锁药妆店，从线上走向线下',
    snippet: '示例品牌A 眼膜系列进驻越南某连锁药妆店门店。',
    oneLine: '示例品牌A 进驻越南连锁药妆店，布局线下',
    what: '示例品牌A 宣布其眼膜系列进驻越南某连锁药妆店的门店。',
    why: '此前主要靠 TikTok Shop 销售，进驻线下意味着它开始覆盖不常网购的人群。',
    imply: '以线上为主的中国眼膜品牌需关注线下渠道竞争，评估与当地连锁合作的门槛。',
  },
  {
    country: 'VN', section: 'market', category: '价格与促销',
    brands: ['示例品牌B'],
    title: '示例品牌B 眼膜在 TikTok Shop 越南站大促五折',
    snippet: '示例品牌B 眼膜在 TikTok Shop 越南站进行限时五折促销。',
    oneLine: '示例品牌B 眼膜 TikTok Shop 越南站五折促销',
    what: '示例品牌B 眼膜在 TikTok Shop 越南站发起限时五折促销。',
    why: '价格战是越南美妆市场的常态，五折促销反映品牌在抢占份额时愿意牺牲毛利。',
    imply: '跟进降价可能陷入价格战，建议用套装或赠品替代直接降价。',
  },
  {
    country: 'ID', section: 'policy', category: '清真认证',
    brands: [], impact: 'high', affected: 'all',
    title: '印尼化妆品清真认证强制要求进入倒计时',
    snippet: '印尼规定化妆品清真认证强制实施时间表即将生效。',
    oneLine: '印尼化妆品清真认证强制要求进入倒计时',
    what: '印尼化妆品清真认证强制实施的时间表即将生效。',
    why: '清真认证是进入印尼市场的硬门槛，未认证产品将被禁止销售。',
    imply: '中国品牌进入印尼前应尽早启动清真认证，避免产品上市被延误。',
  },
  {
    country: 'ID', section: 'market', category: '市场格局',
    brands: ['示例品牌C'],
    title: '机构发布印尼护肤品牌排行榜，本土品牌仍占主导',
    snippet: '某机构发布印尼护肤品牌排行，本土品牌 Wardah 领跑。',
    oneLine: '印尼护肤榜本土品牌占主导，出海品牌仍靠性价比',
    what: '某机构发布印尼护肤品牌排行榜，本土品牌占据头部。',
    why: '本土品牌在渠道和清真认证上占优，出海品牌主要靠性价比和社媒营销切入。',
    imply: '进入印尼应避开与本土头部正面竞争，从细分品类或线上渠道切入。',
  },
  {
    country: 'ID', section: 'market', category: '新品上市',
    brands: ['示例品牌C'],
    title: '示例品牌C 在印尼推出美白精华',
    snippet: '示例品牌C 在印尼市场推出美白精华产品。',
    oneLine: '示例品牌C 在印尼推出美白精华',
    what: '示例品牌C 在印尼市场推出美白精华产品。',
    why: '美白是东南亚美妆的高频需求，印尼市场竞争激烈。',
    imply: '美白品类需求稳定，但需注意宣传合规（避免使用「漂白」等负面表述）。',
  },
  {
    country: 'TH', section: 'market', category: '价格与促销',
    brands: ['示例品牌A'],
    title: '泰国大促期间示例品牌A 美白套装热销',
    snippet: '泰国促销季，示例品牌A 美白套装成为畅销单品。',
    oneLine: '示例品牌A 美白套装泰国大促热销',
    what: '泰国促销季期间，示例品牌A 的美白套装成为畅销单品。',
    why: '套装销售能提升客单价，是泰国大促的常见打法。',
    imply: '泰国大促节点值得提前备货，用套装组合提升客单价。',
  },
  {
    country: 'TH', section: 'policy', category: '关税与税费',
    brands: [], impact: 'medium', affected: 'cn_brands',
    title: '泰国对跨境小额包裹开始征税',
    snippet: '泰国对进口跨境小额包裹征收增值税。',
    oneLine: '泰国对跨境小额包裹征税，影响跨境直发',
    what: '泰国开始对进口跨境小额包裹征收增值税。',
    why: '跨境直发模式下价格优势被削弱，合规成本上升。',
    imply: '依赖跨境直发的品牌需评估是否转为本地备货或调整定价。',
  },
  {
    country: 'PH', section: 'market', category: '渠道动作',
    brands: ['示例品牌B'],
    title: '示例品牌B 入驻菲律宾 Shopee 官方旗舰店',
    snippet: '示例品牌B 在菲律宾 Shopee 开设官方旗舰店。',
    oneLine: '示例品牌B 入驻菲律宾 Shopee',
    what: '示例品牌B 在菲律宾 Shopee 开设官方旗舰店。',
    why: 'Shopee 是菲律宾主流电商平台，开设旗舰店能获得流量扶持和信任背书。',
    imply: '菲律宾市场可优先入驻 Shopee 旗舰店，配合平台大促获取早期流量。',
  },
  {
    country: 'MY', section: 'market', category: '营销投放',
    brands: ['示例品牌A'],
    title: '示例品牌A 签约马来西亚美妆 KOL 合作',
    snippet: '示例品牌A 与马来西亚多位美妆 KOL 合作推广。',
    oneLine: '示例品牌A 签约马来西亚 KOL 推广',
    what: '示例品牌A 与马来西亚多位美妆 KOL 合作推广其产品。',
    why: 'KOL 种草是东南亚美妆起量的关键，本地化内容转化率更高。',
    imply: '进入新市场时，优先与本地中腰部 KOL 合作，性价比高于头部。',
  },
  {
    country: 'SG', section: 'market', category: '市场格局',
    brands: [],
    title: '报告称新加坡美妆市场稳步增长',
    snippet: '某报告显示新加坡美妆市场保持稳定增长。',
    oneLine: '新加坡美妆市场稳步增长',
    what: '某行业报告显示新加坡美妆市场保持稳定增长。',
    why: '新加坡市场体量小但消费力强，是高端与跨境品牌的重要试验场。',
    imply: '新加坡可作为高端产品或新概念的首发测试市场。',
  },
  {
    country: 'multi', section: 'market', category: '市场格局',
    brands: ['示例品牌A', '示例品牌B'],
    title: '中国消费品牌在东南亚崛起趋势明显',
    snippet: '多家媒体关注中国消费品牌在东南亚市场的崛起。',
    oneLine: '中国消费品牌在东南亚整体崛起',
    what: '多家媒体报道中国消费品牌在东南亚市场快速崛起。',
    why: '中国品牌凭借供应链和社媒打法，在东南亚多个品类快速起量。',
    imply: '整体趋势有利于中国美妆品牌出海，但竞争也在加剧，需差异化定位。',
  },
];

const WEEK_PREV: SeedItem[] = [
  {
    country: 'VN', section: 'market', category: '营销投放',
    brands: ['示例品牌B'],
    title: '示例品牌B 签约越南女明星代言',
    snippet: '示例品牌B 官宣越南女明星为品牌代言人。',
    oneLine: '示例品牌B 签约越南明星代言',
    what: '示例品牌B 官宣越南女明星为品牌代言人。',
    why: '明星代言能快速提升品牌知名度，越南市场对本土明星认可度高。',
    imply: '预算充足的品牌可考虑本土明星代言，快速建立信任。',
  },
  {
    country: 'VN', section: 'market', category: '市场格局',
    brands: ['示例品牌C'],
    title: '越南护肤市场份额报告：本土品牌份额上升',
    snippet: '报告显示越南护肤市场本土品牌份额上升。',
    oneLine: '越南护肤市场本土品牌份额上升',
    what: '某报告显示越南护肤市场本土品牌份额有所上升。',
    why: '本土品牌在渠道下沉和本地化上占优，份额持续提升。',
    imply: '中国品牌进入越南需更强调本地化，而非仅靠价格。',
  },
  {
    country: 'VN', section: 'market', category: '新品上市',
    brands: ['示例品牌C'],
    title: '示例品牌C 在越南推出护肤套装',
    snippet: '示例品牌C 在越南推出针对敏感肌的护肤套装。',
    oneLine: '示例品牌C 在越南推出敏感肌护肤套装',
    what: '示例品牌C 在越南推出针对敏感肌的护肤套装。',
    why: '敏感肌是越南护肤的高频细分需求，套装能提升客单价。',
    imply: '敏感肌细分和套装组合值得关注，可与美白形成互补。',
  },
  {
    country: 'VN', section: 'policy', category: '成分与标签',
    brands: [], impact: 'medium', affected: 'specific',
    title: '越南拟调整化妆品标签成分标注要求',
    snippet: '越南拟要求化妆品标签更清晰地标注成分。',
    oneLine: '越南拟调整化妆品标签成分标注要求',
    what: '越南拟要求化妆品标签更清晰地标注成分信息。',
    why: '标签合规是产品上市的基础，规则变化会影响包装和上市节奏。',
    imply: '出口越南前需核对标签成分标注，避免因不合规被拒。',
  },
  {
    country: 'ID', section: 'market', category: '渠道动作',
    brands: ['示例品牌B'],
    title: '示例品牌B 进驻印尼连锁美妆店',
    snippet: '示例品牌B 产品进驻印尼某连锁美妆店。',
    oneLine: '示例品牌B 进驻印尼连锁美妆店',
    what: '示例品牌B 产品进驻印尼某连锁美妆店。',
    why: '线下连锁能触达不网购的人群，是印尼市场的重要补充渠道。',
    imply: '印尼线下渠道值得评估，但需考虑入驻成本和账期。',
  },
  {
    country: 'ID', section: 'market', category: '价格与促销',
    brands: ['示例品牌A'],
    title: '示例品牌A 印尼站参与平台大促',
    snippet: '示例品牌A 在印尼电商平台大促中推出满减活动。',
    oneLine: '示例品牌A 参与印尼平台大促',
    what: '示例品牌A 在印尼电商平台大促中推出满减活动。',
    why: '平台大促是印尼电商的重要成交节点，满减能提升连带率。',
    imply: '配合平台大促节奏备货，是印尼市场起量的常用打法。',
  },
  {
    country: 'TH', section: 'market', category: '新品上市',
    brands: ['示例品牌C'],
    title: '示例品牌C 在泰国推出眼膜新品',
    snippet: '示例品牌C 在泰国市场推出眼膜新品。',
    oneLine: '示例品牌C 在泰国推出眼膜新品',
    what: '示例品牌C 在泰国市场推出眼膜新品。',
    why: '泰国美妆市场成熟，眼膜细分仍有增长空间。',
    imply: '泰国可作为眼膜产品的第二个重点市场，与越南形成协同。',
  },
  {
    country: 'PH', section: 'market', category: '营销投放',
    brands: ['示例品牌A'],
    title: '示例品牌A 在菲律宾发起 TikTok 挑战赛',
    snippet: '示例品牌A 在菲律宾发起 TikTok 挑战赛活动。',
    oneLine: '示例品牌A 菲律宾发起 TikTok 挑战赛',
    what: '示例品牌A 在菲律宾发起 TikTok 挑战赛活动。',
    why: '挑战赛能激发用户自传播，在菲律宾年轻人中效果明显。',
    imply: '菲律宾市场可多用 TikTok 挑战赛等互动玩法，降低获客成本。',
  },
  {
    country: 'MY', section: 'market', category: '渠道动作',
    brands: ['示例品牌B'],
    title: '示例品牌B 入驻马来西亚 Lazada',
    snippet: '示例品牌B 在马来西亚 Lazada 开设店铺。',
    oneLine: '示例品牌B 入驻马来西亚 Lazada',
    what: '示例品牌B 在马来西亚 Lazada 开设店铺。',
    why: 'Lazada 在马来西亚有较高市占，入驻可覆盖更广人群。',
    imply: '马来西亚可同时布局 Lazada 和 Shopee，覆盖不同人群。',
  },
  {
    country: 'SG', section: 'policy', category: '成分与标签',
    brands: [], impact: 'low', affected: 'all',
    title: '新加坡更新化妆品成分安全指引',
    snippet: '新加坡卫生科学局更新化妆品成分安全指引。',
    oneLine: '新加坡更新化妆品成分安全指引',
    what: '新加坡卫生科学局更新化妆品成分安全指引。',
    why: '新加坡监管严格，成分安全指引更新会影响产品合规审核。',
    imply: '进入新加坡需严格对照最新指引，确保成分合规。',
  },
  {
    country: 'ID', section: 'policy', category: '执法与打假',
    brands: [], impact: 'medium', affected: 'cn_brands',
    title: '印尼查处一批假冒进口化妆品',
    snippet: '印尼执法部门查处一批假冒进口化妆品。',
    oneLine: '印尼查处假冒进口化妆品，警示渠道合规',
    what: '印尼执法部门查处一批假冒进口化妆品。',
    why: '假冒产品会冲击正品价格体系，也会连累品牌声誉。',
    imply: '中国品牌需加强渠道和货源管理，避免被假冒产品牵连。',
  },
  {
    country: 'multi', section: 'market', category: '市场格局',
    brands: [],
    title: '东南亚美妆市场规模持续扩大',
    snippet: '多份报告显示东南亚美妆市场整体规模持续扩大。',
    oneLine: '东南亚美妆市场规模持续扩大',
    what: '多份报告显示东南亚美妆市场整体规模持续扩大。',
    why: '市场扩容为出海品牌提供增长空间，但也吸引更多竞争者。',
    imply: '应尽快在重点国家建立先发优势，而非等市场成熟后再进入。',
  },
];

function toPrismaItem(data: SeedItem, week: string, id: string) {
  return {
    id,
    urls: JSON.stringify([`https://example.com/sample/${id}`]),
    titleOriginal: data.title,
    snippetOriginal: data.snippet,
    source: '示例新闻',
    sourceType: 'google_news',
    language: LANG[data.country] ?? 'en',
    country: data.country,
    publishedAt: `${week}T09:00:00Z`,
    section: data.section,
    category: data.category,
    brands: JSON.stringify(data.brands),
    impactLevel: data.impact ?? null,
    affected: data.affected ?? null,
    oneLine: data.oneLine,
    whatHappened: data.what,
    whyItMatters: data.why,
    implications: data.imply,
    week,
    isSample: true,
  };
}

async function main() {
  const latestWeek = '2026-09-21';
  const prevWeek = '2026-09-14';

  // 有真实数据时示例数据不会被显示，避免和真实数据并存（加 --force 可强制插入）
  const realCount = await prisma.item.count({ where: { isSample: false } });
  if (realCount > 0 && !process.argv.includes('--force')) {
    console.log('数据库里已有真实数据，示例数据不会再被显示。');
    console.log('如确需重新插入示例数据，请先清空真实数据，或加 --force 强制插入。');
    return;
  }

  await prisma.item.deleteMany({ where: { isSample: true } });
  await prisma.issue.deleteMany({ where: { isSample: true } });
  console.log(`插入示例数据：${latestWeek}（${WEEK_LATEST.length} 条）、${prevWeek}（${WEEK_PREV.length} 条）\n`);

  const latestItems = WEEK_LATEST.map((d, i) => toPrismaItem(d, latestWeek, `sample-l-${i}`));
  const prevItems = WEEK_PREV.map((d, i) => toPrismaItem(d, prevWeek, `sample-p-${i}`));
  await prisma.item.createMany({ data: [...latestItems, ...prevItems] });

  const issues = [
    {
      week: latestWeek,
      issueNumber: 2,
      top3: JSON.stringify([
        { id: 'sample-l-0', line: '越南简化进口化妆品备案流程，降低进入门槛' },
        { id: 'sample-l-4', line: '印尼化妆品清真认证强制要求进入倒计时' },
        { id: 'sample-l-2', line: '示例品牌A 进驻越南连锁药妆店，布局线下' },
      ]),
      policySummary:
        '本周越南更新进口化妆品备案流程、印尼清真认证强制要求临近生效、泰国对跨境小额包裹开始征税，合规与税负变化集中，建议出海团队逐项核对目标市场的最新要求。',
      isSample: true,
    },
    {
      week: prevWeek,
      issueNumber: 1,
      top3: JSON.stringify([
        { id: 'sample-p-1', line: '越南护肤市场本土品牌份额上升' },
        { id: 'sample-p-10', line: '印尼查处假冒进口化妆品，警示渠道合规' },
        { id: 'sample-p-0', line: '示例品牌B 签约越南明星代言' },
      ]),
      policySummary:
        '本周越南拟调整化妆品标签成分标注、新加坡更新成分安全指引、印尼查处假冒进口化妆品，多为成分与标签层面的合规收紧，暂无重大准入门槛变化。',
      isSample: true,
    },
  ];

  for (const issue of issues) {
    await prisma.issue.upsert({
      where: { week: issue.week },
      create: issue,
      update: issue,
    });
    console.log(`  第 ${issue.issueNumber} 期（${issue.week}）`);
  }

  console.log('\n完成。运行 `npm run dev` 查看。');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
