'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Search,
  Image as ImageIcon,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getVisualObjects,
  getVisualFolders,
  getVisualObject,
  getSafeImageUrl,
  type VisualFolder,
  type VisualObjectWithDetails,
} from '@/lib/visual-assets-service';

interface VisualObjectSelectorProps {
  currentObjectId?: string;
  onSelect: (objectId: string) => void;
  onRemove: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FolderNode extends VisualFolder {
  children: FolderNode[];
  isExpanded?: boolean;
}

export const VisualObjectSelector: React.FC<VisualObjectSelectorProps> = ({
  currentObjectId,
  onSelect,
  onRemove,
  open,
  onOpenChange,
}) => {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [visualObjects, setVisualObjects] = useState<VisualObjectWithDetails[]>(
    []
  );
  const [filteredObjects, setFilteredObjects] = useState<
    VisualObjectWithDetails[]
  >([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    filterObjects();
  }, [searchQuery, selectedFolder, visualObjects]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [foldersData, objectsData] = await Promise.all([
        getVisualFolders(),
        getVisualObjects(),
      ]);

      // Build folder tree structure
      const folderTree = buildFolderTree(foldersData);
      setFolders(folderTree);

      // Load full object details
      const objectsWithDetails = await Promise.all(
        objectsData.map(async obj => {
          try {
            const fullObj = await getVisualObject(obj.id);
            return fullObj;
          } catch (error) {
            console.error(
              `Failed to load details for object ${obj.id}:`,
              error
            );
            return null;
          }
        })
      );

      setVisualObjects(
        objectsWithDetails.filter(Boolean) as VisualObjectWithDetails[]
      );
    } catch (error) {
      console.error('Failed to load visual objects data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (flatFolders: VisualFolder[]): FolderNode[] => {
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // Create map of all folders
    flatFolders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [], isExpanded: false });
    });

    // Build tree structure
    flatFolders.forEach(folder => {
      const node = folderMap.get(folder.id)!;
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    return rootFolders;
  };

  const filterObjects = () => {
    let filtered = visualObjects;

    // Filter by selected folder
    if (selectedFolder) {
      filtered = filtered.filter(obj => obj.folder_id === selectedFolder);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        obj =>
          obj.title.toLowerCase().includes(query) ||
          obj.name.toLowerCase().includes(query) ||
          obj.description?.toLowerCase().includes(query)
      );
    }

    setFilteredObjects(filtered);
  };

  const toggleFolder = (folderId: string) => {
    setFolders(prev =>
      prev.map(folder =>
        folder.id === folderId
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };

  const handleSelect = (objectId: string) => {
    onSelect(objectId);
    onOpenChange(false);
  };

  const handleRemove = () => {
    onRemove();
    onOpenChange(false);
  };

  const renderFolderTree = (folderNodes: FolderNode[], level = 0) => {
    return folderNodes.map(folder => (
      <div key={folder.id}>
        <div
          className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${
            selectedFolder === folder.id ? 'bg-blue-100' : ''
          }`}
          onClick={() => setSelectedFolder(folder.id)}
        >
          <div className="w-4 h-4 mr-2">
            {folder.children.length > 0 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="w-4 h-4 flex items-center justify-center"
              >
                {folder.isExpanded ? (
                  <FolderOpen className="w-3 h-3" />
                ) : (
                  <Folder className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
          <span className="text-sm truncate">{folder.name}</span>
        </div>
        {folder.isExpanded && folder.children.length > 0 && (
          <div className="ml-4">
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderVisualObjectCard = (obj: VisualObjectWithDetails) => {
    const isSelected = currentObjectId === obj.id;
    const isHovered = hoveredObject === obj.id;
    const firstImage = obj.images[0];
    const imageUrl = getSafeImageUrl(firstImage?.cloudflare_image_id, 'public');

    return (
      <Card
        key={obj.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${isHovered ? 'scale-105' : ''}`}
        onClick={() => handleSelect(obj.id)}
        onMouseEnter={() => setHoveredObject(obj.id)}
        onMouseLeave={() => setHoveredObject(null)}
      >
        <CardContent className="p-4">
          <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={obj.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>

          <h3 className="font-semibold text-sm mb-1 truncate">{obj.title}</h3>
          {obj.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {obj.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {obj.images.length} {obj.images.length === 1 ? 'image' : 'images'}
            </Badge>
            <div className="flex items-center gap-1 text-gray-500">
              <Eye className="w-3 h-3" />
              <span className="text-xs">{obj.view_count}</span>
            </div>
          </div>

          {obj.folder && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                📁 {obj.folder.name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Visual Object</span>
            {currentObjectId && (
              <Button variant="outline" size="sm" onClick={handleRemove}>
                <X className="w-4 h-4 mr-2" />
                Remove Current
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[70vh] gap-6">
          {/* Left: Folder Tree */}
          <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Folders</h3>
            </div>

            <div className="space-y-1">
              <div
                className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${
                  selectedFolder === null ? 'bg-blue-100' : ''
                }`}
                onClick={() => setSelectedFolder(null)}
              >
                <span className="text-sm font-medium">All Visual Objects</span>
              </div>
              {renderFolderTree(folders)}
            </div>
          </div>

          {/* Right: Visual Objects Grid */}
          <div className="flex-1 overflow-y-auto">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search visual objects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {filteredObjects.length} visual object
                {filteredObjects.length !== 1 ? 's' : ''} found
                {selectedFolder && ' in selected folder'}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Visual Objects Grid */}
            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredObjects.map(renderVisualObjectCard)}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredObjects.length === 0 && (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No visual objects found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || selectedFolder
                    ? 'Try adjusting your search or folder selection'
                    : 'Create some visual objects first'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {currentObjectId && (
            <Button variant="outline" onClick={handleRemove}>
              Remove Current
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
