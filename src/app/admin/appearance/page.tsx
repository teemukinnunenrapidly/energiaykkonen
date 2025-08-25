import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import LogoutButton from '@/components/admin/LogoutButton';
import AdminNavigation from '@/components/admin/AdminNavigation';
import AppearanceContent from '@/components/admin/appearance/AppearanceContent';

export const metadata: Metadata = {
  title: 'Appearance - Admin Panel - E1 Calculator',
  description: 'Customize calculator appearance and themes',
};

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-3 text-gray-600">Loading appearance settings...</span>
    </div>
  );
}

export default async function AppearancePage() {
  // Server-side authentication check
  try {
    await requireAdmin();
  } catch (error) {
    console.error('Admin authentication failed:', error);
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <AdminNavigation />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appearance</h1>
              <p className="text-gray-600 mt-2">
                Customize calculator appearance, themes, and branding
              </p>
            </div>
            <LogoutButton />
          </div>

          {/* Content */}
          <Suspense fallback={<LoadingSpinner />}>
            <AppearanceContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
