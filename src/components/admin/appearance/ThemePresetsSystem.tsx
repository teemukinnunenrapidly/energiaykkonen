'use client';

import { useState, useEffect } from 'react';
import { ThemePreset, DEFAULT_THEME_PRESETS } from '@/lib/types/theme';
import ThemePresetsGrid from './ThemePresetsGrid';
import { CheckCircle, Info, Palette, Eye } from 'lucide-react';

interface ThemePresetsSystemProps {
  onThemeChange?: (theme: ThemePreset) => void;
  onThemeEdit?: (theme: ThemePreset) => void;
}

export default function ThemePresetsSystem({
  onThemeChange,
  onThemeEdit,
}: ThemePresetsSystemProps) {
  const [presets, setPresets] = useState<ThemePreset[]>(DEFAULT_THEME_PRESETS);
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset | undefined>(
    presets.find(p => p.isActive)
  );
  const [showPreview, setShowPreview] = useState(false);

  // Initialize with active theme
  useEffect(() => {
    const activePreset = presets.find(p => p.isActive);
    if (activePreset) {
      setSelectedPreset(activePreset);
    }
  }, [presets]);

  const handlePresetSelect = (preset: ThemePreset) => {
    setSelectedPreset(preset);

    // Update active status
    setPresets(prev =>
      prev.map(p => ({
        ...p,
        isActive: p.id === preset.id,
      }))
    );

    onThemeChange?.(preset);
  };

  const handlePresetEdit = (preset: ThemePreset) => {
    onThemeEdit?.(preset);
  };

  const handlePresetDuplicate = (preset: ThemePreset) => {
    const newPreset: ThemePreset = {
      ...preset,
      id: `${preset.id}-copy-${Date.now()}`,
      name: `${preset.name} (Copy)`,
      locked: false,
      isDefault: false,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
    };

    setPresets(prev => [...prev, newPreset]);
  };

  const handlePresetDelete = (preset: ThemePreset) => {
    if (preset.locked || preset.isDefault) {
      return;
    }

    setPresets(prev => prev.filter(p => p.id !== preset.id));

    if (selectedPreset?.id === preset.id) {
      const defaultPreset = presets.find(p => p.isDefault);
      setSelectedPreset(defaultPreset);
      onThemeChange?.(defaultPreset!);
    }
  };

  const handlePresetPreview = (preset: ThemePreset) => {
    setSelectedPreset(preset);
    setShowPreview(true);
  };

  const handleCreateNew = () => {
    // This will be implemented in the next subtask
    console.log('Create new theme');
  };

  const handleActivateTheme = () => {
    if (!selectedPreset) {
      return;
    }

    setPresets(prev =>
      prev.map(p => ({
        ...p,
        isActive: p.id === selectedPreset.id,
      }))
    );

    onThemeChange?.(selectedPreset);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Theme Presets
            </h2>
            <p className="text-sm text-gray-600">
              Manage and customize calculator appearance themes
            </p>
          </div>
        </div>
      </div>

      {/* Selected theme info */}
      {selectedPreset && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedPreset.name}
                </h3>
                {selectedPreset.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Default
                  </span>
                )}
                {selectedPreset.isActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
                {selectedPreset.locked && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Locked
                  </span>
                )}
              </div>

              {selectedPreset.description && (
                <p className="text-gray-600 mb-4">
                  {selectedPreset.description}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Version:</span>
                  <span className="ml-2 font-medium">
                    {selectedPreset.config.metadata.version}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Author:</span>
                  <span className="ml-2 font-medium">
                    {selectedPreset.config.metadata.author || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">
                    {selectedPreset.createdAt.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Tags:</span>
                  <span className="ml-2 font-medium">
                    {selectedPreset.config.metadata.tags.slice(0, 2).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePresetPreview(selectedPreset)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>

              {!selectedPreset.isActive && !selectedPreset.locked && (
                <button
                  onClick={handleActivateTheme}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate Theme
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Theme Management</p>
            <p>
              Select a theme to customize or activate it. Default themes are
              locked and cannot be modified, but you can duplicate them to
              create custom variations. Changes are applied in real-time to the
              preview.
            </p>
          </div>
        </div>
      </div>

      {/* Themes grid */}
      <ThemePresetsGrid
        presets={presets}
        selectedPreset={selectedPreset}
        onPresetSelect={handlePresetSelect}
        onPresetEdit={handlePresetEdit}
        onPresetDuplicate={handlePresetDuplicate}
        onPresetDelete={handlePresetDelete}
        onPresetPreview={handlePresetPreview}
        onCreateNew={handleCreateNew}
      />

      {/* Preview modal placeholder */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Theme Preview: {selectedPreset?.name}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                Theme preview will be implemented in the next subtask
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will show a live preview of how the theme looks on the
                calculator
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
