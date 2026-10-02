import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ItemCard } from '@/components/ItemCard';
import { Filters } from '@/components/Filters';
import { WeekSwitcher } from '@/components/WeekSwitcher';
import { brandNameMap, loadBrands } from '@/lib/brands';
import { prisma, toItemView, toIssueView } from '@/lib/db';
import { COUNTRY_LABEL } from '@/lib/labels';
import { formatWeekRange } from '@/lib/week';
import { groupByCountry, matches, type FilterState } from '@/lib/items';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ week: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const IMPACT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v || undefined;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function WeekPage({ params, searchParams }: Props) {
  const { week } = await params;
  const sp = await searchParams;

  const filters: FilterState = {
    country: asString(sp.country),
    section: asString(sp.section),
    category: asString(sp.category),
    brand: asString(sp.brand),
  };

  const [brands, issue, items, bounds] = await Promise.all([
    loadBrands(),
    prisma.issue.findUnique({ where: { week } }),
    prisma.item.findMany({ where: { week }, orderBy: { createdAt: 'asc' } }),
    prisma.item.aggregate({ _min: { week: true }, _max: { week: true } }),
  ]);

  if (items.length === 0 && !issue) notFound();

  const brandMap = brandNameMap(brands);
  const all = items.map((r) => toItemView(r, brandMap));
  const latestWeek = bounds._max.week ?? week;
  const earliestWeek = bounds._min.week ?? week;

  const filtered = all.filter((it) => matches(it, filters));
  const policyItems = filtered
    .filter((it) => it.section === 'policy')
    .sort((a, b) => (IMPACT_ORDER[a.impactLevel ?? 'low'] ?? 3) - (IMPACT_ORDER[b.impactLevel ?? 'low'] ?? 3));
  const marketGroups = groupByCountry(filtered.filter((it) => it.section === 'market'));
  const marketCount = marketGroups.reduce((n, g) => n + g.items.length, 0);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const issueView = issue ? toIssueView(issue) : null;
  const isSampleWeek = all.some((it) => it.isSample);

  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) search.set(k, v);
  const searchStr = search.toString();
  const clearHref = `/week/${week}`;

  return (
    <div className="mx-auto max-w-content px-6 py-8 sm:py-10">
      {isSampleWeek && (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent-soft px-4 py-2.5 text-sm text-accent-deep">
          示例数据：本页为演示用假数据（品牌为虚构），用于展示效果。
        </div>
      )}

      <div className="border-b border-line pb-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="tnum font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {formatWeekRange(week)}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {issueView ? `第 ${issueView.issueNumber} 期 · ` : ''}共收录 {all.length} 条动态
            </p>
          </div>
          <WeekSwitcher
            week={week}
            latestWeek={latestWeek}
            earliestWeek={earliestWeek}
            search={searchStr}
          />
        </div>
      </div>

      <div className="space-y-10 pt-8">
        {issueView && issueView.top3.length > 0 && (
          <section>
            <div className="flex items-center gap-3">
              <span className="h-5 w-1 rounded-full bg-accent" />
              <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">本周 3 件事</h2>
            </div>
            <ol className="mt-5 rounded-2xl bg-paper-tint p-6 sm:p-8">
              {issueView.top3.map((entry, i) => (
                <li key={i} className={i > 0 ? 'mt-5 border-t border-line pt-5' : ''}>
                  {entry.id ? (
                    <Link
                      href={`/item/${entry.id}`}
                      className="group flex items-start gap-4 sm:gap-5"
                    >
                      <span className="font-serif text-2xl font-semibold leading-none text-accent">
                        {i + 1}
                      </span>
                      <p className="min-w-0 flex-1 font-serif text-[1.0625rem] leading-relaxed text-ink group-hover:text-accent-deep">
                        {entry.line}
                      </p>
                      <span
                        className="mt-1 shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                        aria-hidden="true"
                      >
                        <ArrowRight />
                      </span>
                    </Link>
                  ) : (
                    <div className="flex gap-4 sm:gap-5">
                      <span className="font-serif text-2xl font-semibold leading-none text-accent">
                        {i + 1}
                      </span>
                      <p className="font-serif text-[1.0625rem] leading-relaxed text-ink">{entry.line}</p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        <Filters
          action={`/week/${week}`}
          clearHref={clearHref}
          filters={filters}
          brands={brands.map((b) => b.name)}
        />

        <details open className="group">
          <summary className="flex cursor-pointer list-none select-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <span className="h-5 w-1 rounded-full bg-accent" />
            <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">进入政策</h2>
            <span className="tnum text-sm text-ink-faint">{policyItems.length} 条</span>
            <span className="ml-auto text-ink-faint">
              <ChevronDown className="transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="mt-4">
            {policyItems.length === 0 ? (
              <p className="text-[0.9375rem] text-ink-muted">本周各国无重大进入政策变化。</p>
            ) : (
              <ul className="divide-y divide-line">
                {policyItems.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </ul>
            )}
          </div>
        </details>

        <details open className="group">
          <summary className="flex cursor-pointer list-none select-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <span className="h-5 w-1 rounded-full bg-accent" />
            <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">市场动态</h2>
            <span className="tnum text-sm text-ink-faint">{marketCount} 条</span>
            <span className="ml-auto text-ink-faint">
              <ChevronDown className="transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="mt-4">
            <div className="divide-y divide-line">
              {marketGroups.length === 0 ? (
                <p className="text-[0.9375rem] text-ink-muted">没有符合筛选条件的市场动态。</p>
              ) : (
                marketGroups.map((g) => (
                  <details
                    key={g.code}
                    open={hasActiveFilters || g.code === 'VN'}
                    className="group/country"
                  >
                    <summary className="flex cursor-pointer list-none select-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden">
                      <h3 className="text-sm font-semibold text-ink-soft">{COUNTRY_LABEL[g.code] ?? g.code}</h3>
                      <span className="tnum text-xs text-ink-faint">· {g.items.length} 条</span>
                      <span className="ml-auto text-ink-faint">
                        <ChevronDown className="transition-transform group-open/country:rotate-180" />
                      </span>
                    </summary>
                    <ul className="divide-y divide-line">
                      {g.items.map((it) => (
                        <ItemCard key={it.id} item={it} />
                      ))}
                    </ul>
                  </details>
                ))
              )}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
