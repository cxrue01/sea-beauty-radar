import { Resend } from 'resend';
import { NEWSLETTER_NAME } from './site';
import { formatWeekRange } from './week';
import { COUNTRY_LABEL, IMPACT_LABEL } from './labels';
import type { Top3Entry } from './db';

const FROM = process.env.NEWSLETTER_FROM ?? `${NEWSLETTER_NAME} <newsletter@example.com>`;
const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

export type SendResult = { sent: number; dryRun: boolean };

export type EmailItem = {
  id: string;
  oneLine: string;
  country: string;
  impactLevel?: string | null;
};

export type EmailMarketGroup = {
  code: string;
  label: string;
  items: EmailItem[];
};

export type EmailIssue = {
  issueNumber: number;
  week: string;
  top3: Top3Entry[];
  policy: EmailItem[];
  marketGroups: EmailMarketGroup[];
};

// 邮件底部的运行报告（只发给自己看，网页上不显示）。
export type RunReport = {
  sources: { name: string; fetched: number }[]; // 各数据源抓取条数
  relevantTotal: number; // AI 判为相关的条数
  policyCount: number; // 政策条数
  marketCount: number; // 市场条数
  zeroHitKeywords: { country: string; keyword: string }[]; // 零命中关键词
};

// 与 DESIGN.md 一致的配色（香槟金 + 暖深炭灰）。
const C = {
  paper: '#1c1a18',
  tint: '#262320',
  ink: '#f2efe9',
  inkSoft: '#d8d3cb',
  inkMuted: '#a8a29a',
  line: '#2e2b27',
  accent: '#d6b88f',
  accentDeep: '#e5cfa7',
};

export function buildSubject(issueNumber: number, week: string): string {
  return `${NEWSLETTER_NAME} · 第 ${issueNumber} 期（${formatWeekRange(week)}）`;
}

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function link(href: string): string {
  return `href="${esc(href)}"`;
}

function sectionTitle(text: string): string {
  return `<div style="margin:0 0 12px;font-size:15px;font-weight:600;color:${C.ink};">${text}</div>`;
}

// 零命中关键词按国家分组，拼成一行紧凑文本。
function formatZeroHit(list: RunReport['zeroHitKeywords']): string {
  if (list.length === 0) return '无';
  const byCountry = new Map<string, string[]>();
  for (const e of list) {
    const arr = byCountry.get(e.country) ?? [];
    arr.push(e.keyword);
    byCountry.set(e.country, arr);
  }
  return [...byCountry.entries()].map(([c, kws]) => `${c}：${kws.join('、')}`).join('；');
}

export function buildEmailHtml(issue: EmailIssue, siteUrl: string = SITE_URL, runReport?: RunReport): string {
  const weekRange = formatWeekRange(issue.week);
  const webUrl = `${siteUrl}/newsletter/${issue.week}`;

  // 本周 3 件事：带序号的导读，有 id 的可点进详情。
  const top3Html = issue.top3
    .map((entry, i) => {
      const num = `<span style="color:${C.accent};font-weight:600;margin-right:8px;">${i + 1}.</span>`;
      const line = entry.id
        ? `<a ${link(`${siteUrl}/item/${entry.id}`)} style="color:${C.ink};text-decoration:none;">${esc(entry.line)}</a>`
        : esc(entry.line);
      return `<li style="margin:0 0 10px;font-size:15px;line-height:1.6;color:${C.inkSoft};">${num}${line}</li>`;
    })
    .join('');

  // 进入政策：每条「[影响] 国家 · 一句话 → 查看解读」。
  const policyHtml =
    issue.policy.length === 0
      ? `<p style="margin:0;font-size:14px;color:${C.inkMuted};">本周各国无重大进入政策变化。</p>`
      : `<ul style="margin:0;padding:0;list-style:none;">${issue.policy
          .map((it) => {
            const impact = it.impactLevel
              ? `<span style="color:${C.accentDeep};font-weight:600;margin-right:4px;">[${IMPACT_LABEL[it.impactLevel] ?? it.impactLevel}]</span>`
              : '';
            const text = `<span style="color:${C.inkSoft};">${esc(COUNTRY_LABEL[it.country] ?? it.country)} · ${esc(it.oneLine)}</span>`;
            const view = ` <a ${link(`${siteUrl}/item/${it.id}`)} style="color:${C.accent};text-decoration:none;">查看解读 →</a>`;
            return `<li style="margin:0 0 8px;font-size:14px;line-height:1.6;">${impact}${text}${view}</li>`;
          })
          .join('')}</ul>`;

  // 各国动态：按国家分组，每组「国旗 国家名」+ 若干条。
  const marketHtml =
    issue.marketGroups.length === 0
      ? `<p style="margin:0;font-size:14px;color:${C.inkMuted};">本周暂无市场动态。</p>`
      : issue.marketGroups
          .map(
            (g) => `<div style="margin:0 0 16px;">
  <div style="margin:0 0 6px;font-size:14px;font-weight:600;color:${C.ink};">${esc(g.label)}</div>
  <ul style="margin:0;padding:0;list-style:none;">
    ${g.items
      .map(
        (it) =>
          `<li style="margin:0 0 6px;font-size:14px;line-height:1.6;color:${C.inkSoft};">· ${esc(it.oneLine)} <a ${link(`${siteUrl}/item/${it.id}`)} style="color:${C.accent};text-decoration:none;">查看解读 →</a></li>`,
      )
      .join('')}
  </ul>
</div>`,
          )
          .join('');

  const reportHtml = runReport
    ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid ${C.line};font-size:12px;line-height:1.7;color:${C.inkMuted};">
  <div style="font-size:12px;font-weight:600;color:${C.inkSoft};margin-bottom:6px;">运行报告（仅内部）</div>
  <div>数据源抓取：${runReport.sources.map((s) => `${esc(s.name)} ${s.fetched} 条`).join(' · ')}</div>
  <div>AI 判相关：${runReport.relevantTotal} 条（政策 ${runReport.policyCount} · 市场 ${runReport.marketCount}）</div>
  <div>零命中关键词（${runReport.zeroHitKeywords.length} 个）：${esc(formatZeroHit(runReport.zeroHitKeywords))}</div>
</div>`
    : '';

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(buildSubject(issue.issueNumber, issue.week))}</title>
</head>
<body style="margin:0;padding:0;background:${C.paper};">
  <div style="max-width:640px;margin:0 auto;padding:40px 24px;font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${C.ink};">

    <div style="border-bottom:1px solid ${C.line};padding-bottom:20px;margin-bottom:28px;">
      <div style="font-size:13px;font-weight:600;letter-spacing:.08em;color:${C.accent};">${esc(NEWSLETTER_NAME)}</div>
      <div style="margin-top:6px;font-size:13px;color:${C.inkMuted};">第 ${issue.issueNumber} 期 · ${weekRange}</div>
    </div>

    <div style="margin-bottom:28px;">
      ${sectionTitle('本周 3 件事')}
      <ol style="margin:0;padding:0;list-style:none;">${top3Html}</ol>
    </div>

    <div style="margin-bottom:28px;">
      ${sectionTitle('进入政策')}
      ${policyHtml}
    </div>

    <div style="margin-bottom:28px;">
      ${sectionTitle('各国动态')}
      ${marketHtml}
    </div>

    <div style="border-top:1px solid ${C.line};padding-top:24px;">
      <a ${link(webUrl)} style="color:${C.accent};text-decoration:none;font-size:14px;">在网页上查看完整周刊 →</a>
      <p style="margin:20px 0 0;font-size:12px;color:${C.inkMuted};">
        本邮件由 ${esc(NEWSLETTER_NAME)} 自动发送。AI 生成的摘要与解读仅供参考，请自行核实后再决策。
      </p>
    </div>

    ${reportHtml}

  </div>
</body>
</html>`;
}

/**
 * 发送一期周刊。收件人读 RECIPIENT_EMAIL（V1 只发给自己）。
 * 没有 RESEND_API_KEY、或 opts.dryRun 为 true 时只打印、不真正发送。
 */
export async function sendIssue(
  subject: string,
  html: string,
  opts?: { to?: string; dryRun?: boolean },
): Promise<SendResult> {
  const recipient = opts?.to ?? process.env.RECIPIENT_EMAIL;
  if (!recipient) {
    console.log('   未设置 RECIPIENT_EMAIL，跳过发送。');
    return { sent: 0, dryRun: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (opts?.dryRun) {
    console.log(`   DRY RUN：会发送到 ${recipient}`);
    console.log(`   主题：${subject}`);
    console.log('   （本次为 dry run，未真正发送。）');
    return { sent: 0, dryRun: true };
  }
  if (!apiKey) {
    console.log(`   未设置 RESEND_API_KEY，跳过发送（目标：${recipient}）。`);
    console.log(`   主题：${subject}`);
    return { sent: 0, dryRun: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: recipient,
    subject,
    html,
  });
  if (error) {
    console.error(`   发送失败：${error.message}`);
    return { sent: 0, dryRun: false };
  }
  console.log(`   已发送到 ${recipient}`);
  return { sent: 1, dryRun: false };
}
