import { requireAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export default async function StrategyConfiguratorPage() {
  await requireAdmin();
  const Page = (await import('./_client')).default;
  return <Page />;
}


