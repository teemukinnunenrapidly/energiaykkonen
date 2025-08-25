'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { exportLeadsToCSV, getExportSummary } from '@/lib/csv-export';
import { SearchFiltersState } from './SearchFilters';

interface ExportButtonProps {
  leads: Lead[];
  totalCount: number;
  currentFilters?: Partial<SearchFiltersState>;
  className?: string;
  exportMode?: 'current-page' | 'all-filtered';
}

export default function ExportButton({
  leads,
  totalCount,
  currentFilters,
  className = '',
  exportMode = 'all-filtered',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportTime, setLastExportTime] = useState<Date | null>(null);

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      let leadsToExport = leads;

      // If exporting all filtered leads, fetch from API
      if (exportMode === 'all-filtered' && totalCount > leads.length) {
        const params = new URLSearchParams();

        if (currentFilters?.search) {
          params.set('search', currentFilters.search);
        }
        if (currentFilters?.status) {
          params.set('status', currentFilters.status);
        }
        if (currentFilters?.dateFrom) {
          params.set('dateFrom', currentFilters.dateFrom);
        }
        if (currentFilters?.dateTo) {
          params.set('dateTo', currentFilters.dateTo);
        }
        if (currentFilters?.savingsMin) {
          params.set('savingsMin', currentFilters.savingsMin);
        }
        if (currentFilters?.savingsMax) {
          params.set('savingsMax', currentFilters.savingsMax);
        }

        const response = await fetch(`/api/admin/export?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Export API failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Export API returned error');
        }

        leadsToExport = data.leads;
      }

      // Prepare filters for export
      const filters = {
        search: currentFilters?.search,
        status: currentFilters?.status,
        dateFrom: currentFilters?.dateFrom,
        dateTo: currentFilters?.dateTo,
      };

      // Export to CSV
      await exportLeadsToCSV(leadsToExport, {
        filters,
        includeHeaders: true,
        dateFormat: 'Finnish',
      });

      setLastExportTime(new Date());

      // Show success feedback (you could replace this with a toast notification)
      console.log(
        `CSV export completed successfully: ${leadsToExport.length} leads`
      );
    } catch (error) {
      console.error('Export failed:', error);
      // Show error feedback (you could replace this with a toast notification)
      alert(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Display summary based on export mode
  const exportSummary = getExportSummary(
    exportMode === 'all-filtered'
      ? (Array(totalCount).fill({}) as Lead[])
      : leads,
    {
      search: currentFilters?.search,
      status: currentFilters?.status,
      dateFrom: currentFilters?.dateFrom,
      dateTo: currentFilters?.dateTo,
    }
  );

  const hasFilters =
    currentFilters?.search ||
    currentFilters?.status ||
    currentFilters?.dateFrom ||
    currentFilters?.dateTo ||
    currentFilters?.savingsMin ||
    currentFilters?.savingsMax;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Button
        onClick={handleExport}
        disabled={isExporting || totalCount === 0}
        className={`flex items-center gap-2 ${className}`}
        variant="outline"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export CSV
          </>
        )}
      </Button>

      <div className="text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <FileSpreadsheet className="w-3 h-3" />
          <span>{exportSummary}</span>
        </div>

        {hasFilters && (
          <div className="text-xs text-gray-500 mt-1">
            {exportMode === 'all-filtered'
              ? 'All filtered results'
              : 'Current page only'}{' '}
            will be exported
          </div>
        )}

        {exportMode === 'all-filtered' && totalCount > leads.length && (
          <div className="text-xs text-blue-600 mt-1">
            Will export all {totalCount} filtered leads (not just current page)
          </div>
        )}

        {lastExportTime && (
          <div className="text-xs text-green-600 mt-1">
            Last exported: {lastExportTime.toLocaleTimeString('fi-FI')}
          </div>
        )}

        {totalCount === 0 && (
          <div className="text-xs text-gray-500 mt-1">No leads to export</div>
        )}
      </div>
    </div>
  );
}
