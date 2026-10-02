import type { BrandTag as BrandTagType } from '@/lib/brands';
import { ORIGIN_LABEL, TIER_LABEL } from '@/lib/labels';

export function BrandTag({ tag }: { tag: BrandTagType }) {
  const tier = tag.tier ? TIER_LABEL[tag.tier] : null;
  const origin = tag.origin ? ORIGIN_LABEL[tag.origin] : null;
  const extra = tier || origin ? [tier, origin].filter(Boolean).join(' · ') : '';
  const own = tag.tier === 'own';

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      <span className="font-medium text-ink-soft">{tag.name}</span>
      {extra && (
        <span
          className={
            own
              ? 'rounded-md border border-dashed border-accent/40 px-1.5 py-0.5 text-accent-deep'
              : 'rounded-md bg-paper-tint px-1.5 py-0.5'
          }
        >
          {extra}
        </span>
      )}
    </span>
  );
}
