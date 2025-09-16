import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default async function VisualAssetsPageWrapper() {
  try {
    await requireAdmin();
  } catch {
    redirect('/admin/login?redirect=/admin/visual-assets');
  }
  const Page = (await import('./_client')).default;
  return <Page />;
}

