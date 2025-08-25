'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// Select component is used in the JSX but not directly imported
import { X, Search, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchFiltersState {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  savingsMin: string;
  savingsMax: string;
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFiltersState) => void;
  initialFilters?: Partial<SearchFiltersState>;
}

const defaultFilters: SearchFiltersState = {
  search: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  savingsMin: '',
  savingsMax: '',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
];

export default function SearchFilters({
  onFiltersChange,
  initialFilters = {},
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize filters from URL params or defaults
  const [filters, setFilters] = useState<SearchFiltersState>(() => {
    const urlFilters: Partial<SearchFiltersState> = {};

    // Extract filters from URL search params
    urlFilters.search = searchParams.get('search') || '';
    urlFilters.status = searchParams.get('status') || '';
    urlFilters.dateFrom = searchParams.get('dateFrom') || '';
    urlFilters.dateTo = searchParams.get('dateTo') || '';
    urlFilters.savingsMin = searchParams.get('savingsMin') || '';
    urlFilters.savingsMax = searchParams.get('savingsMax') || '';

    return {
      ...defaultFilters,
      ...urlFilters,
      ...initialFilters,
    };
  });

  // Debounce search input for performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // Update URL and notify parent when filters change
  const updateFiltersAndUrl = useCallback(
    (newFilters: SearchFiltersState) => {
      setFilters(newFilters);

      // Update URL params
      const params = new URLSearchParams(searchParams);

      // Add or remove search params based on filter values
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change
      params.delete('page');

      // Update URL without refresh
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl);

      // Notify parent component
      onFiltersChange(newFilters);
    },
    [onFiltersChange, router, searchParams]
  );

  // Effect to handle debounced search
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateFiltersAndUrl({
        ...filters,
        search: debouncedSearch,
      });
    }
  }, [debouncedSearch, filters, updateFiltersAndUrl]);

  const handleFilterChange = (key: keyof SearchFiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };

    if (key === 'search') {
      // For search, update local state immediately but debounce the URL/parent update
      setFilters(newFilters);
    } else {
      // For other filters, update immediately
      updateFiltersAndUrl(newFilters);
    }
  };

  const clearAllFilters = () => {
    updateFiltersAndUrl(defaultFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value.trim() !== ''
  );

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* Search Input - Always Visible */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label
              htmlFor="search"
              className="text-sm font-medium text-gray-700"
            >
              Search Leads
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name, email, or city..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {isExpanded ? 'Hide Filters' : 'More Filters'}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters - Collapsible */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Status Filter */}
            <div>
              <Label
                htmlFor="status"
                className="text-sm font-medium text-gray-700"
              >
                Status
              </Label>
              <select
                id="status"
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <Label
                htmlFor="dateFrom"
                className="text-sm font-medium text-gray-700"
              >
                From Date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={e => handleFilterChange('dateFrom', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Date To */}
            <div>
              <Label
                htmlFor="dateTo"
                className="text-sm font-medium text-gray-700"
              >
                To Date
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={e => handleFilterChange('dateTo', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Savings Range */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Annual Savings (€)
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.savingsMin}
                  onChange={e =>
                    handleFilterChange('savingsMin', e.target.value)
                  }
                  className="w-1/2"
                  min="0"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.savingsMax}
                  onChange={e =>
                    handleFilterChange('savingsMax', e.target.value)
                  }
                  className="w-1/2"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Search: &quot;{filters.search}&quot;
                <button onClick={() => handleFilterChange('search', '')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Status:{' '}
                {statusOptions.find(opt => opt.value === filters.status)?.label}
                <button onClick={() => handleFilterChange('status', '')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Date: {filters.dateFrom || '∞'} - {filters.dateTo || '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('dateFrom', '');
                    handleFilterChange('dateTo', '');
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.savingsMin || filters.savingsMax) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Savings: €{filters.savingsMin || '0'} - €
                {filters.savingsMax || '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('savingsMin', '');
                    handleFilterChange('savingsMax', '');
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
