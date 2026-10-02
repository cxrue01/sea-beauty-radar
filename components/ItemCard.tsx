import Link from 'next/link';
import type { ItemView } from '@/lib/db';
import { COUNTRY_LABEL, IMPACT_LABEL } from '@/lib/labels';
import { BrandTag } from './BrandTag';

const IMPACT_STYLES: Record<string, string> = {
  high: 'bg-accent-soft text-accent-deep',
  medium: 'bg-paper-tint text-ink-muted',
  low: 'bg-paper-tint text-ink-faint',
};

export function ItemCard({ item }: { item: ItemView }) {
  const impactStyle = item.impactLevel ? IMPACT_STYLES[item.impactLevel] : undefined;

  return (
    <li>
      <Link
        href={`/item/${item.id}`}
        className="group flex items-start justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-paper-tint sm:px-4"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-accent">
              {item.section === 'policy'
                ? `${COUNTRY_LABEL[item.country] ?? item.country} · ${item.category}`
                : item.category}
            </span>
            {item.impactLevel && impactStyle && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${impactStyle}`}>
                {IMPACT_LABEL[item.impactLevel]}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[0.9375rem] font-medium leading-snug text-ink group-hover:text-accent-deep">
            {item.oneLine}
          </p>
          {item.brands.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {item.brands.map((b) => (
                <BrandTag key={b.name} tag={b} />
              ))}
            </div>
          )}
        </div>
        <span
          className="mt-1 shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent"
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3.5 10.5 8 6 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </li>
  );
}
