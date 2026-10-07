// 纯函数：把数据库原始记录转成页面用的视图。不依赖 Prisma，可在 Vercel 运行时使用。
// 页面从这里拿类型和转换函数；数据库查询走 lib/data.ts（JSON 快照），脚本走 lib/db.ts。
import type { Item, Issue } from '@prisma/client';
import { brandTags, type BrandTag } from './brands';
import type { Brand } from '../config/brands';

export type ItemRecord = Item;
export type IssueRecord = Issue;

export type ItemView = Omit<ItemRecord, 'urls' | 'brands'> & {
  urls: string[];
  brands: BrandTag[];
};

export type IssueView = Omit<IssueRecord, 'top3'> & {
  top3: Top3Entry[];
};

export type Top3Entry = { id: string; line: string };

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toItemView(row: ItemRecord, brandMap: Map<string, Brand>): ItemView {
  return {
    ...row,
    urls: parseList(row.urls),
    brands: brandTags(parseList(row.brands), brandMap),
  };
}

function parseTop3(value: string): Top3Entry[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((e): Top3Entry => {
        if (typeof e === 'string') return { id: '', line: e };
        return {
          id: typeof e?.id === 'string' ? e.id : '',
          line: typeof e?.line === 'string' ? e.line : '',
        };
      })
      .filter((e) => e.line);
  } catch {
    return [];
  }
}

export function toIssueView(issue: IssueRecord): IssueView {
  return { ...issue, top3: parseTop3(issue.top3) };
}
