// 页面运行时读的数据源。构建时把 data/prod.db 导出成 JSON 快照（见 scripts/export-data.ts），
// 这里加载进内存查询。Vercel 是无服务器环境读不了 SQLite 文件，所以用 JSON 快照替代数据库查询。
import itemsJson from '../data/items.json';
import issuesJson from '../data/issues.json';
import type { ItemRecord, IssueRecord } from './view';

const items: ItemRecord[] = (itemsJson as unknown as ItemRecord[]).map((r) => ({
  ...r,
  createdAt: new Date(r.createdAt as unknown as string),
}));

const issues: IssueRecord[] = (issuesJson as unknown as IssueRecord[]).map((r) => ({
  ...r,
  createdAt: new Date(r.createdAt as unknown as string),
}));

export function getAllItems(): ItemRecord[] {
  return items;
}

export function getItemById(id: string): ItemRecord | undefined {
  return items.find((i) => i.id === id);
}

export function getItemsByWeek(week: string): ItemRecord[] {
  return items
    .filter((i) => i.week === week)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getItemsFromWeek(cutoff?: string): ItemRecord[] {
  if (!cutoff) return items;
  return items.filter((i) => i.week >= cutoff);
}

export function getAllIssues(): IssueRecord[] {
  return [...issues].sort((a, b) => b.week.localeCompare(a.week));
}

export function getIssueByWeek(week: string): IssueRecord | undefined {
  return issues.find((i) => i.week === week);
}

export function getLatestWeek(): string | undefined {
  let max: string | undefined;
  for (const i of items) if (!max || i.week > max) max = i.week;
  return max;
}

export function getWeekBounds(): { min: string | undefined; max: string | undefined } {
  let min: string | undefined;
  let max: string | undefined;
  for (const i of items) {
    if (!min || i.week < min) min = i.week;
    if (!max || i.week > max) max = i.week;
  }
  return { min, max };
}
