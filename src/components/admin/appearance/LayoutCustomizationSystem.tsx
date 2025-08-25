'use client';

import { useState, useEffect } from 'react';
import {
  ThemePreset,
  LayoutSettings,
  DEFAULT_THEME_CONFIG,
} from '@/lib/types/theme';
import LayoutCustomizationPanel from './LayoutCustomizationPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout, Undo2, Redo2, Save, Download, RefreshCw } from 'lucide-react';

interface LayoutCustomizationSystemProps {
  selectedTheme?: ThemePreset;
  onThemeUpdate?: (updatedTheme: ThemePreset) => void;
  className?: string;
}

export default function LayoutCustomizationSystem({
  selectedTheme,
  onThemeUpdate,
  className = '',
}: LayoutCustomizationSystemProps) {
  const [currentLayout, setCurrentLayout] = useState<LayoutSettings>(
    selectedTheme?.config.layout || DEFAULT_THEME_CONFIG.layout
  );
  const [layoutHistory, setLayoutHistory] = useState<LayoutSettings[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update layout when selected theme changes
  useEffect(() => {
    if (selectedTheme) {
      setCurrentLayout(selectedTheme.config.layout);
      // Reset history when switching themes
      setLayoutHistory([]);
      setHistoryIndex(-1);
      setHasUnsavedChanges(false);
    }
  }, [selectedTheme]);

  const handleLayoutChange = (newLayout: LayoutSettings) => {
    setCurrentLayout(newLayout);

    // Add to history
    const newHistory = layoutHistory.slice(0, historyIndex + 1);
    newHistory.push(newLayout);
    setLayoutHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setHasUnsavedChanges(true);

    // Update theme if callback provided
    if (onThemeUpdate && selectedTheme) {
      const updatedTheme: ThemePreset = {
        ...selectedTheme,
        config: {
          ...selectedTheme.config,
          layout: newLayout,
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
      setCurrentLayout(layoutHistory[newIndex]);
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < layoutHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentLayout(layoutHistory[newIndex]);
      setHasUnsavedChanges(true);
    }
  };

  const handleReset = () => {
    if (selectedTheme) {
      setCurrentLayout(selectedTheme.config.layout);
      setLayoutHistory([]);
      setHistoryIndex(-1);
      setHasUnsavedChanges(false);
    }
  };

  const handleSave = () => {
    // This would typically save to the database
    setHasUnsavedChanges(false);
    // You could add a toast notification here
    console.log('Layout saved successfully');
  };

  const handleExport = () => {
    const layoutData = {
      theme: selectedTheme?.name || 'Custom Theme',
      layout: currentLayout,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(layoutData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout-scheme-${selectedTheme?.name || 'custom'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < layoutHistory.length - 1;

  if (!selectedTheme) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Theme Selected
          </h3>
          <p className="text-gray-600">
            Please select a theme from the Theme Presets to customize its
            layout.
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
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Layout className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Layout & Spacing Customization
            </h2>
            <p className="text-sm text-gray-600">
              Customize layout for theme: {selectedTheme.name}
            </p>
          </div>
        </div>
      </div>

      {/* Theme Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Theme</CardTitle>
          <CardDescription>Theme information and layout status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Layout className="w-6 h-6 text-green-600" />
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

      {/* Layout Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Layout Summary</CardTitle>
          <CardDescription>Overview of current layout settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Container
              </h5>
              <p className="text-xs text-gray-600">
                {currentLayout.container.maxWidth}
              </p>
              <p className="text-xs text-gray-500">
                Padding: {currentLayout.container.padding}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Spacing
              </h5>
              <p className="text-xs text-gray-600">
                Base: {currentLayout.spacing.md}
              </p>
              <p className="text-xs text-gray-500">
                Large: {currentLayout.spacing.lg}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Border Radius
              </h5>
              <p className="text-xs text-gray-600">
                Medium: {currentLayout.borderRadius.md}
              </p>
              <p className="text-xs text-gray-500">
                Large: {currentLayout.borderRadius.lg}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Shadows
              </h5>
              <p className="text-xs text-gray-600">
                Medium: {currentLayout.shadows.md ? 'Enabled' : 'None'}
              </p>
              <p className="text-xs text-gray-500">
                Large: {currentLayout.shadows.lg ? 'Enabled' : 'None'}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                Transitions
              </h5>
              <p className="text-xs text-gray-600">
                Fast: {currentLayout.transitions.duration.fast}
              </p>
              <p className="text-xs text-gray-500">
                Normal: {currentLayout.transitions.duration.normal}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Easing</h5>
              <p className="text-xs text-gray-600">
                Primary: {currentLayout.transitions.easing.easeInOut}
              </p>
              <p className="text-xs text-gray-500">
                Secondary: {currentLayout.transitions.easing.easeOut}
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
            <Badge
              variant="outline"
              className="text-green-600 border-green-200"
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

      {/* Layout Customization Panel */}
      <LayoutCustomizationPanel
        layout={currentLayout}
        onLayoutChange={handleLayoutChange}
      />

      {/* Layout Best Practices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Layout Best Practices</CardTitle>
          <CardDescription>
            Guidelines for optimal layout and spacing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Spacing & Rhythm</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • Use consistent spacing scale (4px, 8px, 16px, 24px, 32px)
                </li>
                <li>• Maintain visual hierarchy with proportional spacing</li>
                <li>• Group related elements with consistent margins</li>
                <li>• Use breathing room between sections</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Container Design</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Choose appropriate max-width for content readability</li>
                <li>• Use consistent padding for content areas</li>
                <li>• Center containers for optimal viewing</li>
                <li>• Consider mobile-first responsive design</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Visual Elements</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use border radius consistently across components</li>
                <li>• Apply shadows sparingly for depth</li>
                <li>• Maintain consistent shadow hierarchy</li>
                <li>• Consider accessibility with shadow contrast</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Transitions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keep transitions under 300ms for responsiveness</li>
                <li>• Use easing functions for natural movement</li>
                <li>• Apply transitions consistently across interactions</li>
                <li>• Consider reduced motion preferences</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
