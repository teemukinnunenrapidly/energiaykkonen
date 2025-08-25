'use client';

import { useState } from 'react';
import { ThemePreset, DEFAULT_THEME_PRESETS } from '@/lib/types/theme';
import ThemePresetsSystem from './ThemePresetsSystem';
import ColorCustomizationSystem from './ColorCustomizationSystem';
import TypographyCustomizationSystem from './TypographyCustomizationSystem';
import LayoutCustomizationSystem from './LayoutCustomizationSystem';
import { Palette, Type, Layout } from 'lucide-react';

export default function AppearanceContent() {
  const [activeTab, setActiveTab] = useState<
    'themes' | 'colors' | 'typography' | 'layout'
  >('themes');
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset | undefined>(
    DEFAULT_THEME_PRESETS.find(p => p.isActive)
  );

  const handleThemeUpdate = (updatedTheme: ThemePreset) => {
    setSelectedTheme(updatedTheme);
    // Here you would typically update the theme in the database
    console.log('Theme updated:', updatedTheme);
  };

  const tabs = [
    { id: 'themes', name: 'Theme Presets', icon: Palette },
    { id: 'colors', name: 'Colors', icon: Palette },
    { id: 'typography', name: 'Typography', icon: Type },
    { id: 'layout', name: 'Layout & Spacing', icon: Layout },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as 'themes' | 'colors' | 'typography' | 'layout'
                  )
                }
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'themes' && (
          <ThemePresetsSystem
            onThemeChange={setSelectedTheme}
            onThemeEdit={handleThemeUpdate}
          />
        )}

        {activeTab === 'colors' && (
          <ColorCustomizationSystem
            selectedTheme={selectedTheme}
            onThemeUpdate={handleThemeUpdate}
          />
        )}

        {activeTab === 'typography' && (
          <TypographyCustomizationSystem
            selectedTheme={selectedTheme}
            onThemeUpdate={handleThemeUpdate}
          />
        )}

        {activeTab === 'layout' && (
          <LayoutCustomizationSystem
            selectedTheme={selectedTheme}
            onThemeUpdate={handleThemeUpdate}
          />
        )}
      </div>
    </div>
  );
}
