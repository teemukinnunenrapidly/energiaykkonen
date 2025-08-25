'use client';

import { useState } from 'react';
import { ThemePreset } from '@/lib/types/theme';
import {
  Lock,
  Star,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  Eye,
  Palette
} from 'lucide-react';

interface ThemePresetCardProps {
  preset: ThemePreset;
  isSelected: boolean;
  onSelect: (preset: ThemePreset) => void;
  onEdit?: (preset: ThemePreset) => void;
  onDuplicate?: (preset: ThemePreset) => void;
  onDelete?: (preset: ThemePreset) => void;
  onPreview?: (preset: ThemePreset) => void;
}

export default function ThemePresetCard({
  preset,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview
}: ThemePresetCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-orange-500 ring-offset-2' 
          : 'hover:shadow-lg hover:-translate-y-1'
      }`}
      onClick={() => onSelect(preset)}
    >
      {/* Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Thumbnail */}
        <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100">
          {preset.thumbnail ? (
            <img 
              src={preset.thumbnail} 
              alt={preset.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Theme Preview</p>
              </div>
            </div>
          )}
          
          {/* Status indicators */}
          <div className="absolute top-2 left-2 flex items-center space-x-1">
            {preset.isDefault && (
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Default
              </div>
            )}
            {preset.isActive && (
              <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </div>
            )}
          </div>

          {/* Lock indicator */}
          {preset.locked && (
            <div className="absolute top-2 right-2 bg-gray-100 text-gray-600 p-1 rounded-full">
              <Lock className="w-4 h-4" />
            </div>
          )}

          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute inset-0 bg-orange-500 bg-opacity-10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {preset.name}
              </h3>
              {preset.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {preset.description}
                </p>
              )}
            </div>

            {/* Menu button */}
            <button
              onClick={handleMenuToggle}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Metadata */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>v{preset.config.metadata.version}</span>
            <span>{preset.config.metadata.tags.slice(0, 2).join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            {onPreview && (
              <button
                onClick={() => handleAction(() => onPreview(preset))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
            )}
            
            {onEdit && !preset.locked && (
              <button
                onClick={() => handleAction(() => onEdit(preset))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            
            {onDuplicate && (
              <button
                onClick={() => handleAction(() => onDuplicate(preset))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </button>
            )}
            
            {onDelete && !preset.locked && !preset.isDefault && (
              <button
                onClick={() => handleAction(() => onDelete(preset))}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
