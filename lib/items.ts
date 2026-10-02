// 首页 / 总览共用的条目过滤与分组逻辑。
import type { ItemView } from './db';
import { COUNTRY_ORDER } from './labels';

export type FilterState = {
  country?: string;
  section?: string;
  category?: string;
  brand?: string;
};

export function matches(item: ItemView, f: FilterState): boolean {
  if (f.country && item.country !== f.country) return false;
  if (f.section && item.section !== f.section) return false;
  if (f.category && item.category !== f.category) return false;
  if (f.brand && !item.brands.some((b) => b.name === f.brand)) return false;
  return true;
}

export function groupByCountry(items: ItemView[]): { code: string; items: ItemView[] }[] {
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

export function sortNewest(a: ItemView, b: ItemView): number {
  const weekDiff = b.week.localeCompare(a.week);
  if (weekDiff !== 0) return weekDiff;
  const pa = a.publishedAt ?? '';
  const pb = b.publishedAt ?? '';
  const pDiff = pb.localeCompare(pa);
  if (pDiff !== 0) return pDiff;
  return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
}
