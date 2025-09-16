import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default async function CardBuilderPageWrapper() {
  try {
    await requireAdmin();
  } catch {
    redirect('/admin/login?redirect=/admin/card-builder');
  }
  const Page = (await import('./_client')).default;
  return <Page />;
}

