'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Image as ImageIcon,
  Search,
  X,
  Check,
  FolderOpen,
  Grid3X3,
  List,
} from 'lucide-react';

// Mock data for visual assets - this will be replaced with real data from Supabase
const MOCK_ASSETS = [
  {
    id: '1',
    name: 'house-icon.svg',
    displayName: 'House Icon',
    type: 'svg',
    category: 'icons',
    url: '/house.svg',
    thumbnail: '/house.svg',
    tags: ['house', 'property', 'real-estate'],
  },
  {
    id: '2',
    name: 'heating-system.svg',
    displayName: 'Heating System',
    type: 'svg',
    category: 'icons',
    url: '/heating.svg',
    thumbnail: '/heating.svg',
    tags: ['heating', 'energy', 'system'],
  },
  {
    id: '3',
    name: 'savings-chart.svg',
    displayName: 'Savings Chart',
    type: 'svg',
    category: 'charts',
    url: '/savings.svg',
    thumbnail: '/savings.svg',
    tags: ['savings', 'money', 'chart'],
  },
  {
    id: '4',
    name: 'contact-form.svg',
    displayName: 'Contact Form',
    type: 'svg',
    category: 'forms',
    url: '/contact.svg',
    thumbnail: '/contact.svg',
    tags: ['contact', 'form', 'communication'],
  },
  {
    id: '5',
    name: 'results-graph.svg',
    displayName: 'Results Graph',
    type: 'svg',
    category: 'charts',
    url: '/results.svg',
    thumbnail: '/results.svg',
    tags: ['results', 'graph', 'data'],
  },
];

const ASSET_CATEGORIES = [
  { id: 'all', name: 'All Assets' },
  { id: 'icons', name: 'Icons' },
  { id: 'charts', name: 'Charts' },
  { id: 'forms', name: 'Forms' },
  { id: 'illustrations', name: 'Illustrations' },
  { id: 'photos', name: 'Photos' },
];

interface ImagePickerProps {
  value?: string;
  onChange: (imageUrl: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ImagePicker({
  value,
  onChange,
  placeholder = 'Select an image...',
  className = '',
  disabled = false,
}: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter assets based on category and search
  const filteredAssets = MOCK_ASSETS.filter(asset => {
    const matchesCategory =
      selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch =
      asset.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  // Handle image selection
  const handleImageSelect = useCallback(
    (asset: (typeof MOCK_ASSETS)[0]) => {
      onChange(asset.url);
      setIsOpen(false);
    },
    [onChange]
  );

  // Handle image removal
  const handleImageRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  // Get selected asset info
  const selectedAsset = value
    ? MOCK_ASSETS.find(asset => asset.url === value)
    : null;

  return (
    <div className={className}>
      {/* Current Image Display */}
      {selectedAsset ? (
        <div className="space-y-3">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
              <img
                src={selectedAsset.thumbnail}
                alt={selectedAsset.displayName}
                className="w-16 h-16 object-contain"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageRemove}
              disabled={disabled}
              className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-100 hover:bg-red-200 text-red-600 rounded-full"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {selectedAsset.displayName}
            </p>
            <p className="text-gray-500">{selectedAsset.type.toUpperCase()}</p>
          </div>
        </div>
      ) : (
        <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Image Picker Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="mt-3 w-full"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {selectedAsset ? 'Change Image' : placeholder}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Visual Asset</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search assets by name or tags..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ASSET_CATEGORIES.map(category => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-sm"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Assets Display */}
            <div className="flex-1 overflow-y-auto">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {filteredAssets.map(asset => (
                    <Card
                      key={asset.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        value === asset.url
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : ''
                      }`}
                      onClick={() => handleImageSelect(asset)}
                    >
                      <CardContent className="p-3">
                        <div className="relative">
                          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                            <img
                              src={asset.thumbnail}
                              alt={asset.displayName}
                              className="w-12 h-12 object-contain"
                            />
                          </div>

                          {/* Selected Indicator */}
                          {value === asset.url && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="text-center">
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={asset.displayName}
                          >
                            {asset.displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {asset.type.toUpperCase()}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1 justify-center">
                            {asset.tags.slice(0, 2).map(tag => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {asset.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{asset.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAssets.map(asset => (
                    <Card
                      key={asset.id}
                      className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        value === asset.url
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : ''
                      }`}
                      onClick={() => handleImageSelect(asset)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <img
                              src={asset.thumbnail}
                              alt={asset.displayName}
                              className="w-8 h-8 object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {asset.displayName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {asset.type.toUpperCase()}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {asset.tags.slice(0, 3).map(tag => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {asset.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{asset.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {value === asset.url && (
                            <div className="flex-shrink-0">
                              <Badge variant="default" className="bg-blue-600">
                                <Check className="w-3 h-3 mr-1" />
                                Selected
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No assets found</p>
                <p className="text-sm">
                  Try adjusting your search or category filter
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
