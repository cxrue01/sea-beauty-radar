// 把 data/prod.db 导出成 JSON 快照（data/items.json + data/issues.json），供 lib/data.ts 在运行时读取。
// 构建时自动跑（见 package.json 的 build / predev），也可手动跑：npm run export:data
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../lib/db';

async function main() {
  const [items, issues] = await Promise.all([
    prisma.item.findMany({ orderBy: [{ week: 'asc' }, { createdAt: 'asc' }] }),
    prisma.issue.findMany({ orderBy: { week: 'asc' } }),
  ]);

  const dir = path.join(process.cwd(), 'data');
  await writeFile(path.join(dir, 'items.json'), JSON.stringify(items, null, 2), 'utf8');
  await writeFile(path.join(dir, 'issues.json'), JSON.stringify(issues, null, 2), 'utf8');
  console.log(`已导出快照：items ${items.length} 条、issues ${issues.length} 期 → data/*.json`);
}

main()
  .catch((err) => {
    console.error('导出快照失败：', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
