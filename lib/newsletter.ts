// 从数据库读出一期周刊，构建邮件并发送。
// 供 scripts/run-pipeline.ts 和 scripts/send-newsletter.ts 共用。
import { writeFile } from 'node:fs/promises';
import { prisma, toIssueView } from './db';
import {
  buildEmailHtml,
  buildSubject,
  sendIssue,
  type EmailIssue,
  type EmailItem,
  type EmailMarketGroup,
  type RunReport,
} from './email';
import { COUNTRY_LABEL, COUNTRY_ORDER } from './labels';

const IMPACT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function groupByCountry(items: EmailItem[]): EmailMarketGroup[] {
  const map = new Map<string, EmailItem[]>();
  for (const it of items) {
    const arr = map.get(it.country) ?? [];
    arr.push(it);
    map.set(it.country, arr);
  }
  const ordered = COUNTRY_ORDER.filter((c) => map.has(c));
  const extra = [...map.keys()].filter((c) => !COUNTRY_ORDER.includes(c)).sort();
  return [...ordered, ...extra].map((code) => ({
    code,
    label: COUNTRY_LABEL[code] ?? code,
    items: map.get(code)!,
  }));
}

/** 发送某一周的周刊。没有该周数据时返回 false。 */
export async function sendWeekIssue(
  week: string,
  opts?: { dryRun?: boolean; dumpTo?: string; runReport?: RunReport },
): Promise<boolean> {
  const [issue, items] = await Promise.all([
    prisma.issue.findUnique({ where: { week } }),
    prisma.item.findMany({ where: { week }, orderBy: { createdAt: 'asc' } }),
  ]);
  if (!issue) {
    console.log(`数据库里没有 ${week} 这一期周刊。`);
    return false;
  }

  const issueView = toIssueView(issue);

  const policy = items
    .filter((it) => it.section === 'policy')
    .sort(
      (a, b) =>
        (IMPACT_ORDER[a.impactLevel ?? 'low'] ?? 3) - (IMPACT_ORDER[b.impactLevel ?? 'low'] ?? 3),
    )
    .map((it): EmailItem => ({
      id: it.id,
      oneLine: it.oneLine,
      country: it.country,
      impactLevel: it.impactLevel,
    }));

  const marketItems = items
    .filter((it) => it.section === 'market')
    .map((it): EmailItem => ({ id: it.id, oneLine: it.oneLine, country: it.country }));
  const marketGroups = groupByCountry(marketItems);

  const emailIssue: EmailIssue = {
    issueNumber: issueView.issueNumber,
    week,
    top3: issueView.top3,
    policy,
    marketGroups,
  };

  const subject = buildSubject(issueView.issueNumber, week);
  const html = buildEmailHtml(emailIssue, undefined, opts?.runReport);

  if (opts?.dumpTo) {
    await writeFile(opts.dumpTo, html, 'utf8');
    console.log(`   HTML 已导出到 ${opts.dumpTo}`);
  }

  const marketCount = marketGroups.reduce((n, g) => n + g.items.length, 0);
  console.log(`准备发送：${subject}`);
  console.log(
    `  本周 3 件事 ${emailIssue.top3.length} 条 · 进入政策 ${policy.length} 条 · 市场动态 ${marketCount} 条`,
  );

  const result = await sendIssue(subject, html, { dryRun: opts?.dryRun });
  return result.sent > 0;
}
