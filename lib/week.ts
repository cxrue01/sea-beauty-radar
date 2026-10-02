/** ISO date (YYYY-MM-DD) of the Monday that starts the week containing `date`. */
export function weekOf(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOffset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayOffset);
  return d.toISOString().slice(0, 10);
}

/** Monday ISO date one week earlier than `week`. */
export function previousWeek(week: string): string {
  return shiftWeek(week, -7);
}

/** Monday ISO date one week later than `week`. */
export function nextWeek(week: string): string {
  return shiftWeek(week, 7);
}

/** Monday ISO date `n` weeks earlier than `week` (default: this week). */
export function weeksAgo(n: number, from?: string): string {
  return shiftWeek(from ?? weekOf(new Date()), -7 * n);
}

function shiftWeek(week: string, days: number): string {
  const d = new Date(`${week}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 标题用的日期范围，如「9/21 – 9/27」（说明书 11.3）。 */
export function formatWeekRange(week: string): string {
  const start = new Date(`${week}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

/** 某周的起止时间戳：周一 00:00（含）到下周一 00:00（不含），即「周一到周日」一整个完整周。 */
export function weekRange(week: string): { start: Date; end: Date } {
  const start = new Date(`${week}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}
