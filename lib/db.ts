import { PrismaClient } from '@prisma/client';

// 纯函数和类型已拆到 lib/view.ts（不依赖 Prisma），这里重导出供脚本继续用。
export {
  type ItemRecord,
  type IssueRecord,
  type ItemView,
  type IssueView,
  type Top3Entry,
  toItemView,
  toIssueView,
} from './view';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
