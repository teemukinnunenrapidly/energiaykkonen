'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Settings2, FileImage } from 'lucide-react';
import { ShortcodeList } from '@/components/admin/pdf-shortcodes/ShortcodeList';
import { ShortcodeEditor } from '@/components/admin/pdf-shortcodes/ShortcodeEditor';
import { PDFPreview } from '@/components/admin/pdf-settings/PDFPreview';
import { supabase } from '@/lib/supabase';
import type { PDFShortcode } from '@/lib/pdf/database-pdf-processor';

export default function PDFSettingsPage() {
  const [shortcodes, setShortcodes] = useState<PDFShortcode[]>([]);
  const [selectedShortcode, setSelectedShortcode] =
    useState<PDFShortcode | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadShortcodes();
  }, []);

  const loadShortcodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdf_shortcodes')
        .select('*')
        .order('category')
        .order('name');

      if (error) {
        throw error;
      }
      setShortcodes(data || []);
    } catch (error) {
      console.error('Error loading shortcodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedShortcode({
      id: '',
      code: '',
      name: '',
      description: '',
      category: 'custom',
      source_type: 'field',
      source_value: '',
      format_type: 'text',
      format_options: {},
      is_active: true,
    } as PDFShortcode);
    setIsCreating(true);
    setShowEditor(true);
  };

  const handleSave = async (shortcode: PDFShortcode) => {
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('pdf_shortcodes')
          .insert([shortcode]);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('pdf_shortcodes')
          .update(shortcode)
          .eq('id', shortcode.id);
        if (error) {
          throw error;
        }
      }

      await loadShortcodes();
      setSelectedShortcode(null);
      setIsCreating(false);
      setShowEditor(false);
    } catch (error) {
      console.error('Error saving shortcode:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haluatko varmasti poistaa tämän shortcoden?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pdf_shortcodes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      await loadShortcodes();
      setSelectedShortcode(null);
      setShowEditor(false);
    } catch (error) {
      console.error('Error deleting shortcode:', error);
    }
  };

  const handleEdit = (shortcode: PDFShortcode) => {
    setSelectedShortcode(shortcode);
    setIsCreating(false);
    setShowEditor(true);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">PDF Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Hallitse PDF-dokumenttien asetuksia ja shortcodeja. Voit lisätä uusia
          kenttiä, kaavoja ja muotoiluja ilman koodimuutoksia.
        </p>
      </div>

      {showEditor ? (
        <ShortcodeEditor
          shortcode={selectedShortcode!}
          onSave={handleSave}
          onCancel={() => {
            setSelectedShortcode(null);
            setIsCreating(false);
            setShowEditor(false);
          }}
          onDelete={handleDelete}
          isNew={isCreating}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              PDF Shortcodet
            </h2>
            <Button
              onClick={handleCreateNew}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Uusi Shortcode
            </Button>
          </div>

          <ShortcodeList
            shortcodes={shortcodes}
            onSelect={handleEdit}
            loading={loading}
          />

          {/* PDF Preview Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <FileImage className="w-5 h-5" />
              PDF Esikatselu
            </h2>
            <Card className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-sm">
                  Säästölaskelma - Live Preview
                </CardTitle>
                <CardDescription className="text-xs">
                  Tämä näyttää miltä PDF näyttää asiakkaalle. Shortcodet
                  päivittyvät automaattisesti.
                </CardDescription>
                <div className="flex gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-mono text-[10px]">
                      {'{field}'}
                    </span>
                    <span className="text-gray-600">Form data fields</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono">
                      <span className="bg-green-100 text-green-700 px-1 rounded">
                        {'{field}'}
                      </span>
                      <span className="text-blue-600"> × 100</span>
                    </span>
                    <span className="text-gray-600">
                      Calculations with form data
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono text-[10px]">
                      calc_result
                    </span>
                    <span className="text-gray-600">Calculated values</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 font-mono text-[10px]">
                      1.30
                    </span>
                    <span className="text-gray-600">Constants</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-gray-100">
                <div className="p-8 overflow-x-auto">
                  <PDFPreview />
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs font-semibold mb-2">Saatavilla: form_data</div>
                      <pre className="text-[10px] bg-white p-3 rounded border max-h-64 overflow-auto">{JSON.stringify({
                        nimi: '{nimi}',
                        sahkoposti: '{sahkoposti}',
                        puhelinnumero: '{puhelinnumero}',
                        osoite: '{osoite}',
                        paikkakunta: '{paikkakunta}',
                        postcode: '{postcode}',
                        neliot: '{neliot}',
                        huonekorkeus: '{huonekorkeus}',
                        rakennusvuosi: '{rakennusvuosi}',
                        henkilomaara: '{henkilomaara}',
                        lammitysmuoto: '{lammitysmuoto}',
                        kokonaismenekki: '{kokonaismenekki}',
                      }, null, 2)}</pre>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-2">Saatavilla: calculation_results</div>
                      <pre className="text-[10px] bg-white p-3 rounded border max-h-64 overflow-auto">{JSON.stringify({
                        annual_energy_need: 'annual_energy_need',
                        heat_pump_consumption: 'heat_pump_consumption',
                        heat_pump_cost_annual: 'heat_pump_cost_annual',
                        annual_savings: 'annual_savings',
                        five_year_savings: 'five_year_savings',
                        ten_year_savings: 'ten_year_savings',
                        co2_reduction: 'co2_reduction',
                      }, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
