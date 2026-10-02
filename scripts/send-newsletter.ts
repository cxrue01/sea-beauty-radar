// 发送周刊脚本：读数据库里某一期周刊并发邮件。
// 用法：
//   npm run newsletter:send              # 发送最新一期
//   npm run newsletter:send -- --week=2026-09-21 --dry
//   npm run newsletter:send -- --dump=out.html   # 导出 HTML 预览
import 'dotenv/config';
import { prisma } from '../lib/db';
import { sendWeekIssue } from '../lib/newsletter';

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

async function main() {
  const weekArg = argValue('week');
  const forceDry = process.argv.includes('--dry');
  const dumpPath = argValue('dump');

  let week = weekArg;
  if (!week) {
    const latest = await prisma.issue.findFirst({ orderBy: { week: 'desc' } });
    week = latest?.week;
  }
  if (!week) {
    console.log('没有找到任何一期周刊。先跑 `npm run seed:demo` 或流水线。');
    return;
  }

  if (forceDry) console.log('  （--dry：强制演练，不真正发送）');
  await sendWeekIssue(week, { dryRun: forceDry, dumpTo: dumpPath });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
