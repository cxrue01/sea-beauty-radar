// 一次性脚本：把 Issue 期号按周次（日期）从小到大重排为 1..N。
// 用法：DATABASE_URL="file:../data/prod.db" npx tsx scripts/renumber-issues.ts
import 'dotenv/config';
import { prisma } from '../lib/db';

async function main() {
  const issues = await prisma.issue.findMany({ where: { isSample: false }, orderBy: { week: 'asc' } });
  console.log(`共 ${issues.length} 期，按周次（日期）重排期号：`);
  for (let i = 0; i < issues.length; i++) {
    const issueNumber = i + 1;
    if (issues[i].issueNumber === issueNumber) {
      console.log(`  ${issues[i].week}: 第 ${issueNumber} 期（不变）`);
      continue;
    }
    await prisma.issue.update({ where: { id: issues[i].id }, data: { issueNumber } });
    console.log(`  ${issues[i].week}: 第 ${issues[i].issueNumber} 期 → 第 ${issueNumber} 期`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
