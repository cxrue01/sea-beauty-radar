import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brandNameMap, loadBrands } from '@/lib/brands';
import { prisma, toItemView, toIssueView, type ItemView } from '@/lib/db';
import { COUNTRY_LABEL, COUNTRY_ORDER, IMPACT_LABEL } from '@/lib/labels';
import { NEWSLETTER_NAME } from '@/lib/site';
import { formatWeekRange } from '@/lib/week';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ week: string }> };

const IMPACT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function groupByCountry(items: ItemView[]): { code: string; items: ItemView[] }[] {
  const map = new Map<string, ItemView[]>();
  for (const it of items) {
    const arr = map.get(it.country) ?? [];
    arr.push(it);
    map.set(it.country, arr);
  }
  const ordered = COUNTRY_ORDER.filter((c) => map.has(c));
  const extra = [...map.keys()].filter((c) => !COUNTRY_ORDER.includes(c)).sort();
  return [...ordered, ...extra].map((code) => ({ code, items: map.get(code)! }));
}

export async function generateMetadata({ params }: Props) {
  const { week } = await params;
  const issue = await prisma.issue.findUnique({ where: { week }, select: { issueNumber: true } });
  return { title: issue ? `${NEWSLETTER_NAME} · 第 ${issue.issueNumber} 期` : NEWSLETTER_NAME };
}

export default async function IssuePage({ params }: Props) {
  const { week } = await params;
  const [brands, issue, items] = await Promise.all([
    loadBrands(),
    prisma.issue.findUnique({ where: { week } }),
    prisma.item.findMany({ where: { week }, orderBy: { createdAt: 'asc' } }),
  ]);

  if (!issue) notFound();
  const issueView = toIssueView(issue);
  const brandMap = brandNameMap(brands);
  const all = items.map((r) => toItemView(r, brandMap));

  const policy = all
    .filter((it) => it.section === 'policy')
    .sort((a, b) => (IMPACT_ORDER[a.impactLevel ?? 'low'] ?? 3) - (IMPACT_ORDER[b.impactLevel ?? 'low'] ?? 3));
  const marketGroups = groupByCountry(all.filter((it) => it.section === 'market'));

  return (
    <article className="mx-auto max-w-prose px-6 py-16">
      <Link href="/newsletter" className="text-sm text-ink-faint hover:text-ink-soft">
        &larr; 全部周刊
      </Link>

      <p className="mt-8 text-xs text-ink-faint">
        {NEWSLETTER_NAME} · 第 {issueView.issueNumber} 期 · {formatWeekRange(week)}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink">
        第 {issueView.issueNumber} 期（{formatWeekRange(week)}）
      </h1>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-ink">本周 3 件事</h2>
        <ol className="mt-4 space-y-2.5">
          {issueView.top3.map((entry, i) => (
            <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              <span className="font-semibold text-accent">{i + 1}.</span>
              <span>{entry.line}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-ink">进入政策</h2>
        {policy.length === 0 ? (
          <p className="mt-4 text-[0.9375rem] text-ink-faint">本周各国无重大进入政策变化。</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {policy.map((it) => (
              <li key={it.id} className="text-[0.9375rem] leading-relaxed text-ink-soft">
                {it.impactLevel && (
                  <span className="mr-1.5 font-medium text-accent-deep">
                    [{IMPACT_LABEL[it.impactLevel]}]
                  </span>
                )}
                {COUNTRY_LABEL[it.country] ?? it.country} · {it.oneLine}{' '}
                <Link href={`/item/${it.id}`} className="text-accent hover:underline">
                  查看解读 →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-ink">各国动态</h2>
        <div className="mt-4 space-y-6">
          {marketGroups.map((g) => (
            <div key={g.code}>
              <h3 className="text-sm font-semibold text-ink-muted">
                {COUNTRY_LABEL[g.code] ?? g.code}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {g.items.map((it) => (
                  <li key={it.id} className="text-[0.9375rem] leading-relaxed text-ink-soft">
                    · {it.oneLine}{' '}
                    <Link href={`/item/${it.id}`} className="text-accent hover:underline">
                      查看解读 →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
