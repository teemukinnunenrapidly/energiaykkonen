'use client';

import { useState } from 'react';
import { ThemePreset, DEFAULT_THEME_PRESETS } from '@/lib/types/theme';
import ThemePresetCard from './ThemePresetCard';
import { Plus, Search, Filter } from 'lucide-react';

interface ThemePresetsGridProps {
  presets?: ThemePreset[];
  selectedPreset?: ThemePreset;
  onPresetSelect: (preset: ThemePreset) => void;
  onPresetEdit?: (preset: ThemePreset) => void;
  onPresetDuplicate?: (preset: ThemePreset) => void;
  onPresetDelete?: (preset: ThemePreset) => void;
  onPresetPreview?: (preset: ThemePreset) => void;
  onCreateNew?: () => void;
}

export default function ThemePresetsGrid({
  presets = DEFAULT_THEME_PRESETS,
  selectedPreset,
  onPresetSelect,
  onPresetEdit,
  onPresetDuplicate,
  onPresetDelete,
  onPresetPreview,
  onCreateNew,
}: ThemePresetsGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter presets based on search and category
  const filteredPresets = presets.filter(preset => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.config.metadata.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      filterCategory === 'all' ||
      (filterCategory === 'default' && preset.isDefault) ||
      (filterCategory === 'custom' && !preset.locked) ||
      (filterCategory === 'locked' && preset.locked);

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All Themes', count: presets.length },
    {
      id: 'default',
      name: 'Default',
      count: presets.filter(p => p.isDefault).length,
    },
    {
      id: 'custom',
      name: 'Custom',
      count: presets.filter(p => !p.locked).length,
    },
    {
      id: 'locked',
      name: 'Locked',
      count: presets.filter(p => p.locked).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search themes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Create new theme button */}
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Theme
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        {filteredPresets.length} of {presets.length} themes
        {searchTerm && ` matching "${searchTerm}"`}
        {filterCategory !== 'all' &&
          ` in ${categories.find(c => c.id === filterCategory)?.name}`}
      </div>

      {/* Themes grid */}
      {filteredPresets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPresets.map(preset => (
            <ThemePresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPreset?.id === preset.id}
              onSelect={onPresetSelect}
              onEdit={onPresetEdit}
              onDuplicate={onPresetDuplicate}
              onDelete={onPresetDelete}
              onPreview={onPresetPreview}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No themes found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? `No themes match "${searchTerm}"`
              : 'No themes available in this category'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
