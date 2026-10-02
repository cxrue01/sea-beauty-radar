import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BrandTag } from '@/components/BrandTag';
import { brandNameMap, loadBrands } from '@/lib/brands';
import { prisma, toItemView } from '@/lib/db';
import { COUNTRY_LABEL, IMPACT_LABEL, SECTION_LABEL } from '@/lib/labels';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const row = await prisma.item.findUnique({ where: { id }, select: { oneLine: true } });
  return { title: row?.oneLine ?? '动态详情 — beautytrend' };
}

function formatPublished(value: string | null): string {
  if (!value) return '未知';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('zh-CN', { hour12: false });
}

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const [brands, row] = await Promise.all([
    loadBrands(),
    prisma.item.findUnique({ where: { id } }),
  ]);

  if (!row) notFound();
  const item = toItemView(row, brandNameMap(brands));

  return (
    <article className="mx-auto max-w-prose px-6 py-12">
      <Link href={`/week/${item.week}`} className="text-sm text-ink-faint hover:text-ink-soft">
        &larr; 返回 {item.week} 那一周
      </Link>

      {item.isSample && (
        <div className="mt-6 rounded-lg border border-accent/20 bg-accent-soft px-4 py-2 text-xs text-accent-deep">
          示例数据（虚构内容）
        </div>
      )}

      <h1 className="mt-6 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        {item.oneLine}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-paper-tint px-2 py-1 text-ink-muted">
          {COUNTRY_LABEL[item.country] ?? item.country}
        </span>
        <span className="rounded bg-paper-tint px-2 py-1 text-ink-muted">
          {SECTION_LABEL[item.section] ?? item.section}
        </span>
        <span className="rounded bg-paper-tint px-2 py-1 text-ink-muted">{item.category}</span>
        {item.impactLevel && (
          <span className="rounded bg-accent-soft px-2 py-1 text-accent-deep">
            {IMPACT_LABEL[item.impactLevel]}
          </span>
        )}
      </div>

      {item.brands.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          {item.brands.map((b) => (
            <BrandTag key={b.name} tag={b} />
          ))}
        </div>
      )}

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-ink-faint">发生了什么</h2>
          <p className="mt-2 text-[1rem] leading-relaxed text-ink-soft">{item.whatHappened}</p>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-ink-faint">为什么重要</h2>
          <p className="mt-2 text-[1rem] leading-relaxed text-ink-soft">{item.whyItMatters}</p>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-ink-faint">对中国美妆品牌意味着什么</h2>
          <p className="mt-2 text-[1rem] leading-relaxed text-ink-soft">{item.implications}</p>
        </section>
      </div>

      <div className="mt-12 border-t border-line pt-8">
        <h2 className="text-sm font-semibold text-ink-faint">原文</h2>
        <p className="mt-3 text-[0.9375rem] font-medium text-ink">{item.titleOriginal}</p>
        {item.snippetOriginal && (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{item.snippetOriginal}</p>
        )}
        <p className="mt-4 text-sm text-ink-faint">
          来源：{item.source} · 发布时间：{formatPublished(item.publishedAt)}
        </p>

        {item.urls.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-sm text-ink-faint">来源链接：</p>
            {item.urls.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-sm text-accent hover:underline"
              >
                {i + 1}. {url}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
