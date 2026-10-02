import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const latest = await prisma.item.findFirst({
    orderBy: { week: 'desc' },
    select: { week: true },
  });

  if (latest?.week) redirect(`/week/${latest.week}`);
  redirect('/newsletter');
}
