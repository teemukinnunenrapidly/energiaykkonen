'use client';

import { useState, useEffect } from 'react';
import {
  ThemePreset,
  ColorSettings,
  DEFAULT_THEME_CONFIG,
} from '@/lib/types/theme';
import ColorCustomizationPanel from './ColorCustomizationPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Eye, Undo2, Redo2, Save, Download } from 'lucide-react';

interface ColorCustomizationSystemProps {
  selectedTheme?: ThemePreset;
  onThemeUpdate?: (updatedTheme: ThemePreset) => void;
  className?: string;
}

export default function ColorCustomizationSystem({
  selectedTheme,
  onThemeUpdate,
  className = '',
}: ColorCustomizationSystemProps) {
  const [currentColors, setCurrentColors] = useState<ColorSettings>(
    selectedTheme?.config.colors || DEFAULT_THEME_CONFIG.colors
  );
  const [colorHistory, setColorHistory] = useState<ColorSettings[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update colors when selected theme changes
  useEffect(() => {
    if (selectedTheme) {
      setCurrentColors(selectedTheme.config.colors);
      // Reset history when switching themes
      setColorHistory([]);
      setHistoryIndex(-1);
      setHasUnsavedChanges(false);
    }
  }, [selectedTheme]);

  const handleColorsChange = (newColors: ColorSettings) => {
    setCurrentColors(newColors);

    // Add to history
    const newHistory = colorHistory.slice(0, historyIndex + 1);
    newHistory.push(newColors);
    setColorHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setHasUnsavedChanges(true);

    // Update theme if callback provided
    if (onThemeUpdate && selectedTheme) {
      const updatedTheme: ThemePreset = {
        ...selectedTheme,
        config: {
          ...selectedTheme.config,
          colors: newColors,
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
      setCurrentColors(colorHistory[newIndex]);
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < colorHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentColors(colorHistory[newIndex]);
      setHasUnsavedChanges(true);
    }
  };

  const handleReset = () => {
    if (selectedTheme) {
      setCurrentColors(selectedTheme.config.colors);
      setColorHistory([]);
      setHistoryIndex(-1);
      setHasUnsavedChanges(false);
    }
  };

  const handleSave = () => {
    // This would typically save to the database
    setHasUnsavedChanges(false);
    // You could add a toast notification here
    console.log('Colors saved successfully');
  };

  const handleExport = () => {
    const colorData = {
      theme: selectedTheme?.name || 'Custom Theme',
      colors: currentColors,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(colorData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-scheme-${selectedTheme?.name || 'custom'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < colorHistory.length - 1;

  if (!selectedTheme) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Theme Selected
          </h3>
          <p className="text-gray-600">
            Please select a theme from the Theme Presets to customize its
            colors.
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
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Color Customization
            </h2>
            <p className="text-sm text-gray-600">
              Customize colors for theme: {selectedTheme.name}
            </p>
          </div>
        </div>
      </div>

      {/* Theme Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Theme</CardTitle>
          <CardDescription>Theme information and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border border-gray-200"
                style={{ backgroundColor: currentColors.primary.main }}
              />
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
            <Eye className="w-4 h-4" />
            Reset to Original
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-200"
            >
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

      {/* Color Customization Panel */}
      <ColorCustomizationPanel
        colors={currentColors}
        onColorsChange={handleColorsChange}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common color adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Generate complementary colors
                const newColors = { ...currentColors };
                // This would implement color theory logic
                handleColorsChange(newColors);
              }}
              className="flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Generate Complementary
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Generate monochromatic scheme
                const newColors = { ...currentColors };
                // This would implement color theory logic
                handleColorsChange(newColors);
              }}
              className="flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Generate Monochromatic
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Generate analogous scheme
                const newColors = { ...currentColors };
                // This would implement color theory logic
                handleColorsChange(newColors);
              }}
              className="flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Generate Analogous
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
