'use client';

import { useState, useEffect } from 'react';
import {
  ThemePreset,
  TypographySettings,
  DEFAULT_THEME_CONFIG,
} from '@/lib/types/theme';
import TypographyCustomizationPanel from './TypographyCustomizationPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Type, Undo2, Redo2, Save, Download, RefreshCw } from 'lucide-react';

interface TypographyCustomizationSystemProps {
  selectedTheme?: ThemePreset;
  onThemeUpdate?: (updatedTheme: ThemePreset) => void;
  className?: string;
}

export default function TypographyCustomizationSystem({
  selectedTheme,
  onThemeUpdate,
  className = '',
}: TypographyCustomizationSystemProps) {
  const [currentTypography, setCurrentTypography] =
    useState<TypographySettings>(
      selectedTheme?.config.typography || DEFAULT_THEME_CONFIG.typography
    );
  const [typographyHistory, setTypographyHistory] = useState<
    TypographySettings[]
  >([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update typography when selected theme changes
  useEffect(() => {
    if (selectedTheme) {
      setCurrentTypography(selectedTheme.config.typography);
      // Reset history when switching themes
      setTypographyHistory([]);
      setHistoryIndex(-1);
      setHasUnsavedChanges(false);
    }
  }, [selectedTheme]);

  const handleTypographyChange = (newTypography: TypographySettings) => {
    setCurrentTypography(newTypography);

    // Add to history
    const newHistory = typographyHistory.slice(0, historyIndex + 1);
    newHistory.push(newTypography);
    setTypographyHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setHasUnsavedChanges(true);

    // Update theme if callback provided
    if (onThemeUpdate && selectedTheme) {
      const updatedTheme: ThemePreset = {
        ...selectedTheme,
        config: {
          ...selectedTheme.config,
          typography: newTypography,
        },
        updatedAt: new Date(),
      };
      onThemeUpdate(updatedTheme);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentTypography(typographyHistory[newIndex]);
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < typographyHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentTypography(typographyHistory[newIndex]);
      setHasUnsavedChanges(true);
    }
  };

  const handleReset = () => {
    if (selectedTheme) {
      setCurrentTypography(selectedTheme.config.typography);
      setTypographyHistory([]);
      setHistoryIndex(-1);
      setHasUnsavedChanges(false);
    }
  };

  const handleSave = () => {
    // This would typically save to the database
    setHasUnsavedChanges(false);
    // You could add a toast notification here
    console.log('Typography saved successfully');
  };

  const handleExport = () => {
    const typographyData = {
      theme: selectedTheme?.name || 'Custom Theme',
      typography: currentTypography,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(typographyData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typography-scheme-${selectedTheme?.name || 'custom'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < typographyHistory.length - 1;

  if (!selectedTheme) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Type className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Theme Selected
          </h3>
          <p className="text-gray-600">
            Please select a theme from the Theme Presets to customize its
            typography.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Type className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Typography Customization
            </h2>
            <p className="text-sm text-gray-600">
              Customize typography for theme: {selectedTheme.name}
            </p>
          </div>
        </div>
      </div>

      {/* Theme Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Theme</CardTitle>
          <CardDescription>
            Theme information and typography status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Type className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {selectedTheme.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={selectedTheme.isActive ? 'default' : 'secondary'}
                  >
                    {selectedTheme.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {selectedTheme.isDefault && (
                    <Badge variant="outline">Default</Badge>
                  )}
                  {selectedTheme.locked && (
                    <Badge variant="outline">Locked</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right text-sm text-gray-500">
              <p>
                Last updated: {selectedTheme.updatedAt.toLocaleDateString()}
              </p>
              <p>Version: {selectedTheme.config.metadata.version}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Typography Summary</CardTitle>
          <CardDescription>
            Overview of current typography settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Primary Font
              </h5>
              <p className="text-xs text-gray-600">
                {currentTypography.fontFamily.primary}
              </p>
              <p className="text-xs text-gray-500">
                {currentTypography.fontSize.base} /{' '}
                {currentTypography.fontWeight.normal}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Secondary Font
              </h5>
              <p className="text-xs text-gray-600">
                {currentTypography.fontFamily.secondary}
              </p>
              <p className="text-xs text-gray-500">
                {currentTypography.fontSize.lg} /{' '}
                {currentTypography.fontWeight.medium}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Monospace Font
              </h5>
              <p className="text-xs text-gray-600">
                {currentTypography.fontFamily.monospace}
              </p>
              <p className="text-xs text-gray-500">
                {currentTypography.fontSize.sm} /{' '}
                {currentTypography.fontWeight.normal}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Heading Size
              </h5>
              <p className="text-xs text-gray-600">
                {currentTypography.fontSize['4xl']}
              </p>
              <p className="text-xs text-gray-500">
                Weight: {currentTypography.fontWeight.bold}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Body Size
              </h5>
              <p className="text-xs text-gray-600">
                {currentTypography.fontSize.base}
              </p>
              <p className="text-xs text-gray-500">
                Line Height: {currentTypography.lineHeight.relaxed}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Letter Spacing
              </h5>
              <p className="text-xs text-gray-600">
                {currentTypography.letterSpacing.normal}
              </p>
              <p className="text-xs text-gray-500">
                Range: {currentTypography.letterSpacing.tight} to{' '}
                {currentTypography.letterSpacing.wide}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-2"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center gap-2"
          >
            <Redo2 className="w-4 h-4" />
            Redo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Original
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Unsaved Changes
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Typography Customization Panel */}
      <TypographyCustomizationPanel
        typography={currentTypography}
        onTypographyChange={handleTypographyChange}
      />

      {/* Typography Best Practices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Typography Best Practices</CardTitle>
          <CardDescription>Guidelines for optimal typography</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Readability</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Body text: 16px minimum for web</li>
                <li>• Line height: 1.4-1.6 for optimal reading</li>
                <li>• Contrast ratio: 4.5:1 minimum</li>
                <li>• Letter spacing: 0-0.5px for body text</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Hierarchy</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use consistent font families</li>
                <li>• Scale font sizes proportionally</li>
                <li>• Limit to 2-3 font weights</li>
                <li>• Maintain visual rhythm</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Accessibility</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Support screen readers</li>
                <li>• Provide sufficient contrast</li>
                <li>• Allow font size scaling</li>
                <li>• Test with different devices</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Performance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Limit font file sizes</li>
                <li>• Use font-display: swap</li>
                <li>• Preload critical fonts</li>
                <li>• Consider system fonts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
