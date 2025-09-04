import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Trash2, X, TestTube, Info } from 'lucide-react';
import { validateFormula } from '@/lib/pdf/safe-formula-evaluator';
import type { PDFShortcode } from '@/lib/pdf/database-pdf-processor';

interface ShortcodeEditorProps {
  shortcode: PDFShortcode;
  onSave: (shortcode: PDFShortcode) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  isNew?: boolean;
}

export function ShortcodeEditor({
  shortcode,
  onSave,
  onCancel,
  onDelete,
  isNew,
}: ShortcodeEditorProps) {
  const [formData, setFormData] = useState<PDFShortcode>(shortcode);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleChange = (field: keyof PDFShortcode, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate formula if source type is formula
    if (field === 'source_value' && formData.source_type === 'formula') {
      const validation = validateFormula(value);
      setFormulaError(
        validation.valid ? null : validation.error || 'Invalid formula'
      );
    }
  };

  const handleFormatOptionsChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      format_options: {
        ...prev.format_options,
        [key]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.code || !formData.name || !formData.source_value) {
      alert('Täytä kaikki pakolliset kentät');
      return;
    }

    // Ensure code has brackets
    if (!formData.code.startsWith('[')) {
      formData.code = '[' + formData.code;
    }
    if (!formData.code.endsWith(']')) {
      formData.code = formData.code + ']';
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isNew ? 'Uusi Shortcode' : 'Muokkaa Shortcodea'}
          </CardTitle>
          <CardDescription>
            Määrittele miten shortcode toimii ja miten se muotoillaan
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Shortcode *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={e => handleChange('code', e.target.value)}
                  placeholder="[field_name]"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Käytä hakasulkeita, esim: [customer_name]
                </p>
              </div>

              <div>
                <Label htmlFor="name">Nimi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Asiakkaan nimi"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Kuvaus</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Mitä tämä shortcode tekee..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Kategoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={v => handleChange('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Asiakas</SelectItem>
                    <SelectItem value="property">Kiinteistö</SelectItem>
                    <SelectItem value="calculation">Laskelma</SelectItem>
                    <SelectItem value="heating">Lämmitys</SelectItem>
                    <SelectItem value="system">Järjestelmä</SelectItem>
                    <SelectItem value="custom">Mukautettu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Aktiivinen</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={v => handleChange('is_active', v)}
                />
              </div>
            </div>
          </div>

          {/* Source Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Datalähde</h3>

            <div>
              <Label htmlFor="source_type">Lähdetyyppi *</Label>
              <Select
                value={formData.source_type}
                onValueChange={v => handleChange('source_type', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field">Kenttä (suora arvo)</SelectItem>
                  <SelectItem value="formula">Kaava (laskettu)</SelectItem>
                  <SelectItem value="static">Kiinteä arvo</SelectItem>
                  <SelectItem value="special">Erikoisfunktio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source_value">
                {formData.source_type === 'field' && 'Kentän nimi *'}
                {formData.source_type === 'formula' && 'Kaava *'}
                {formData.source_type === 'static' && 'Arvo *'}
                {formData.source_type === 'special' && 'Funktion nimi *'}
              </Label>

              {formData.source_type === 'formula' ? (
                <Textarea
                  id="source_value"
                  value={formData.source_value}
                  onChange={e => handleChange('source_value', e.target.value)}
                  placeholder="annual_savings / current_heating_cost * 100"
                  className="font-mono"
                  rows={3}
                />
              ) : (
                <Input
                  id="source_value"
                  value={formData.source_value}
                  onChange={e => handleChange('source_value', e.target.value)}
                  placeholder={
                    formData.source_type === 'field'
                      ? 'first_name'
                      : formData.source_type === 'static'
                        ? 'Kiinteä teksti'
                        : 'current_date'
                  }
                  className={
                    formData.source_type === 'field' ? 'font-mono' : ''
                  }
                />
              )}

              {formulaError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{formulaError}</AlertDescription>
                </Alert>
              )}

              {formData.source_type === 'field' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Käytä lead-taulun sarakkeen nimeä, esim: first_name,
                  annual_savings
                </p>
              )}
              {formData.source_type === 'formula' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Käytä matemaattisia operaatioita: +, -, *, /, (). Viittaa
                  kenttiin nimellä.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fallback">Varajärvo</Label>
              <Input
                id="fallback"
                value={formData.fallback_value || ''}
                onChange={e => handleChange('fallback_value', e.target.value)}
                placeholder="Arvo jos data puuttuu"
              />
            </div>
          </div>

          {/* Formatting */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Muotoilu</h3>

            <div>
              <Label htmlFor="format_type">Muotoilutyyppi</Label>
              <Select
                value={formData.format_type || 'text'}
                onValueChange={v => handleChange('format_type', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Teksti</SelectItem>
                  <SelectItem value="number">Numero</SelectItem>
                  <SelectItem value="currency">Valuutta</SelectItem>
                  <SelectItem value="percentage">Prosentti</SelectItem>
                  <SelectItem value="date">Päivämäärä</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.format_type === 'number' ||
              formData.format_type === 'currency' ||
              formData.format_type === 'percentage') && (
              <div>
                <Label htmlFor="decimals">Desimaalit</Label>
                <Input
                  id="decimals"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.format_options?.decimals || 0}
                  onChange={e =>
                    handleFormatOptionsChange(
                      'decimals',
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            )}

            {formData.format_type === 'number' && (
              <>
                <div>
                  <Label htmlFor="prefix">Etuliite</Label>
                  <Input
                    id="prefix"
                    value={formData.format_options?.prefix || ''}
                    onChange={e =>
                      handleFormatOptionsChange('prefix', e.target.value)
                    }
                    placeholder="esim: ~"
                  />
                </div>

                <div>
                  <Label htmlFor="suffix">Jälkiliite</Label>
                  <Input
                    id="suffix"
                    value={formData.format_options?.suffix || ''}
                    onChange={e =>
                      handleFormatOptionsChange('suffix', e.target.value)
                    }
                    placeholder="esim: kWh"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <div>
            {!isNew && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(formData.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Poista
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Peruuta
            </Button>

            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {isNew ? 'Luo' : 'Tallenna'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
