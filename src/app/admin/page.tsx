'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LogoutButton from '@/components/admin/LogoutButton';
import AdminNavigation from '@/components/admin/AdminNavigation';
import LeadsTable from '@/components/admin/LeadsTable';
import SearchFilters from '@/components/admin/SearchFilters';
import ExportButton from '@/components/admin/ExportButton';
import StatisticsDashboard from '@/components/admin/StatisticsDashboard';
import { getLeadsWithPagination, getLeadStats } from '@/lib/admin-data';
import { Lead } from '@/lib/supabase';

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Parse search parameters
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const savingsMin = searchParams.get('savingsMin') || '';
  const savingsMax = searchParams.get('savingsMax') || '';

  useEffect(() => {
    fetchData();
  }, [currentPage, search, status, dateFrom, dateTo, savingsMin, savingsMax]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        page: currentPage,
        limit: 10,
        search,
        status,
        dateFrom,
        dateTo,
        savingsMin: savingsMin ? parseFloat(savingsMin) : undefined,
        savingsMax: savingsMax ? parseFloat(savingsMax) : undefined,
      };

      const [leadsData, statsData] = await Promise.all([
        getLeadsWithPagination(filters),
        getLeadStats(),
      ]);

      setLeads(leadsData.leads);
      setTotalCount(leadsData.totalCount);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    const params = new URLSearchParams(searchParams);

    if (newFilters.search !== undefined) {
      params.set('search', newFilters.search);
    }
    if (newFilters.status !== undefined) {
      params.set('status', newFilters.status);
    }
    if (newFilters.dateFrom !== undefined) {
      params.set('dateFrom', newFilters.dateFrom);
    }
    if (newFilters.dateTo !== undefined) {
      params.set('dateTo', newFilters.dateTo);
    }
    if (newFilters.savingsMin !== undefined) {
      params.set('savingsMin', newFilters.savingsMin);
    }
    if (newFilters.savingsMax !== undefined) {
      params.set('savingsMax', newFilters.savingsMax);
    }

    // Reset to first page when filters change
    params.set('page', '1');
    setCurrentPage(1);

    router.push(`/admin?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/admin?${params.toString()}`);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      // TODO: Implement actual export functionality
      console.log(`Exporting data in ${format} format`);
      alert(`Export started in ${format} format`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  if (loading && leads.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">
            Loading admin panel...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          <h2 className="text-lg font-semibold mb-2">
            Error Loading Admin Panel
          </h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Leads Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your energy calculator leads
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="space-y-6">
        {/* Essential Statistics Overview */}
        {stats && <StatisticsDashboard stats={stats} />}

        {/* Search and Filters */}
        <SearchFilters
          initialFilters={{
            search,
            status,
            dateFrom,
            dateTo,
            savingsMin,
            savingsMax,
          }}
          onFiltersChange={handleFiltersChange}
        />

        {/* Leads Table */}
        <LeadsTable
          leads={leads}
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />

        {/* Export Button */}
        <div className="flex justify-end">
          <ExportButton
            leads={leads}
            totalCount={totalCount}
            currentFilters={{
              search,
              status,
              dateFrom,
              dateTo,
              savingsMin,
              savingsMax,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <Suspense
        fallback={
          <div className="min-h-screen bg-background">
            <AdminNavigation />
            <div className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">
                  Loading admin panel...
                </span>
              </div>
            </div>
          </div>
        }
      >
        <AdminContent />
      </Suspense>
    </div>
  );
}
