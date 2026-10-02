import Link from 'next/link';
import { nextWeek, previousWeek } from '@/lib/week';

type Props = {
  week: string;
  latestWeek: string;
  earliestWeek: string;
  search: string;
};

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={dir === 'left' ? 'rotate-180' : ''}
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WeekSwitcher({ week, latestWeek, earliestWeek, search }: Props) {
  const query = search ? `?${search}` : '';
  const atLatest = week >= latestWeek;
  const atEarliest = week <= earliestWeek;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {atEarliest ? (
        <span
          className="inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm text-ink-faint"
          aria-disabled="true"
        >
          <Chevron dir="left" />
          上一周
        </span>
      ) : (
        <Link
          href={`/week/${previousWeek(week)}${query}`}
          className="inline-flex h-11 items-center gap-1 rounded-full border border-line px-4 text-sm font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          <Chevron dir="left" />
          上一周
        </Link>
      )}

      {atLatest ? (
        <span
          className="inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm text-ink-faint"
          aria-disabled="true"
        >
          下一周
          <Chevron dir="right" />
        </span>
      ) : (
        <Link
          href={`/week/${nextWeek(week)}${query}`}
          className="inline-flex h-11 items-center gap-1 rounded-full border border-line px-4 text-sm font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          下一周
          <Chevron dir="right" />
        </Link>
      )}

      {!atLatest && (
        <Link
          href={`/week/${latestWeek}${query}`}
          className="inline-flex h-11 items-center rounded-full bg-accent-soft px-4 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-paper"
        >
          回到最新一期
        </Link>
      )}
    </div>
  );
}
