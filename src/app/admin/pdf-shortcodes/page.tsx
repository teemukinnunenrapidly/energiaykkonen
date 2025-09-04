'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileCode, Eye, Settings, TestTube } from 'lucide-react';
import { ShortcodeList } from '@/components/admin/pdf-shortcodes/ShortcodeList';
import { ShortcodeEditor } from '@/components/admin/pdf-shortcodes/ShortcodeEditor';
import { ShortcodePreview } from '@/components/admin/pdf-shortcodes/ShortcodePreview';
import { AvailableFields } from '@/components/admin/pdf-shortcodes/AvailableFields';
import { supabase } from '@/lib/supabase';
import type { PDFShortcode } from '@/lib/pdf/database-pdf-processor';

export default function PDFShortcodesPage() {
  const [shortcodes, setShortcodes] = useState<PDFShortcode[]>([]);
  const [selectedShortcode, setSelectedShortcode] = useState<PDFShortcode | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');

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

      if (error) throw error;
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
    setActiveTab('editor');
  };

  const handleSave = async (shortcode: PDFShortcode) => {
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('pdf_shortcodes')
          .insert([shortcode]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pdf_shortcodes')
          .update(shortcode)
          .eq('id', shortcode.id);
        if (error) throw error;
      }
      
      await loadShortcodes();
      setSelectedShortcode(null);
      setIsCreating(false);
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving shortcode:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haluatko varmasti poistaa taman shortcoden?')) return;
    
    try {
      const { error } = await supabase
        .from('pdf_shortcodes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadShortcodes();
      setSelectedShortcode(null);
    } catch (error) {
      console.error('Error deleting shortcode:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">PDF Shortcodes</h1>
        <p className="text-muted-foreground">
          Hallitse PDF-dokumenteissa kaytettavia shortcodeja. Voit lisata uusia kenttia, kaavoja ja muotoiluja ilman koodimuutoksia.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Shortcodet
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Muokkaus
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Esikatselu
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Kaytettavissa olevat kentat
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Uusi Shortcode
          </Button>
        </div>

        <TabsContent value="list" className="space-y-4">
          <ShortcodeList
            shortcodes={shortcodes}
            onSelect={(sc) => {
              setSelectedShortcode(sc);
              setIsCreating(false);
              setActiveTab('editor');
            }}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="editor">
          {selectedShortcode ? (
            <ShortcodeEditor
              shortcode={selectedShortcode}
              onSave={handleSave}
              onCancel={() => {
                setSelectedShortcode(null);
                setIsCreating(false);
                setActiveTab('list');
              }}
              onDelete={handleDelete}
              isNew={isCreating}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Valitse muokattava shortcode listalta tai luo uusi.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Valitse Shortcode</CardTitle>
                <CardDescription>
                  Valitse shortcode nahdaksesi milta se nayttaa PDFssa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shortcodes.map((sc) => (
                    <Button
                      key={sc.id}
                      variant={selectedShortcode?.id === sc.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedShortcode(sc)}
                    >
                      <code className="mr-2">{sc.code}</code>
                      <span className="text-muted-foreground">{sc.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {selectedShortcode && (
              <ShortcodePreview shortcode={selectedShortcode} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="fields">
          <AvailableFields />
        </TabsContent>
      </Tabs>
    </div>
  );
}