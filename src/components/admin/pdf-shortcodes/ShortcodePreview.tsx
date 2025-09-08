// src/components/admin/pdf-shortcodes/ShortcodePreview.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatabasePDFProcessor } from '@/lib/pdf/database-pdf-processor';
import type { PDFShortcode } from '@/lib/pdf/database-pdf-processor';
import type { Lead } from '@/lib/supabase';

export function ShortcodePreview({ shortcode }: { shortcode?: PDFShortcode }) {
  const [preview, setPreview] = useState<string>('');

  // Käytä mock lead-dataa esikatseluun
  const mockLead: Lead = {
    id: 'preview-123',
    nimi: 'Matti Meikäläinen',
    sahkoposti: 'matti@example.com',
    puhelinnumero: '040 123 4567',
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    form_data: {
      osoite: 'Esimerkkikatu 123',
      paikkakunta: 'Helsinki',
      valittutukimuoto: 'Email',
      neliot: 120,
      huonekorkeus: 2.5,
      rakennusvuosi: '1991-2010',
      floors: 2,
      lammitysmuoto: 'Oil',
      vesikiertoinen: 2600,
      current_energy_consumption: 22000,
      henkilomaara: 4,
      hot_water_usage: 'Normal',
      annual_energy_need: 22000,
      heat_pump_consumption: 6500,
      heat_pump_cost_annual: 975,
      payback_period: 9.2,
      co2_reduction: 5320,
    },
    calculation_results: {
      annual_savings: 1625,
      five_year_savings: 8125,
      ten_year_savings: 16250,
    },
  };

  useEffect(() => {
    const generatePreview = async () => {
      if (shortcode) {
        try {
          const processor = new DatabasePDFProcessor(mockLead);
          const template = shortcode.code;
          const result = await processor.process(template);
          setPreview(result);
        } catch (error) {
          console.error('Preview error:', error);
          setPreview('Error');
        }
      }
    };

    generatePreview();
  }, [shortcode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Esikatselu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Shortcode</Label>
            <div className="bg-muted p-2 rounded font-mono text-sm">
              {shortcode?.code || '-'}
            </div>
          </div>

          <div>
            <Label className="text-xs">Tulos</Label>
            <div className="bg-accent p-3 rounded font-medium">
              {preview || '-'}
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Esikatselu käyttää esimerkkidataa. Todellisessa PDF:ssä arvot
              tulevat asiakkaan tiedoista.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
