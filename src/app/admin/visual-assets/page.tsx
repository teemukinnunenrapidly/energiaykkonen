'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Search,
  Grid3X3,
  List,
  FolderOpen,
  Image as ImageIcon,
  Edit3,
  Download,
} from 'lucide-react';

import { getVisualAssets, type VisualAsset } from '@/lib/visual-assets-service';

const ASSET_CATEGORIES = [
  { id: 'all', name: 'All Assets', count: 0 },
  { id: 'icons', name: 'Icons', count: 0 },
  { id: 'charts', name: 'Charts', count: 0 },
  { id: 'forms', name: 'Forms', count: 0 },
  { id: 'backgrounds', name: 'Backgrounds', count: 0 },
  { id: 'logos', name: 'Logos', count: 0 },
  { id: 'other', name: 'Other', count: 0 },
];

export default function VisualAssetsPage() {
  const [assets, setAssets] = useState<VisualAsset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter assets based on category and search
  const filteredAssets = assets.filter(asset => {
    const matchesCategory =
      selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch =
      asset.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  // Fetch assets from database
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const fetchedAssets = await getVisualAssets();
        setAssets(fetchedAssets);
      } catch (error) {
        console.error('Error fetching assets:', error);
        // TODO: Show error message to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  // Update category counts when assets change
  useEffect(() => {
    const updateCategoryCounts = () => {
      const counts = ASSET_CATEGORIES.map(category => {
        if (category.id === 'all') {
          return { ...category, count: assets.length };
        }
        return {
          ...category,
          count: assets.filter(a => a.category === category.id).length,
        };
      });
      // Update the ASSET_CATEGORIES array
      ASSET_CATEGORIES.splice(0, ASSET_CATEGORIES.length, ...counts);
    };

    updateCategoryCounts();
  }, [assets]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // TODO: Implement actual file upload to Supabase storage
      // For now, we'll create mock assets that match the database structure
      const newAssets = Array.from(files).map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        name: file.name,
        display_name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        type: (file.type.split('/')[1] || 'unknown') as VisualAsset['type'],
        category: 'icons' as VisualAsset['category'], // Default category
        url: URL.createObjectURL(file),
        thumbnail_url: URL.createObjectURL(file),
        file_size: file.size,
        width: null,
        height: null,
        tags: [],
        used_in: [],
        is_active: true,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setAssets(prev => [...newAssets, ...prev]);
      setSelectedCategory('all'); // Show all assets after upload
    } catch (error) {
      console.error('Upload error:', error);
      // TODO: Show error message to user
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  // Handle asset selection
  const toggleAssetSelection = useCallback((assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  }, []);

  // Handle bulk selection
  const selectAllAssets = useCallback(() => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
    }
  }, [filteredAssets, selectedAssets.size]);

  // Handle asset deletion
  const deleteSelectedAssets = useCallback(() => {
    if (selectedAssets.size === 0) {
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete ${selectedAssets.size} selected asset(s)?`
      )
    ) {
      setAssets(prev => prev.filter(asset => !selectedAssets.has(asset.id)));
      setSelectedAssets(new Set());
    }
  }, [selectedAssets.size]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get asset usage count
  const getAssetUsageCount = (asset: VisualAsset) => {
    return asset.used_in.length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Visual Assets
          </h1>
          <p className="text-gray-600">
            Manage images, icons, and visual content for your forms and
            applications.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isUploading
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <div>
                    <p className="text-lg font-medium text-blue-900">
                      Uploading...
                    </p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {uploadProgress}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      SVG, PNG, JPG up to 10MB
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".svg,.png,.jpg,.jpeg,.gif"
                    onChange={e =>
                      e.target.files && handleFileUpload(e.target.files)
                    }
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
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

          {/* View Mode Toggle */}
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

          {/* Bulk Actions */}
          {selectedAssets.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedAssets.size} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelectedAssets}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ASSET_CATEGORIES.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="text-sm"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {category.name}
              <Badge
                variant="secondary"
                className="ml-2 bg-gray-100 text-gray-700"
              >
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Assets Grid/List */}
        <div className="space-y-4">
          {/* Select All */}
          {filteredAssets.length > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedAssets.size === filteredAssets.length}
                onChange={selectAllAssets}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Select all ({filteredAssets.length} assets)
              </span>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading assets...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assets found
              </h3>
              <p className="text-gray-500">
                Upload some assets to get started.
              </p>
            </div>
          ) : (
            <>
              {/* Assets Display */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredAssets.map(asset => (
                    <Card
                      key={asset.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedAssets.has(asset.id)
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : ''
                      }`}
                      onClick={() => toggleAssetSelection(asset.id)}
                    >
                      <CardContent className="p-3">
                        <div className="relative">
                          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                            {asset.type === 'svg' ? (
                              <img
                                src={asset.thumbnail_url || asset.url}
                                alt={asset.display_name}
                                className="w-12 h-12 object-contain"
                              />
                            ) : (
                              <ImageIcon className="w-12 h-12 text-gray-400" />
                            )}
                          </div>

                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.id)}
                            onChange={e => {
                              e.stopPropagation();
                              toggleAssetSelection(asset.id);
                            }}
                            className="absolute top-2 right-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="text-center">
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={asset.display_name}
                          >
                            {asset.display_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {asset.type.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(asset.file_size)}
                          </p>
                          {getAssetUsageCount(asset) > 0 && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Used in {getAssetUsageCount(asset)} place
                              {getAssetUsageCount(asset) !== 1 ? 's' : ''}
                            </Badge>
                          )}
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
                        selectedAssets.has(asset.id)
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : ''
                      }`}
                      onClick={() => toggleAssetSelection(asset.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.id)}
                            onChange={e => {
                              e.stopPropagation();
                              toggleAssetSelection(asset.id);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />

                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {asset.type === 'svg' ? (
                              <img
                                src={asset.thumbnail_url || asset.url}
                                alt={asset.display_name}
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {asset.display_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {asset.type.toUpperCase()} •{' '}
                              {formatFileSize(asset.file_size)}
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

                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>
                              {new Date(asset.created_at).toLocaleDateString()}
                            </span>
                            {getAssetUsageCount(asset) > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Used in {getAssetUsageCount(asset)} place
                                {getAssetUsageCount(asset) !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="p-2">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
