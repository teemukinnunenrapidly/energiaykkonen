import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

// Popular Material Icons for form fields
const POPULAR_ICONS = [
  // Person/User related
  'person',
  'person_add',
  'group',
  'face',
  'account_circle',
  // Contact related
  'email',
  'phone',
  'location_on',
  'home',
  'business',
  // Form related
  'input',
  'text_fields',
  'short_text',
  'subject',
  'description',
  // Data related
  'calculate',
  'functions',
  'trending_up',
  'analytics',
  'assessment',
  // Building/Property related
  'apartment',
  'house',
  'building',
  'home_work',
  'domain',
  // Energy related
  'bolt',
  'power',
  'energy_savings_leaf',
  'eco',
  'solar_power',
  // General
  'info',
  'help',
  'settings',
  'edit',
  'save',
];

interface IconPickerProps {
  selectedIcon?: string;
  onIconSelect: (iconName: string | undefined) => void;
  onClose: () => void;
}

export function IconPicker({
  selectedIcon,
  onIconSelect,
  onClose,
}: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = {
    all: 'All Icons',
    person: 'Person & User',
    contact: 'Contact & Location',
    form: 'Form Fields',
    data: 'Data & Analytics',
    building: 'Building & Property',
    energy: 'Energy & Power',
    general: 'General',
  };

  const getIconCategory = (iconName: string): string => {
    if (
      ['person', 'person_add', 'group', 'face', 'account_circle'].includes(
        iconName
      )
    ) {
      return 'person';
    }
    if (
      ['email', 'phone', 'location_on', 'home', 'business'].includes(iconName)
    ) {
      return 'contact';
    }
    if (
      ['input', 'text_fields', 'short_text', 'subject', 'description'].includes(
        iconName
      )
    ) {
      return 'form';
    }
    if (
      [
        'calculate',
        'functions',
        'trending_up',
        'analytics',
        'assessment',
      ].includes(iconName)
    ) {
      return 'data';
    }
    if (
      ['apartment', 'house', 'building', 'home_work', 'domain'].includes(
        iconName
      )
    ) {
      return 'building';
    }
    if (
      ['bolt', 'power', 'energy_savings_leaf', 'eco', 'solar_power'].includes(
        iconName
      )
    ) {
      return 'energy';
    }
    return 'general';
  };

  const filteredIcons = POPULAR_ICONS.filter(icon => {
    const matchesSearch = icon.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || getIconCategory(icon) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleIconSelect = (iconName: string) => {
    onIconSelect(iconName);
    onClose();
  };

  const handleRemoveIcon = () => {
    onIconSelect(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Select Icon</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Categories */}
        <div className="p-4 border-b">
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search icons..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="p-4 overflow-y-auto max-h-96">
          {selectedIcon && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-blue-600 text-xl">
                    {selectedIcon}
                  </span>
                  <span className="text-sm text-blue-700">
                    Currently selected: {selectedIcon}
                  </span>
                </div>
                <button
                  onClick={handleRemoveIcon}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.map(iconName => (
              <button
                key={iconName}
                onClick={() => handleIconSelect(iconName)}
                className={`p-3 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors ${
                  selectedIcon === iconName
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                title={iconName}
              >
                <span className="material-icons text-2xl text-gray-700">
                  {iconName}
                </span>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {iconName}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
