'use client';

import { useState } from 'react';
import { ColorSettings } from '@/lib/types/theme';
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
import { Palette, Eye, Copy, Check, RefreshCw } from 'lucide-react';

interface ColorCustomizationPanelProps {
  colors: ColorSettings;
  onColorsChange: (colors: ColorSettings) => void;
  className?: string;
}

export default function ColorCustomizationPanel({
  colors,
  onColorsChange,
  className = '',
}: ColorCustomizationPanelProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleColorChange = (path: string, value: string) => {
    const newColors = { ...colors };
    const pathParts = path.split('.');
    let current: any = newColors;

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }

    current[pathParts[pathParts.length - 1]] = value;
    onColorsChange(newColors);
  };

  const handleCopyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  const handleEyeDropper = async (path: string) => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        handleColorChange(path, result.sRGBHex);
      } catch (err) {
        console.error('Eye dropper failed:', err);
      }
    }
  };

  const ColorInput = ({
    path,
    value,
    label,
    description,
  }: {
    path: string;
    value: string;
    label: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEyeDropper(path)}
            className="h-6 w-6 p-0"
            title="Pick color from screen"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyColor(value)}
            className="h-6 w-6 p-0"
            title="Copy color value"
          >
            {copiedColor === value ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-gray-200 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <Input
          type="text"
          value={value}
          onChange={e => handleColorChange(path, e.target.value)}
          className="font-mono text-sm"
          placeholder="#FF6B00"
        />
        <Input
          type="color"
          value={value}
          onChange={e => handleColorChange(path, e.target.value)}
          className="w-12 h-8 p-1 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );

  const ColorPaletteSection = ({
    title,
    colors,
    basePath,
  }: {
    title: string;
    colors: any;
    basePath: string;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(colors).map(([key, value]) => (
          <ColorInput
            key={key}
            path={`${basePath}.${key}`}
            value={value as string}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            description={
              key === 'contrast' ? 'Text color for this background' : undefined
            }
          />
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Color Customization
          </h3>
          <p className="text-sm text-gray-600">
            Customize the calculator&apos;s color scheme and visual appearance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onColorsChange(colors)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Default
          </Button>
        </div>
      </div>

      {/* Color Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Colors */}
        <ColorPaletteSection
          title="Brand Colors"
          colors={colors.primary}
          basePath="primary"
        />

        <ColorPaletteSection
          title="Secondary Colors"
          colors={colors.secondary}
          basePath="secondary"
        />

        <ColorPaletteSection
          title="Accent Colors"
          colors={colors.accent}
          basePath="accent"
        />

        <ColorPaletteSection
          title="Success Colors"
          colors={colors.success}
          basePath="success"
        />

        <ColorPaletteSection
          title="Warning Colors"
          colors={colors.warning}
          basePath="warning"
        />

        <ColorPaletteSection
          title="Error Colors"
          colors={colors.error}
          basePath="error"
        />

        <ColorPaletteSection
          title="Info Colors"
          colors={colors.info}
          basePath="info"
        />
      </div>

      {/* UI Colors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Background Colors</CardTitle>
            <CardDescription>
              Colors for different background layers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              path="background.default"
              value={colors.background.default}
              label="Default Background"
              description="Main page background color"
            />
            <ColorInput
              path="background.paper"
              value={colors.background.paper}
              label="Paper Background"
              description="Card and container backgrounds"
            />
            <ColorInput
              path="background.elevated"
              value={colors.background.elevated}
              label="Elevated Background"
              description="Dropdown and modal backgrounds"
            />
            <ColorInput
              path="background.overlay"
              value={colors.background.overlay}
              label="Overlay Background"
              description="Modal and overlay backgrounds"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Surface Colors</CardTitle>
            <CardDescription>Interactive surface colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              path="surface.default"
              value={colors.surface.default}
              label="Default Surface"
              description="Default surface color"
            />
            <ColorInput
              path="surface.hover"
              value={colors.surface.hover}
              label="Hover Surface"
              description="Surface color on hover"
            />
            <ColorInput
              path="surface.active"
              value={colors.surface.active}
              label="Active Surface"
              description="Surface color when active"
            />
            <ColorInput
              path="surface.disabled"
              value={colors.surface.disabled}
              label="Disabled Surface"
              description="Surface color when disabled"
            />
          </CardContent>
        </Card>
      </div>

      {/* Text Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Text Colors</CardTitle>
          <CardDescription>Colors for different text elements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ColorInput
              path="text.primary"
              value={colors.text.primary}
              label="Primary Text"
              description="Main text color"
            />
            <ColorInput
              path="text.secondary"
              value={colors.text.secondary}
              label="Secondary Text"
              description="Secondary text color"
            />
            <ColorInput
              path="text.disabled"
              value={colors.text.disabled}
              label="Disabled Text"
              description="Disabled text color"
            />
            <ColorInput
              path="text.hint"
              value={colors.text.hint}
              label="Hint Text"
              description="Placeholder and hint text"
            />
            <ColorInput
              path="text.inverse"
              value={colors.text.inverse}
              label="Inverse Text"
              description="Text on dark backgrounds"
            />
          </div>
        </CardContent>
      </Card>

      {/* Component Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Component Colors</CardTitle>
          <CardDescription>Colors for specific UI components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ColorInput
              path="divider"
              value={colors.divider}
              label="Divider"
              description="Line separator color"
            />
            <ColorInput
              path="border"
              value={colors.border}
              label="Border"
              description="Default border color"
            />
            <ColorInput
              path="shadow"
              value={colors.shadow}
              label="Shadow"
              description="Shadow color"
            />
            <ColorInput
              path="focus"
              value={colors.focus}
              label="Focus"
              description="Focus ring color"
            />
            <ColorInput
              path="hover"
              value={colors.hover}
              label="Hover"
              description="Hover state color"
            />
            <ColorInput
              path="selected"
              value={colors.selected}
              label="Selected"
              description="Selected state color"
            />
          </div>
        </CardContent>
      </Card>

      {/* Color Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Color Preview</CardTitle>
          <CardDescription>Quick preview of your color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-lg mx-auto mb-2 border border-gray-200"
                style={{ backgroundColor: colors.primary.main }}
              />
              <p className="text-xs font-medium">Primary</p>
              <Badge variant="secondary" className="text-xs mt-1">
                {colors.primary.main}
              </Badge>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 rounded-lg mx-auto mb-2 border border-gray-200"
                style={{ backgroundColor: colors.secondary.main }}
              />
              <p className="text-xs font-medium">Secondary</p>
              <Badge variant="secondary" className="text-xs mt-1">
                {colors.secondary.main}
              </Badge>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 rounded-lg mx-auto mb-2 border border-gray-200"
                style={{ backgroundColor: colors.accent.main }}
              />
              <p className="text-xs font-medium">Accent</p>
              <Badge variant="secondary" className="text-xs mt-1">
                {colors.accent.main}
              </Badge>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 rounded-lg mx-auto mb-2 border border-gray-200"
                style={{ backgroundColor: colors.background.default }}
              />
              <p className="text-xs font-medium">Background</p>
              <Badge variant="secondary" className="text-xs mt-1">
                {colors.background.default}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
