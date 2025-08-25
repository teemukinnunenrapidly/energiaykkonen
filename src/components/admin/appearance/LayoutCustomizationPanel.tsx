'use client';

import { useState } from 'react';
import { LayoutSettings } from '@/lib/types/theme';
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
import { Layout, Ruler, Box, Zap, Palette, Copy, Check } from 'lucide-react';

interface LayoutCustomizationPanelProps {
  layout: LayoutSettings;
  onLayoutChange: (layout: LayoutSettings) => void;
  className?: string;
}

export default function LayoutCustomizationPanel({
  layout,
  onLayoutChange,
  className = '',
}: LayoutCustomizationPanelProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const handleLayoutChange = (
    path: string,
    value: string | number | boolean
  ) => {
    const newLayout = { ...layout };
    const pathParts = path.split('.');
    let current: any = newLayout;

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }

    current[pathParts[pathParts.length - 1]] = value;
    onLayoutChange(newLayout);
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

  const LayoutInput = ({
    path,
    value,
    label,
    description,
    type = 'text',
    options,
    min,
    max,
    step,
    unit = '',
  }: {
    path: string;
    value: string | number | boolean;
    label: string;
    description?: string;
    type?: 'text' | 'select' | 'range' | 'checkbox';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
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
          onValueChange={val => handleLayoutChange(path, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
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
            value={typeof value === 'number' ? value : 0}
            onChange={e => handleLayoutChange(path, parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {min}
              {unit}
            </span>
            <span className="font-medium">
              {typeof value === 'number' ? value : 0}
              {unit}
            </span>
            <span>
              {max}
              {unit}
            </span>
          </div>
        </div>
      ) : type === 'checkbox' ? (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={e => handleLayoutChange(path, e.target.checked)}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <Label className="text-sm text-gray-700">{description}</Label>
        </div>
      ) : (
        <Input
          type="text"
          value={typeof value === 'boolean' ? String(value) : String(value)}
          onChange={e => handleLayoutChange(path, e.target.value)}
          className="font-mono text-sm"
          placeholder={unit ? `Enter value in ${unit}` : 'Enter value'}
        />
      )}

      {description && type !== 'checkbox' && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );

  const LayoutSection = ({
    title,
    settings,
    basePath,
    icon: Icon,
  }: {
    title: string;
    settings: any;
    basePath: string;
    icon: any;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(settings).map(([key, value]) => {
          // Handle container settings
          if (basePath === 'container') {
            if (key === 'maxWidth') {
              return (
                <LayoutInput
                  key={key}
                  path={`${basePath}.${key}`}
                  value={value as string}
                  label="Max Width"
                  description="Maximum container width"
                  type="select"
                  options={[
                    { value: '640px', label: 'Small (640px)' },
                    { value: '768px', label: 'Medium (768px)' },
                    { value: '1024px', label: 'Large (1024px)' },
                    { value: '1200px', label: 'Extra Large (1200px)' },
                    { value: '1400px', label: '2XL (1400px)' },
                    { value: '100%', label: 'Full Width (100%)' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              );
            }
            if (key === 'padding') {
              return (
                <LayoutInput
                  key={key}
                  path={`${basePath}.${key}`}
                  value={value as string}
                  label="Padding"
                  description="Container padding"
                  type="select"
                  options={[
                    { value: '0', label: 'None (0px)' },
                    { value: '10px', label: 'Small (10px)' },
                    { value: '20px', label: 'Medium (20px)' },
                    { value: '32px', label: 'Large (32px)' },
                    { value: '48px', label: 'Extra Large (48px)' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              );
            }
            if (key === 'centered') {
              return (
                <LayoutInput
                  key={key}
                  path={`${basePath}.${key}`}
                  value={value as boolean}
                  label="Centered"
                  description="Center container horizontally"
                  type="checkbox"
                />
              );
            }
          }

          // Handle spacing scale
          if (basePath === 'spacing') {
            return (
              <LayoutInput
                key={key}
                path={`${basePath}.${key}`}
                value={value as string}
                label={key.toUpperCase()}
                description={`Spacing value for ${key} scale`}
                unit="px"
              />
            );
          }

          // Handle border radius
          if (basePath === 'borderRadius') {
            return (
              <LayoutInput
                key={key}
                path={`${basePath}.${key}`}
                value={value as string}
                label={key === 'full' ? 'Full' : key.toUpperCase()}
                description={`Border radius for ${key} scale`}
                unit="px"
              />
            );
          }

          // Handle shadows
          if (basePath === 'shadows') {
            return (
              <LayoutInput
                key={key}
                path={`${basePath}.${key}`}
                value={value as string}
                label={key === 'inner' ? 'Inner Shadow' : key.toUpperCase()}
                description={`Shadow style for ${key}`}
                type="select"
                options={[
                  { value: 'none', label: 'None' },
                  { value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', label: 'Small' },
                  {
                    value: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    label: 'Medium',
                  },
                  {
                    value: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    label: 'Large',
                  },
                  {
                    value: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    label: 'Extra Large',
                  },
                  {
                    value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    label: '2XL',
                  },
                  {
                    value: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                    label: 'Inner',
                  },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            );
          }

          // Handle transitions
          if (basePath === 'transitions') {
            if (key === 'duration') {
              return (
                <div key={key} className="border-l-2 border-gray-200 pl-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Duration
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(value as any).map(([subKey, subValue]) => (
                      <LayoutInput
                        key={subKey}
                        path={`${basePath}.${key}.${subKey}`}
                        value={subValue as string}
                        label={subKey.charAt(0).toUpperCase() + subKey.slice(1)}
                        description={`Transition duration for ${subKey}`}
                        unit="ms"
                      />
                    ))}
                  </div>
                </div>
              );
            }
            if (key === 'easing') {
              return (
                <div key={key} className="border-l-2 border-gray-200 pl-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Easing
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(value as any).map(([subKey, subValue]) => (
                      <LayoutInput
                        key={subKey}
                        path={`${basePath}.${key}.${subKey}`}
                        value={subValue as string}
                        label={subKey.charAt(0).toUpperCase() + subKey.slice(1)}
                        description={`Easing function for ${subKey}`}
                        type="select"
                        options={[
                          { value: 'linear', label: 'Linear' },
                          { value: 'ease-in', label: 'Ease In' },
                          { value: 'ease-out', label: 'Ease Out' },
                          { value: 'ease-in-out', label: 'Ease In Out' },
                          {
                            value: 'cubic-bezier(0.4, 0, 0.2, 1)',
                            label: 'Smooth',
                          },
                          {
                            value: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            label: 'Natural',
                          },
                        ]}
                      />
                    ))}
                  </div>
                </div>
              );
            }
          }

          // Default text input for other properties
          return (
            <LayoutInput
              key={key}
              path={`${basePath}.${key}`}
              value={value as string | number}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              description={`Customize ${key}`}
            />
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Layout & Spacing Customization
          </h3>
          <p className="text-sm text-gray-600">
            Customize container settings, spacing scale, borders, shadows, and
            transitions
          </p>
        </div>
      </div>

      {/* Layout Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Container Settings */}
        <LayoutSection
          title="Container Settings"
          settings={layout.container}
          basePath="container"
          icon={Box}
        />

        {/* Spacing Scale */}
        <LayoutSection
          title="Spacing Scale"
          settings={layout.spacing}
          basePath="spacing"
          icon={Ruler}
        />

        {/* Border Radius */}
        <LayoutSection
          title="Border Radius"
          settings={layout.borderRadius}
          basePath="borderRadius"
          icon={Palette}
        />

        {/* Shadows */}
        <LayoutSection
          title="Shadows"
          settings={layout.shadows}
          basePath="shadows"
          icon={Zap}
        />
      </div>

      {/* Transitions */}
      <LayoutSection
        title="Transitions & Animations"
        settings={layout.transitions}
        basePath="transitions"
        icon={Zap}
      />

      {/* Layout Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Layout Preview</CardTitle>
          <CardDescription>See how your layout settings look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Container Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Container Preview
              </Label>
              <div
                className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4"
                style={{
                  maxWidth:
                    layout.container.maxWidth === 'custom'
                      ? '800px'
                      : layout.container.maxWidth,
                  padding:
                    layout.container.padding === 'custom'
                      ? '24px'
                      : layout.container.padding,
                  margin: layout.container.centered ? '0 auto' : '0',
                }}
              >
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h4 className="text-lg font-semibold mb-3">Sample Content</h4>
                  <p className="text-gray-600 mb-4">
                    This preview shows how your container settings will look.
                    The container has:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Max width: {layout.container.maxWidth}</li>
                    <li>• Padding: {layout.container.padding}</li>
                    <li>
                      • Centered: {layout.container.centered ? 'Yes' : 'No'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Spacing Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Spacing Scale Preview
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(layout.spacing)
                  .slice(0, 8)
                  .map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div
                        className="bg-orange-500 mx-auto mb-2"
                        style={{
                          width: value as string,
                          height: value as string,
                          borderRadius: layout.borderRadius.sm,
                        }}
                      />
                      <p className="text-xs font-medium text-gray-900">
                        {key.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">{value}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Border Radius Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Border Radius Preview
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(layout.borderRadius)
                  .slice(0, 8)
                  .map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div
                        className="bg-blue-500 mx-auto mb-2 w-16 h-16"
                        style={{ borderRadius: value as string }}
                      />
                      <p className="text-xs font-medium text-gray-900">
                        {key === 'full' ? 'Full' : key.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">{value}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Shadow Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Shadow Preview
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(layout.shadows)
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div
                        className="bg-white border border-gray-200 rounded-lg p-4 mx-auto mb-2"
                        style={{
                          boxShadow: value as string,
                          width: '120px',
                          height: '80px',
                        }}
                      />
                      <p className="text-xs font-medium text-gray-900">
                        {key === 'inner' ? 'Inner' : key.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{value}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Transition Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Transition Preview
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                    Duration
                  </h5>
                  <div className="space-y-2">
                    {Object.entries(layout.transitions.duration).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600 capitalize">
                            {key}
                          </span>
                          <Badge variant="outline">{value}</Badge>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                    Easing
                  </h5>
                  <div className="space-y-2">
                    {Object.entries(layout.transitions.easing).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600 capitalize">
                            {key}
                          </span>
                          <Badge variant="outline">{value}</Badge>
                        </div>
                      )
                    )}
                  </div>
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
          <CardDescription>Common layout adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Reset to default layout
                const defaultLayout = {
                  container: {
                    maxWidth: '1200px',
                    padding: '20px',
                    centered: true,
                  },
                  spacing: {
                    xs: '4px',
                    sm: '8px',
                    md: '16px',
                    lg: '24px',
                    xl: '32px',
                    '2xl': '48px',
                    '3xl': '64px',
                  },
                  borderRadius: {
                    none: '0',
                    sm: '2px',
                    md: '4px',
                    lg: '8px',
                    xl: '12px',
                    '2xl': '16px',
                    '3xl': '24px',
                    full: '9999px',
                  },
                  shadows: {
                    none: 'none',
                    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                  },
                  transitions: {
                    duration: {
                      fast: '150ms',
                      normal: '300ms',
                      slow: '500ms',
                    },
                    easing: {
                      linear: 'linear',
                      easeIn: 'ease-in',
                      easeOut: 'ease-out',
                      easeInOut: 'ease-in-out',
                    },
                  },
                };
                onLayoutChange(defaultLayout);
              }}
              className="flex items-center gap-2"
            >
              <Layout className="w-4 h-4" />
              Reset to Default
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Compact layout
                const newLayout = { ...layout };
                newLayout.container.padding = '16px';
                newLayout.spacing.xs = '2px';
                newLayout.spacing.sm = '4px';
                newLayout.spacing.md = '12px';
                newLayout.spacing.lg = '16px';
                onLayoutChange(newLayout);
              }}
              className="flex items-center gap-2"
            >
              <Box className="w-4 h-4" />
              Compact Layout
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Spacious layout
                const newLayout = { ...layout };
                newLayout.container.padding = '32px';
                newLayout.spacing.xs = '8px';
                newLayout.spacing.sm = '16px';
                newLayout.spacing.md = '24px';
                newLayout.spacing.lg = '32px';
                onLayoutChange(newLayout);
              }}
              className="flex items-center gap-2"
            >
              <Ruler className="w-4 h-4" />
              Spacious Layout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
