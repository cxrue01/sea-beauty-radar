import Link from 'next/link';
import { ItemCard } from '@/components/ItemCard';
import { Filters } from '@/components/Filters';
import { brandNameMap, loadBrands } from '@/lib/brands';
import { prisma, toItemView } from '@/lib/db';
import { COUNTRY_LABEL, SECTION_LABEL } from '@/lib/labels';
import { weeksAgo } from '@/lib/week';
import { groupByCountry, matches, sortNewest, type FilterState } from '@/lib/items';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const RANGE_LABELS: Record<string, string> = { '4w': '近 4 周', '3m': '近 3 个月', all: '全部' };

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v || undefined;
}

function SegLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
        active ? 'bg-paper-tint font-medium text-ink' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}

export default async function OverviewPage({ searchParams }: Props) {
  const sp = await searchParams;

  const section = asString(sp.section) === 'policy' ? 'policy' : 'market';
  const range = ['3m', 'all'].includes(asString(sp.range) ?? '') ? (asString(sp.range) as string) : '4w';

  const filters: FilterState = {
    country: asString(sp.country),
    category: asString(sp.category),
    brand: asString(sp.brand),
  };

  const cutoff = range === '4w' ? weeksAgo(3) : range === '3m' ? weeksAgo(13) : undefined;

  const [brands, rows] = await Promise.all([
    loadBrands(),
    prisma.item.findMany({
      where: cutoff ? { week: { gte: cutoff } } : undefined,
      orderBy: { week: 'desc' },
    }),
  ]);

  const brandMap = brandNameMap(brands);
  const all = rows.map((r) => toItemView(r, brandMap));
  const filtered = all
    .filter((it) => it.section === section)
    .filter((it) => matches(it, filters))
    .sort(sortNewest);
  const groups = groupByCountry(filtered);
  const total = filtered.length;
  const isSample = filtered.some((it) => it.isSample);

  const buildHref = (overrides: { section?: string; range?: string; resetFilters?: boolean }): string => {
    const q = new URLSearchParams();
    q.set('section', overrides.section ?? section);
    q.set('range', overrides.range ?? range);
    if (!overrides.resetFilters) {
      for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    }
    return `/overview?${q.toString()}`;
  };
  const clearHref = buildHref({ resetFilters: true });

  return (
    <div className="mx-auto max-w-content px-6 py-8 sm:py-10">
      {isSample && (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent-soft px-4 py-2.5 text-sm text-accent-deep">
          示例数据：本页为演示用假数据（品牌为虚构），用于展示效果。
        </div>
      )}

      <div className="border-b border-line pb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">总览</h1>
        <p className="mt-2 text-sm text-ink-muted">
          跨周查看 · {SECTION_LABEL[section]} · {RANGE_LABELS[range]} · 共 {total} 条
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 rounded-full border border-line p-1">
          <SegLink active={section === 'policy'} href={buildHref({ section: 'policy' })}>
            进入政策
          </SegLink>
          <SegLink active={section === 'market'} href={buildHref({ section: 'market' })}>
            市场动态
          </SegLink>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line p-1">
          <SegLink active={range === '4w'} href={buildHref({ range: '4w' })}>
            近 4 周
          </SegLink>
          <SegLink active={range === '3m'} href={buildHref({ range: '3m' })}>
            近 3 个月
          </SegLink>
          <SegLink active={range === 'all'} href={buildHref({ range: 'all' })}>
            全部
          </SegLink>
        </div>
      </div>

      <div className="mt-6">
        <Filters
          action="/overview"
          clearHref={clearHref}
          filters={filters}
          brands={brands.map((b) => b.name)}
          hiddenFields={{ section, range }}
          hideSection
        />
      </div>

      <div className="mt-8">
        {groups.length === 0 ? (
          <p className="text-[0.9375rem] text-ink-muted">没有符合条件的内容。</p>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.code}>
                <h2 className="text-sm font-semibold text-ink-muted">
                  {COUNTRY_LABEL[g.code] ?? g.code}
                  <span className="tnum ml-2 text-xs font-normal text-ink-faint">{g.items.length} 条</span>
                </h2>
                <ul className="mt-2 divide-y divide-line">
                  {g.items.map((it) => (
                    <ItemCard key={it.id} item={it} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
