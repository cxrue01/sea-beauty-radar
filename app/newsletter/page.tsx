import Link from 'next/link';
import { toIssueView } from '@/lib/view';
import { getAllIssues } from '@/lib/data';
import { NEWSLETTER_NAME } from '@/lib/site';
import { formatWeekRange } from '@/lib/week';

export const dynamic = 'force-dynamic';

export const metadata = { title: `往期周刊 — ${NEWSLETTER_NAME}` };

export default async function NewsletterIndex() {
  const issues = getAllIssues().map(toIssueView);

  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">往期周刊</h1>
      <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-muted">
        每周一期，覆盖东南亚 6 国的美妆市场动态与进入政策。点进去可在线翻看，内容和邮件一致。
      </p>

      <div className="mt-10">
        {issues.length === 0 ? (
          <p className="text-ink-faint">还没有生成任何一期周刊。</p>
        ) : (
          <ul className="divide-y divide-line">
            {issues.map((issue) => (
              <li key={issue.id} className="py-5">
                <Link href={`/newsletter/${issue.week}`} className="group block">
                  <p className="text-xs text-ink-faint">
                    第 {issue.issueNumber} 期 · {formatWeekRange(issue.week)}
                  </p>
                  <h2 className="mt-1.5 text-lg font-medium text-ink group-hover:text-accent-deep">
                    {issue.top3[0]?.line ?? ''}
                  </h2>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
