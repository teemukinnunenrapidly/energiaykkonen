'use client';

import React, { useState } from 'react';
import { Lead } from '@/lib/supabase';
import { flattenLeadData } from '@/lib/lead-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight, Mail, Phone, FileText } from 'lucide-react';

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
      return 'default';
    case 'contacted':
      return 'secondary';
    case 'qualified':
      return 'outline';
    case 'converted':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function LeadExpandedDetails({ lead }: { lead: Lead }) {
  // Flatten lead data to access JSONB fields
  const flatLead = flattenLeadData(lead);
  return (
    <div className="px-6 py-4 bg-muted/30 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Property Details */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Property Details</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Size:</span> {lead.form_data?.neliot || '-'}{' '}
              m²
            </div>
            <div>
              <span className="text-muted-foreground">Ceiling:</span>{' '}
              {lead.form_data?.huonekorkeus || "-"}m
            </div>
            <div>
              <span className="text-muted-foreground">Built:</span>{' '}
              {lead.form_data?.rakennusvuosi || "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Floors:</span>{' '}
              {lead.form_data?.floors || "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Residents:</span>{' '}
              {lead.form_data?.henkilomaara || "-"}
            </div>
          </div>
        </div>

        {/* Current Heating */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Current Heating</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>{' '}
              {lead.form_data?.lammitysmuoto || "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Annual Cost:</span>{' '}
              {formatCurrency(lead.form_data?.vesikiertoinen || 0)}
            </div>
            {lead.form_data?.current_energy_consumption && (
              <div>
                <span className="text-muted-foreground">Consumption:</span>{' '}
                {lead.form_data.current_energy_consumption.toLocaleString()} kWh/year
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Hot Water:</span>{' '}
              {lead.form_data?.hot_water_usage || "-"}
            </div>
          </div>
        </div>

        {/* Calculations */}
        <div>
          <h4 className="font-medium text-foreground mb-3">
            Heat Pump Analysis
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Energy Need:</span>{' '}
              {(lead.calculation_results?.annual_energy_need || lead.form_data?.laskennallinenenergiantarve || 0).toLocaleString()} kWh/year
            </div>
            <div>
              <span className="text-muted-foreground">HP Consumption:</span>{' '}
              {(lead.calculation_results?.heat_pump_consumption || 0).toLocaleString()} kWh/year
            </div>
            <div>
              <span className="text-muted-foreground">HP Annual Cost:</span>{' '}
              {formatCurrency(lead.calculation_results?.heat_pump_cost_annual || 0)}
            </div>
            <div className="font-medium text-green-600">
              <span className="text-muted-foreground">5-Year Savings:</span>{' '}
              {formatCurrency(lead.calculation_results?.five_year_savings || 0)}
            </div>
            <div className="font-medium text-green-600">
              <span className="text-muted-foreground">10-Year Savings:</span>{' '}
              {formatCurrency(lead.calculation_results?.ten_year_savings || 0)}
            </div>
            <div>
              <span className="text-muted-foreground">Payback:</span>{' '}
              {(lead.calculation_results?.payback_period || 0).toFixed(1)} years
            </div>
            <div>
              <span className="text-muted-foreground">CO₂ Reduction:</span>{' '}
              {(lead.calculation_results?.co2_reduction || 0).toLocaleString()} kg/year
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-medium text-foreground mb-3">
            Contact Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a
                href={`mailto:${flatLead.sahkoposti}`}
                className="text-primary hover:underline"
              >
                {flatLead.sahkoposti}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a
                href={`tel:${flatLead.puhelinnumero}`}
                className="text-primary hover:underline"
              >
                {flatLead.puhelinnumero}
              </a>
            </div>
            {lead.pdf_url && (
              <div className="flex items-center gap-2 mt-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`/api/admin/lead-pdf/${lead.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Savings Report PDF
                </a>
              </div>
            )}
            {flatLead.osoite && (
              <div>
                <span className="text-muted-foreground">Address:</span>{' '}
                {flatLead.osoite}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Prefers:</span>{' '}
              {(flatLead as any).valittutukimuoto || '-'}
            </div>
            {(flatLead as any).message && (
              <div>
                <span className="text-muted-foreground">Message:</span>
                <p className="mt-1 text-foreground italic">
                  &ldquo;{(flatLead as any).message}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div>
            <h4 className="font-medium text-foreground mb-3">Notes</h4>
            <p className="text-sm text-foreground">{lead.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Metadata</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>{' '}
              {formatDate(lead.created_at)}
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>{' '}
              {formatDate(lead.updated_at)}
            </div>
            {lead.ip_address && (
              <div>
                <span className="text-muted-foreground">IP:</span>{' '}
                {lead.ip_address}
              </div>
            )}
            {lead.source_page && (
              <div>
                <span className="text-muted-foreground">Source:</span>
                <span className="ml-1 text-xs bg-muted px-2 py-1 rounded-md">
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

  // Flatten leads data for backward compatibility
  const flattenedLeads = leads.map(flattenLeadData);

  const toggleRowExpansion = (leadId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [leadId]: !prev[leadId],
    }));
  };

  const totalPages = Math.ceil(totalCount / LEADS_PER_PAGE);

  if (flattenedLeads.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">No leads found</p>
            <p className="text-sm mt-2">
              Leads will appear here when customers submit the calculator form.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pagination Info */}
      <div className="flex justify-end">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Annual Savings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flattenedLeads.map(lead => (
                <React.Fragment key={lead.id}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      <button
                        onClick={() => toggleRowExpansion(lead.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedRows[lead.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead.nimi}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${lead.sahkoposti}`}
                        className="text-primary hover:underline"
                      >
                        {lead.sahkoposti}
                      </a>
                    </TableCell>
                    <TableCell>{lead.paikkakunta || '-'}</TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatCurrency(lead.calculation_results?.annual_savings || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lead.form_data?.neliot || 0}m² • {lead.form_data?.lammitysmuoto || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </TableCell>
                  </TableRow>
                  {expandedRows[lead.id] && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <LeadExpandedDetails lead={lead} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {flattenedLeads.map(lead => (
          <Card key={lead.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-foreground">
                    {lead.nimi}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {lead.paikkakunta || 'No city'}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(lead.status)}>
                  {lead.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual Savings:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(lead.calculation_results?.annual_savings || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property:</span>
                  <span>
                    {lead.form_data?.neliot || 0}m² • {lead.form_data?.lammitysmuoto || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(lead.created_at)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <div className="flex gap-2">
                  <a
                    href={`mailto:${lead.sahkoposti}`}
                    className="text-primary hover:underline text-sm"
                  >
                    Email
                  </a>
                  <a
                    href={`tel:${lead.puhelinnumero}`}
                    className="text-primary hover:underline text-sm"
                  >
                    Call
                  </a>
                  {lead.pdf_url && (
                    <a
                      href={`/api/admin/lead-pdf/${lead.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      PDF
                    </a>
                  )}
                </div>
                <button
                  onClick={() => toggleRowExpansion(lead.id)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {expandedRows[lead.id] ? 'Less' : 'More'}
                </button>
              </div>

              {expandedRows[lead.id] && (
                <div className="mt-4 pt-4 border-t">
                  <LeadExpandedDetails lead={lead} />
                </div>
              )}
            </CardContent>
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
