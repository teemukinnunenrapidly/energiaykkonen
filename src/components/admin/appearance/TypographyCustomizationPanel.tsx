'use client';

import { useState } from 'react';
import { TypographySettings } from '@/lib/types/theme';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Type, AlignLeft, Copy, Check } from 'lucide-react';

interface TypographyCustomizationPanelProps {
  typography: TypographySettings;
  onTypographyChange: (typography: TypographySettings) => void;
  className?: string;
}

export default function TypographyCustomizationPanel({
  typography,
  onTypographyChange,
  className = '',
}: TypographyCustomizationPanelProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const handleTypographyChange = (path: string, value: string | number) => {
    const newTypography = { ...typography };
    const pathParts = path.split('.');
    let current: any = newTypography;

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }

    current[pathParts[pathParts.length - 1]] = value;
    onTypographyChange(newTypography);
  };

  const handleCopyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch (err) {
      console.error('Failed to copy value:', err);
    }
  };

  const fontFamilies = [
    { value: 'Inter', label: 'Inter (System)', category: 'System' },
    { value: 'Roboto', label: 'Roboto', category: 'Google Fonts' },
    { value: 'Open Sans', label: 'Open Sans', category: 'Google Fonts' },
    { value: 'Lato', label: 'Lato', category: 'Google Fonts' },
    { value: 'Poppins', label: 'Poppins', category: 'Google Fonts' },
    { value: 'Montserrat', label: 'Montserrat', category: 'Google Fonts' },
    {
      value: 'Source Sans Pro',
      label: 'Source Sans Pro',
      category: 'Google Fonts',
    },
    { value: 'Raleway', label: 'Raleway', category: 'Google Fonts' },
    { value: 'Ubuntu', label: 'Ubuntu', category: 'Google Fonts' },
    { value: 'Nunito', label: 'Nunito', category: 'Google Fonts' },
    { value: 'Playfair Display', label: 'Playfair Display', category: 'Serif' },
    { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
    { value: 'Georgia', label: 'Georgia', category: 'System Serif' },
    {
      value: 'Times New Roman',
      label: 'Times New Roman',
      category: 'System Serif',
    },
    { value: 'Arial', label: 'Arial', category: 'System Sans' },
    { value: 'Helvetica', label: 'Helvetica', category: 'System Sans' },
    { value: 'Verdana', label: 'Verdana', category: 'System Sans' },
  ];

  const TypographyInput = ({
    path,
    value,
    label,
    description,
    type = 'text',
    options,
    min,
    max,
    step,
  }: {
    path: string;
    value: string | number;
    label: string;
    description?: string;
    type?: 'text' | 'select' | 'range';
    options?: { value: string; label: string; category?: string }[];
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopyValue(String(value))}
          className="h-6 w-6 p-0"
          title="Copy value"
        >
          {copiedValue === String(value) ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {type === 'select' && options ? (
        <Select
          value={String(value)}
          onValueChange={val => handleTypographyChange(path, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {option.category && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {option.category}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === 'range' ? (
        <div className="space-y-2">
          <Input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e =>
              handleTypographyChange(path, parseFloat(e.target.value))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{min}</span>
            <span className="font-medium">{value}</span>
            <span>{max}</span>
          </div>
        </div>
      ) : (
        <Input
          type="text"
          value={value}
          onChange={e => handleTypographyChange(path, e.target.value)}
          className="font-mono text-sm"
        />
      )}

      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );

  const TypographySection = ({
    title,
    settings,
    basePath,
  }: {
    title: string;
    settings: any;
    basePath: string;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Type className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(settings).map(([key, value]) => {
          // Handle font family selection
          if (basePath === 'fontFamily') {
            return (
              <TypographyInput
                key={key}
                path={`${basePath}.${key}`}
                value={value as string}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                description={getTypographyDescription(basePath, key)}
                type="select"
                options={fontFamilies}
              />
            );
          }

          // Handle font weight selection
          if (basePath === 'fontWeight') {
            return (
              <TypographyInput
                key={key}
                path={`${basePath}.${key}`}
                value={value as number}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                description={getTypographyDescription(basePath, key)}
                type="range"
                min={100}
                max={900}
                step={100}
              />
            );
          }

          // Handle line height selection
          if (basePath === 'lineHeight') {
            return (
              <TypographyInput
                key={key}
                path={`${basePath}.${key}`}
                value={value as number}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                description={getTypographyDescription(basePath, key)}
                type="range"
                min={1}
                max={3}
                step={0.1}
              />
            );
          }

          // Default text input for other properties
          return (
            <TypographyInput
              key={key}
              path={`${basePath}.${key}`}
              value={value as string | number}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              description={getTypographyDescription(basePath, key)}
            />
          );
        })}
      </CardContent>
    </Card>
  );

  const getTypographyDescription = (
    category: string,
    property: string
  ): string => {
    const descriptions: Record<string, Record<string, string>> = {
      headings: {
        fontFamily: 'Font family for headings',
        fontSize: 'Font size in pixels or rem units',
        fontWeight: 'Font weight (100-900)',
        lineHeight: 'Line height multiplier',
        letterSpacing: 'Letter spacing in pixels or em units',
      },
      body: {
        fontFamily: 'Font family for body text',
        fontSize: 'Font size for body text',
        fontWeight: 'Font weight for body text',
        lineHeight: 'Line height for body text',
        letterSpacing: 'Letter spacing for body text',
      },
      buttons: {
        fontFamily: 'Font family for button text',
        fontSize: 'Font size for button text',
        fontWeight: 'Font weight for button text',
        lineHeight: 'Line height for button text',
        letterSpacing: 'Letter spacing for button text',
      },
      inputs: {
        fontFamily: 'Font family for input text',
        fontSize: 'Font size for input text',
        fontWeight: 'Font weight for input text',
        lineHeight: 'Line height for input text',
        letterSpacing: 'Letter spacing for input text',
      },
      labels: {
        fontFamily: 'Font family for label text',
        fontSize: 'Font size for label text',
        fontWeight: 'Font weight for label text',
        lineHeight: 'Line height for label text',
        letterSpacing: 'Letter spacing for label text',
      },
    };

    return (
      descriptions[category]?.[property] ||
      `Customize ${property} for ${category}`
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Typography Customization
          </h3>
          <p className="text-sm text-gray-600">
            Customize fonts, sizes, weights, and spacing for all text elements
          </p>
        </div>
      </div>

      {/* Typography Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Font Family */}
        <TypographySection
          title="Font Family"
          settings={typography.fontFamily}
          basePath="fontFamily"
        />

        {/* Font Size */}
        <TypographySection
          title="Font Size"
          settings={typography.fontSize}
          basePath="fontSize"
        />

        {/* Font Weight */}
        <TypographySection
          title="Font Weight"
          settings={typography.fontWeight}
          basePath="fontWeight"
        />

        {/* Line Height */}
        <TypographySection
          title="Line Height"
          settings={typography.lineHeight}
          basePath="lineHeight"
        />

        {/* Letter Spacing */}
        <TypographySection
          title="Letter Spacing"
          settings={typography.letterSpacing}
          basePath="letterSpacing"
        />
      </div>

      {/* Typography Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Typography Preview</CardTitle>
          <CardDescription>
            See how your typography settings look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Typography Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Typography Preview
              </Label>
              <div className="space-y-4">
                <h1
                  className="text-4xl font-bold"
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize['4xl'],
                    fontWeight: typography.fontWeight.bold,
                    lineHeight: typography.lineHeight.tight,
                    letterSpacing: typography.letterSpacing.normal,
                  }}
                >
                  Main Heading
                </h1>
                <h2
                  className="text-2xl font-semibold"
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.semibold,
                    lineHeight: typography.lineHeight.normal,
                    letterSpacing: typography.letterSpacing.normal,
                  }}
                >
                  Sub Heading
                </h2>
                <h3
                  className="text-xl font-medium"
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.medium,
                    lineHeight: typography.lineHeight.normal,
                    letterSpacing: typography.letterSpacing.normal,
                  }}
                >
                  Section Heading
                </h3>
              </div>
            </div>

            {/* Body Text Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Body Text
              </Label>
              <p
                className="max-w-2xl"
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.normal,
                  lineHeight: typography.lineHeight.relaxed,
                  letterSpacing: typography.letterSpacing.normal,
                }}
              >
                This is a sample paragraph that demonstrates how your body text
                will look with the current typography settings. It includes
                multiple sentences to show line height and spacing effects. The
                text should be easily readable and well-proportioned for optimal
                user experience.
              </p>
            </div>

            {/* Font Family Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Font Family Preview
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Primary</h4>
                  <p
                    className="text-lg"
                    style={{ fontFamily: typography.fontFamily.primary }}
                  >
                    The quick brown fox
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typography.fontFamily.primary}
                  </p>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Secondary</h4>
                  <p
                    className="text-lg"
                    style={{ fontFamily: typography.fontFamily.secondary }}
                  >
                    The quick brown fox
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typography.fontFamily.secondary}
                  </p>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Monospace</h4>
                  <p
                    className="text-lg"
                    style={{ fontFamily: typography.fontFamily.monospace }}
                  >
                    The quick brown fox
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typography.fontFamily.monospace}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common typography adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Reset to default typography
                const defaultTypography = {
                  fontFamily: {
                    primary: 'Inter, system-ui, sans-serif',
                    secondary: 'Georgia, serif',
                    monospace: 'Fira Code, monospace',
                  },
                  fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    base: '1rem',
                    lg: '1.125rem',
                    xl: '1.25rem',
                    '2xl': '1.5rem',
                    '3xl': '1.875rem',
                    '4xl': '2.25rem',
                    '5xl': '3rem',
                  },
                  fontWeight: {
                    thin: 100,
                    light: 300,
                    normal: 400,
                    medium: 500,
                    semibold: 600,
                    bold: 700,
                    extrabold: 800,
                  },
                  lineHeight: {
                    none: 1,
                    tight: 1.25,
                    normal: 1.5,
                    relaxed: 1.75,
                    loose: 2,
                  },
                  letterSpacing: {
                    tighter: '-0.05em',
                    tight: '-0.025em',
                    normal: '0',
                    wide: '0.025em',
                    wider: '0.05em',
                    widest: '0.1em',
                  },
                };
                onTypographyChange(defaultTypography);
              }}
              className="flex items-center gap-2"
            >
              <Type className="w-4 h-4" />
              Reset to Default
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Increase readability
                const newTypography = { ...typography };
                newTypography.lineHeight.relaxed = Math.min(
                  newTypography.lineHeight.relaxed + 0.1,
                  2.0
                );
                newTypography.fontSize.base = '1.125rem'; // Increase base font size
                onTypographyChange(newTypography);
              }}
              className="flex items-center gap-2"
            >
              <AlignLeft className="w-4 h-4" />
              Increase Readability
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Modern typography
                const newTypography = { ...typography };
                newTypography.fontFamily.primary =
                  'Poppins, system-ui, sans-serif';
                newTypography.fontFamily.secondary =
                  'Inter, system-ui, sans-serif';
                newTypography.fontWeight.semibold = 600;
                newTypography.fontWeight.normal = 400;
                onTypographyChange(newTypography);
              }}
              className="flex items-center gap-2"
            >
              <Type className="w-4 h-4" />
              Modern Style
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
