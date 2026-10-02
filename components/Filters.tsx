import Link from 'next/link';
import { ALL_CATEGORY_LIST, COUNTRY_LABEL, COUNTRY_ORDER } from '@/lib/labels';
import type { FilterState } from '@/lib/items';

const selectClass =
  'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

const FACET_LABEL: Record<string, string> = {
  country: '国家',
  section: '板块',
  category: '类别',
  brand: '品牌',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-[9rem] flex-1 flex-col gap-1.5 text-xs text-ink-muted">
      {label}
      {children}
    </label>
  );
}

function activeChips(filters: FilterState) {
  const values: Record<string, string> = {
    country: filters.country ? (COUNTRY_LABEL[filters.country] ?? filters.country) : '',
    section: filters.section ? (filters.section === 'market' ? '市场动态' : '进入政策') : '',
    category: filters.category ?? '',
    brand: filters.brand ?? '',
  };
  return Object.entries(values)
    .filter(([, v]) => v)
    .map(([key, value]) => ({ key, label: FACET_LABEL[key], value }));
}

export function Filters({
  action,
  clearHref,
  filters,
  brands,
  hiddenFields,
  hideSection,
}: {
  action: string;
  clearHref: string;
  filters: FilterState;
  brands: string[];
  hiddenFields?: Record<string, string>;
  hideSection?: boolean;
}) {
  const chips = activeChips(filters);
  const hasActive = chips.length > 0;

  return (
    <div className="space-y-3">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none select-none items-center gap-2 text-sm font-medium text-ink-soft [&::-webkit-details-marker]:hidden">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path
              d="M1.5 3h12l-4.5 5v3.5L6 14v-6L1.5 3Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
          <span>筛选</span>
          {hasActive && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs font-semibold text-paper">
              {chips.length}
            </span>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="transition-transform group-open:rotate-180"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>

        <form method="get" action={action} className="mt-3">
          {hiddenFields &&
            Object.entries(hiddenFields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}

          <div className="flex flex-wrap items-end gap-3">
            <Field label="国家">
              <select name="country" defaultValue={filters.country ?? ''} className={selectClass}>
                <option value="">全部国家</option>
                {COUNTRY_ORDER.map((code) => (
                  <option key={code} value={code}>
                    {COUNTRY_LABEL[code]}
                  </option>
                ))}
              </select>
            </Field>

            {!hideSection && (
              <Field label="板块">
                <select name="section" defaultValue={filters.section ?? ''} className={selectClass}>
                  <option value="">全部板块</option>
                  <option value="market">市场动态</option>
                  <option value="policy">进入政策</option>
                </select>
              </Field>
            )}

            <Field label="类别">
              <select name="category" defaultValue={filters.category ?? ''} className={selectClass}>
                <option value="">全部类别</option>
                {ALL_CATEGORY_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="品牌">
              <select name="brand" defaultValue={filters.brand ?? ''} className={selectClass}>
                <option value="">全部品牌</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <button
              type="submit"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent-deep"
            >
              应用筛选
            </button>
            <Link href={clearHref} className="py-2 text-sm text-ink-muted hover:text-ink">
              清除
            </Link>
          </div>
        </form>
      </details>

      {hasActive && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-ink-soft"
            >
              <span className="text-ink-faint">{c.label}</span>
              <span className="font-medium">{c.value}</span>
            </span>
          ))}
          <Link href={clearHref} className="text-xs text-ink-muted hover:text-ink">
            全部清除
          </Link>
        </div>
      )}
    </div>
  );
}
