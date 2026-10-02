import { PrismaClient } from '@prisma/client';
import { brandTags, type BrandTag } from './brands';
import type { Brand } from '../config/brands';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type ItemRecord = NonNullable<Awaited<ReturnType<typeof prisma.item.findFirst>>>;
export type IssueRecord = NonNullable<Awaited<ReturnType<typeof prisma.issue.findFirst>>>;

export type ItemView = Omit<ItemRecord, 'urls' | 'brands'> & {
  urls: string[];
  brands: BrandTag[];
};

export type Top3Entry = { id: string; line: string };

export type IssueView = Omit<IssueRecord, 'top3'> & {
  top3: Top3Entry[];
};

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
