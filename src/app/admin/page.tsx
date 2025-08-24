import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import LogoutButton from '@/components/admin/LogoutButton';
import LeadsTable from '@/components/admin/LeadsTable';
import SearchFilters, {
  SearchFiltersState,
} from '@/components/admin/SearchFilters';
import ExportButton from '@/components/admin/ExportButton';
import StatisticsDashboard from '@/components/admin/StatisticsDashboard';
import { getLeadsWithPagination, getLeadStats } from '@/lib/admin-data';

export const metadata: Metadata = {
  title: 'Admin Panel - E1 Calculator',
  description: 'Lead management and analytics for E1 Calculator',
};

interface AdminPageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    savingsMin?: string;
    savingsMax?: string;
  };
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-3 text-gray-600">Loading leads...</span>
    </div>
  );
}

async function LeadsSection({
  page,
  searchParams,
}: {
  page: number;
  searchParams: AdminPageProps['searchParams'];
}) {
  try {
    // Parse search parameters
    const filters = {
      page,
      limit: 10,
      search: searchParams.search || '',
      status: searchParams.status || '',
      dateFrom: searchParams.dateFrom || '',
      dateTo: searchParams.dateTo || '',
      savingsMin: searchParams.savingsMin
        ? parseFloat(searchParams.savingsMin)
        : undefined,
      savingsMax: searchParams.savingsMax
        ? parseFloat(searchParams.savingsMax)
        : undefined,
    };

    const [leadsData, stats] = await Promise.all([
      getLeadsWithPagination(filters),
      getLeadStats(),
    ]);

    return (
      <div className="space-y-6">
        {/* Comprehensive Statistics Dashboard */}
        <StatisticsDashboard stats={stats} />

        {/* Search and Filters */}
        <SearchFilters
          onFiltersChange={() => {
            // Filters are handled via URL params and page refresh
          }}
          initialFilters={{
            search: searchParams.search || '',
            status: searchParams.status || '',
            dateFrom: searchParams.dateFrom || '',
            dateTo: searchParams.dateTo || '',
            savingsMin: searchParams.savingsMin || '',
            savingsMax: searchParams.savingsMax || '',
          }}
        />

        {/* Export Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Leads ({leadsData.totalCount})
          </h2>
          <ExportButton
            leads={leadsData.leads}
            totalCount={leadsData.totalCount}
            currentFilters={{
              search: searchParams.search || '',
              status: searchParams.status || '',
              dateFrom: searchParams.dateFrom || '',
              dateTo: searchParams.dateTo || '',
              savingsMin: searchParams.savingsMin || '',
              savingsMax: searchParams.savingsMax || '',
            }}
          />
        </div>

        {/* Leads Table */}
        <LeadsTable
          leads={leadsData.leads}
          totalCount={leadsData.totalCount}
          currentPage={leadsData.currentPage}
          onPageChange={newPage => {
            // This will be handled client-side with URL updates
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('page', newPage.toString());
            window.location.href = currentUrl.toString();
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading leads:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Error loading leads:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <p className="text-red-600 text-sm mt-2">
          Please check your Supabase configuration and try again.
        </p>
      </div>
    );
  }
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // Server-side authentication check
  try {
    await requireAdmin();
  } catch (error) {
    console.error('Admin authentication failed:', error);
    redirect('/admin/login');
  }

  const currentPage = parseInt(searchParams.page || '1', 10);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">
              Manage leads and view analytics for the E1 Calculator
            </p>
          </div>
          <LogoutButton />
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <LeadsSection page={currentPage} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
