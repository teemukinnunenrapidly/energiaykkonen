import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default async function StrategyConfiguratorPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/admin/login?redirect=/admin/strategy-config');
  }
  const Page = (await import('./_client')).default;
  return <Page />;
}


