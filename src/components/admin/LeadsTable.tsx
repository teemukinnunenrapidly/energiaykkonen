'use client';

import React, { useState } from 'react';
import { Lead } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Mail, Phone } from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

interface ExpandedRows {
  [key: string]: boolean;
}

const LEADS_PER_PAGE = 10;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fi-FI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'contacted':
      return 'bg-yellow-100 text-yellow-800';
    case 'qualified':
      return 'bg-green-100 text-green-800';
    case 'converted':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function LeadExpandedDetails({ lead }: { lead: Lead }) {
  return (
    <div className="px-6 py-4 bg-gray-50 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Property Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Property Details</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Size:</span> {lead.square_meters}{' '}
              m²
            </div>
            <div>
              <span className="text-gray-500">Ceiling:</span>{' '}
              {lead.ceiling_height}m
            </div>
            <div>
              <span className="text-gray-500">Built:</span>{' '}
              {lead.construction_year}
            </div>
            <div>
              <span className="text-gray-500">Floors:</span> {lead.floors}
            </div>
            <div>
              <span className="text-gray-500">Residents:</span> {lead.residents}
            </div>
          </div>
        </div>

        {/* Current Heating */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Current Heating</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Type:</span> {lead.heating_type}
            </div>
            <div>
              <span className="text-gray-500">Annual Cost:</span>{' '}
              {formatCurrency(lead.current_heating_cost)}
            </div>
            {lead.current_energy_consumption && (
              <div>
                <span className="text-gray-500">Consumption:</span>{' '}
                {lead.current_energy_consumption.toLocaleString()} kWh/year
              </div>
            )}
            <div>
              <span className="text-gray-500">Hot Water:</span>{' '}
              {lead.hot_water_usage}
            </div>
          </div>
        </div>

        {/* Calculations */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Heat Pump Analysis</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Energy Need:</span>{' '}
              {lead.annual_energy_need.toLocaleString()} kWh/year
            </div>
            <div>
              <span className="text-gray-500">HP Consumption:</span>{' '}
              {lead.heat_pump_consumption.toLocaleString()} kWh/year
            </div>
            <div>
              <span className="text-gray-500">HP Annual Cost:</span>{' '}
              {formatCurrency(lead.heat_pump_cost_annual)}
            </div>
            <div className="font-medium text-green-600">
              <span className="text-gray-500">5-Year Savings:</span>{' '}
              {formatCurrency(lead.five_year_savings)}
            </div>
            <div className="font-medium text-green-600">
              <span className="text-gray-500">10-Year Savings:</span>{' '}
              {formatCurrency(lead.ten_year_savings)}
            </div>
            <div>
              <span className="text-gray-500">Payback:</span>{' '}
              {lead.payback_period.toFixed(1)} years
            </div>
            <div>
              <span className="text-gray-500">CO₂ Reduction:</span>{' '}
              {lead.co2_reduction.toLocaleString()} kg/year
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Contact Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <a
                href={`mailto:${lead.email}`}
                className="text-blue-600 hover:underline"
              >
                {lead.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <a
                href={`tel:${lead.phone}`}
                className="text-blue-600 hover:underline"
              >
                {lead.phone}
              </a>
            </div>
            {lead.street_address && (
              <div>
                <span className="text-gray-500">Address:</span>{' '}
                {lead.street_address}
              </div>
            )}
            <div>
              <span className="text-gray-500">Prefers:</span>{' '}
              {lead.contact_preference}
            </div>
            {lead.message && (
              <div>
                <span className="text-gray-500">Message:</span>
                <p className="mt-1 text-gray-700 italic">
                  &ldquo;{lead.message}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
            <p className="text-sm text-gray-700">{lead.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Metadata</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              {formatDate(lead.created_at)}
            </div>
            <div>
              <span className="text-gray-500">Updated:</span>{' '}
              {formatDate(lead.updated_at)}
            </div>
            {lead.ip_address && (
              <div>
                <span className="text-gray-500">IP:</span> {lead.ip_address}
              </div>
            )}
            {lead.source_page && (
              <div>
                <span className="text-gray-500">Source:</span>
                <span className="ml-1 text-xs bg-gray-200 px-1 rounded">
                  {lead.source_page}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadsTable({
  leads,
  totalCount,
  currentPage,
  onPageChange,
}: LeadsTableProps) {
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});

  const toggleRowExpansion = (leadId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [leadId]: !prev[leadId],
    }));
  };

  const totalPages = Math.ceil(totalCount / LEADS_PER_PAGE);

  if (leads.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">No leads found</p>
          <p className="text-sm mt-2">
            Leads will appear here when customers submit the calculator form.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pagination Info */}
      <div className="flex justify-end">
        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annual Savings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map(lead => (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleRowExpansion(lead.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedRows[lead.id] ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {lead.city || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-green-600">
                          {formatCurrency(lead.annual_savings)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.square_meters}m² • {lead.heating_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusBadgeVariant(lead.status)}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                    {expandedRows[lead.id] && (
                      <tr>
                        <td colSpan={7}>
                          <LeadExpandedDetails lead={lead} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {leads.map(lead => (
          <Card key={lead.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-gray-900">
                  {lead.first_name} {lead.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {lead.city || 'No city'}
                </p>
              </div>
              <Badge className={getStatusBadgeVariant(lead.status)}>
                {lead.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Annual Savings:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(lead.annual_savings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Property:</span>
                <span>
                  {lead.square_meters}m² • {lead.heating_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span>{formatDate(lead.created_at)}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <div className="flex gap-2">
                <a
                  href={`mailto:${lead.email}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Email
                </a>
                <a
                  href={`tel:${lead.phone}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Call
                </a>
              </div>
              <button
                onClick={() => toggleRowExpansion(lead.id)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {expandedRows[lead.id] ? 'Less' : 'More'}
              </button>
            </div>

            {expandedRows[lead.id] && (
              <div className="mt-4 pt-4 border-t">
                <LeadExpandedDetails lead={lead} />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
