import { redirect } from 'next/navigation';
import { getLatestWeek } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const latestWeek = getLatestWeek();
  if (latestWeek) redirect(`/week/${latestWeek}`);
  redirect('/newsletter');
}
