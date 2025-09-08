'use client';

import { useState, useEffect } from 'react';
import { Lead } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import LogoutButton from '@/components/admin/LogoutButton';

// Sample data for demonstration
const SAMPLE_LEADS: Lead[] = [
  {
    id: 'lead-001',
    created_at: new Date('2024-01-15T10:30:00').toISOString(),
    updated_at: new Date('2024-01-15T10:30:00').toISOString(),
    first_name: 'Matti',
    last_name: 'Virtanen',
    sahkoposti: 'matti.virtanen@example.com',
    puhelinnumero: '+358 40 123 4567',
    status: 'new',
    pdf_url: '/api/admin/lead-pdf/lead-001',
    form_data: {
      osoite: 'Mannerheimintie 123',
      paikkakunta: 'Helsinki',
      neliot: 120,
      lammitysmuoto: 'Öljylämmitys',
      annual_savings: 2450,
      five_year_savings: 12250,
    },
  },
  {
    id: 'lead-002',
    created_at: new Date('2024-01-14T14:20:00').toISOString(),
    updated_at: new Date('2024-01-14T14:20:00').toISOString(),
    first_name: 'Anna',
    last_name: 'Korhonen',
    sahkoposti: 'anna.korhonen@example.com',
    puhelinnumero: '+358 45 987 6543',
    status: 'contacted',
    pdf_url: '/api/admin/lead-pdf/lead-002',
    form_data: {
      osoite: 'Aleksanterinkatu 52',
      paikkakunta: 'Tampere',
      neliot: 85,
      lammitysmuoto: 'Sähkölämmitys',
      annual_savings: 1850,
      five_year_savings: 9250,
    },
  },
  {
    id: 'lead-003',
    created_at: new Date('2024-01-14T09:15:00').toISOString(),
    updated_at: new Date('2024-01-14T09:15:00').toISOString(),
    first_name: 'Jukka',
    last_name: 'Nieminen',
    sahkoposti: 'jukka.nieminen@example.com',
    puhelinnumero: '+358 50 555 1234',
    status: 'qualified',
    pdf_url: '/api/admin/lead-pdf/lead-003',
    form_data: {
      osoite: 'Hämeenkatu 15',
      paikkakunta: 'Turku',
      neliot: 150,
      lammitysmuoto: 'Kaukolämpö',
      annual_savings: 3200,
      five_year_savings: 16000,
    },
  },
  {
    id: 'lead-004',
    created_at: new Date('2024-01-13T16:45:00').toISOString(),
    updated_at: new Date('2024-01-13T16:45:00').toISOString(),
    first_name: 'Sari',
    last_name: 'Mäkinen',
    sahkoposti: 'sari.makinen@example.com',
    puhelinnumero: '+358 44 222 3333',
    status: 'converted',
    pdf_url: '/api/admin/lead-pdf/lead-004',
    pdf_generated_at: new Date('2024-01-13T16:50:00').toISOString(),
    form_data: {
      osoite: 'Kauppakatu 8',
      paikkakunta: 'Oulu',
      neliot: 110,
      lammitysmuoto: 'Maalämpö',
      annual_savings: 890,
      five_year_savings: 4450,
    },
  },
  {
    id: 'lead-005',
    created_at: new Date('2024-01-13T11:30:00').toISOString(),
    updated_at: new Date('2024-01-13T11:30:00').toISOString(),
    first_name: 'Petri',
    last_name: 'Laine',
    sahkoposti: 'petri.laine@example.com',
    puhelinnumero: '+358 41 777 8888',
    status: 'new',
    form_data: {
      osoite: 'Kirkkokatu 25',
      paikkakunta: 'Jyväskylä',
      neliot: 95,
      lammitysmuoto: 'Öljylämmitys',
      annual_savings: 2100,
      five_year_savings: 10500,
    },
  },
];

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(status: string) {
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

export default function SimpleLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setLeads(SAMPLE_LEADS);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Panel - Leads</h1>
            <LogoutButton />
          </div>
        </div>
      </div>

      <AdminNavigation />

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {leads.filter(l => l.status === 'new').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contacted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {leads.filter(l => l.status === 'contacted').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Converted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {leads.filter(l => l.status === 'converted').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leads List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading leads...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Annual Savings</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {lead.first_name} {lead.last_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <a
                                href={`mailto:${lead.sahkoposti}`}
                                className="text-blue-600 hover:underline"
                              >
                                {lead.sahkoposti}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <a
                                href={`tel:${lead.puhelinnumero}`}
                                className="text-blue-600 hover:underline"
                              >
                                {lead.puhelinnumero}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {lead.form_data?.paikkakunta || '-'}
                            </div>
                            {lead.form_data?.osoite && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {lead.form_data.osoite}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.form_data?.annual_savings ? (
                            <div>
                              <div className="font-medium text-green-600">
                                {formatCurrency(lead.form_data.annual_savings)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                per year
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {lead.pdf_url ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(lead.pdf_url, '_blank')
                                }
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" disabled>
                                <FileText className="w-4 h-4 mr-1" />
                                Generate PDF
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note about sample data */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is sample data for demonstration. Real
            leads will appear here once customers submit the calculator form.
          </p>
        </div>
      </div>
    </div>
  );
}
