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
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Mail, Phone, MapPin, Calendar, Trash2, Code } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminNavigation from '@/components/admin/AdminNavigation';
import LogoutButton from '@/components/admin/LogoutButton';

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showFormDataModal, setShowFormDataModal] = useState(false);
  const [selectedFormData, setSelectedFormData] = useState<any>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/admin/leads');
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      setLeads(data.leads || []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeads);
    if (checked) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.size === 0) return;
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedLeads.size} lead(s)?`)) return;
      try {
        const response = await fetch('/api/admin/leads/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedLeads) }),
        });
        if (response.ok) {
          await fetchLeads();
          setSelectedLeads(new Set());
        }
      } catch {}
    }
  };

  const handleShowFormData = (lead: Lead) => {
    setSelectedFormData({ ...lead.form_data, calculation_results: lead.calculation_results });
    setShowFormDataModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <LogoutButton />
          </div>
        </div>
      </div>

      <AdminNavigation />

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Leads</CardTitle>
              <Button variant="outline" size="sm">Export CSV</Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedLeads.size > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} selected</span>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedLeads(new Set())}>Clear Selection</Button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">Loading leads...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedLeads.size === leads.length && leads.length > 0}
                          onCheckedChange={checked => handleSelectAll(!!checked)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Nimi</TableHead>
                      <TableHead>Sähköposti</TableHead>
                      <TableHead>Puhelin</TableHead>
                      <TableHead>Paikkakunta</TableHead>
                      <TableHead>Luotu</TableHead>
                      <TableHead>PDF</TableHead>
                      <TableHead className="text-right">Toiminnot</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-10">
                          Ei liidejä näytettäväksi.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map(lead => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLeads.has(lead.id)}
                              onCheckedChange={checked => handleSelectLead(lead.id, !!checked)}
                              aria-label={`Select ${lead.nimi || lead.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" /> {lead.nimi || '—'}
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" /> {lead.sahkoposti || '—'}
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" /> {lead.puhelinnumero || '—'}
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" /> {lead.paikkakunta || '—'}
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" /> {formatDate(lead.created_at)}
                          </TableCell>
                          <TableCell>
                            {lead.pdf_url ? (
                              <a href={lead.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                Lataa
                              </a>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleShowFormData(lead)}>
                              <Code className="w-4 h-4 mr-2" /> Näytä data
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showFormDataModal} onOpenChange={setShowFormDataModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Form Data (JSON)</DialogTitle></DialogHeader>
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
              {selectedFormData && JSON.stringify(selectedFormData, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
