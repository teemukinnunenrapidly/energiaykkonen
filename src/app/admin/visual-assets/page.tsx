'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  ImageIcon,
  Eye,
  Edit,
  Trash2,
  Upload,
  Grid3X3,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AdminNavigation from '@/components/admin/AdminNavigation';
import {
  getVisualObjects,
  getVisualFolders,
  deleteVisualObject,
  getVisualObject,
  updateVisualObject,
  createVisualObject,
  uploadToCloudflare,
  addImageToVisualObject,
  removeImageFromVisualObject,
  getSafeImageUrl,
  type VisualFolder,
  type VisualObjectWithDetails,
} from '@/lib/visual-assets-service';
// Import the modal components we just created
import {
  CreateEditModal,
  UploadAssetsModal,
} from '@/components/admin/visual-assets/visual-assets-modals';

interface FolderNode extends VisualFolder {
  children: FolderNode[];
  isExpanded?: boolean;
}

export default function VisualAssetsPage() {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [visualObjects, setVisualObjects] = useState<VisualObjectWithDetails[]>(
    []
  );
  const [filteredObjects, setFilteredObjects] = useState<
    VisualObjectWithDetails[]
  >([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(
    new Set()
  );

  // Modal states
  const [editingObject, setEditingObject] =
    useState<VisualObjectWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterObjects();
  }, [searchQuery, selectedFolder, visualObjects, filterObjects]);

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
          } catch {
            // Failed to load details for object
            return null;
          }
        })
      );

      setVisualObjects(
        objectsWithDetails.filter(Boolean) as VisualObjectWithDetails[]
      );
    } catch {
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

  const handleDeleteObject = async (objectId: string) => {
    if (!confirm('Are you sure you want to delete this visual object?')) {
      return;
    }

    try {
      await deleteVisualObject(objectId);
      setVisualObjects(prev => prev.filter(obj => obj.id !== objectId));
    } catch {
      alert('Failed to delete visual object');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedObjects.size === 0) {
      return;
    }
    if (
      !confirm(
        `Are you sure you want to delete ${selectedObjects.size} visual objects?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedObjects).map(id => deleteVisualObject(id))
      );
      setVisualObjects(prev =>
        prev.filter(obj => !selectedObjects.has(obj.id))
      );
      setSelectedObjects(new Set());
    } catch {
      alert('Failed to delete some visual objects');
    }
  };

  // Handle Create Visual Object
  const handleCreateObject = async (data: any, images: File[]) => {
    try {
      // Create the visual object
      const newObject = await createVisualObject({
        name: data.name,
        title: data.title,
        description: data.description,
        folder_id: data.folder_id === 'no-folder' ? undefined : data.folder_id,
      });

      // Upload images if provided
      if (images.length > 0) {
        try {
          for (let i = 0; i < images.length; i++) {
            const imageUrl = await uploadToCloudflare(images[i]);
            await addImageToVisualObject(newObject.id, {
              cloudflare_image_id: imageUrl.split('/').pop()!, // Extract ID from URL
              title: images[i].name,
              display_order: i,
            });
          }
        } catch (uploadError: any) {
          console.warn(
            'Image upload failed, but visual object was created:',
            uploadError
          );
          // Show a warning that images couldn't be uploaded but object was created
          alert(
            `Visual object created successfully, but images could not be uploaded: ${uploadError.message || 'Unknown error'}`
          );
        }
      }

      // Reload data to show new object
      await loadData();
      setIsCreateModalOpen(false);
    } catch (error) {
      throw error;
    }
  };

  // Handle Edit Visual Object
  const handleEditObject = async (data: any, images: File[]) => {
    if (!editingObject) {
      return;
    }

    try {
      // Update the visual object basic info
      await updateVisualObject(editingObject.id, {
        name: data.name,
        title: data.title,
        description: data.description,
        folder_id: data.folder_id === 'no-folder' ? undefined : data.folder_id,
      });

      // Delete marked images
      if (data.imagesToDelete && data.imagesToDelete.length > 0) {
        for (const imageId of data.imagesToDelete) {
          await removeImageFromVisualObject(editingObject.id, imageId);
        }
      }

      // Upload new images
      if (images.length > 0) {
        const existingCount =
          editingObject.images.length - (data.imagesToDelete?.length || 0);
        for (let i = 0; i < images.length; i++) {
          const imageUrl = await uploadToCloudflare(images[i]);
          await addImageToVisualObject(editingObject.id, {
            cloudflare_image_id: imageUrl.split('/').pop()!, // Extract ID from URL
            title: images[i].name,
            display_order: existingCount + i,
          });
        }
      }

      // Reload data to show updated object
      await loadData();
      setIsEditModalOpen(false);
      setEditingObject(null);
    } catch (error) {
      throw error;
    }
  };

  // Handle Upload Assets (bulk upload)
  const handleBulkUpload = async (files: File[], folderId?: string) => {
    try {
      // Create a visual object for each image
      for (const file of files) {
        const objectName = file.name
          .split('.')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');

        // Create visual object
        const newObject = await createVisualObject({
          name: `visual_object_${objectName}`,
          title: file.name.split('.')[0],
          description: `Uploaded from bulk upload`,
          folder_id: folderId === 'no-folder' ? undefined : folderId,
        });

        // Upload image to Cloudflare
        const imageUrl = await uploadToCloudflare(file);

        // Add image to visual object
        await addImageToVisualObject(newObject.id, {
          cloudflare_image_id: imageUrl.split('/').pop()!,
          title: file.name,
          display_order: 0,
        });
      }

      // Reload data to show new objects
      await loadData();
      setIsUploadModalOpen(false);
    } catch (error) {
      throw error;
    }
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
    const isSelected = selectedObjects.has(obj.id);
    const firstImage = obj.images[0];
    const imageUrl = getSafeImageUrl(firstImage?.cloudflare_image_id, 'public');

    return (
      <Card
        key={obj.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => {
          const newSelected = new Set(selectedObjects);
          if (isSelected) {
            newSelected.delete(obj.id);
          } else {
            newSelected.add(obj.id);
          }
          setSelectedObjects(newSelected);
        }}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {obj.images.length} {obj.images.length === 1 ? 'image' : 'images'}
            </Badge>
            <div className="flex items-center gap-1 text-gray-500">
              <Eye className="w-3 h-3" />
              <span className="text-xs">{obj.view_count}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
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
          </div>

          <h3 className="font-semibold text-sm mb-1 truncate">{obj.title}</h3>
          <p className="text-xs text-gray-500 mb-1">Ref: {obj.name}</p>
          {obj.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {obj.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            {obj.folder && (
              <Badge variant="outline" className="text-xs">
                📁 {obj.folder.name}
              </Badge>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  setEditingObject(obj);
                  setIsEditModalOpen(true);
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteObject(obj.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get flat list of all folders for modal dropdown
  const flatFolders: VisualFolder[] = [];
  const extractFolders = (nodes: FolderNode[]) => {
    nodes.forEach(node => {
      flatFolders.push({
        id: node.id,
        name: node.name,
        parent_id: node.parent_id,
        created_at: new Date().toISOString(), // Default value for modal dropdown
      });
      if (node.children.length > 0) {
        extractFolders(node.children);
      }
    });
  };
  extractFolders(folders);

  return (
    <>
      <AdminNavigation />
      <div className="flex h-full">
        {/* Folder Tree Sidebar */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Folders</h2>
            <Button size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
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

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Visual Assets</h1>
              <p className="text-gray-600">
                {filteredObjects.length} visual object
                {filteredObjects.length !== 1 ? 's' : ''}
                {selectedFolder && ` in selected folder`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Assets
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Object
              </Button>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search visual objects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Bulk Actions */}
          {selectedObjects.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedObjects.size} object
                {selectedObjects.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Visual Objects Grid */}
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredObjects.map(renderVisualObjectCard)}
          </div>

          {filteredObjects.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No visual objects found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedFolder
                  ? 'Try adjusting your search or folder selection'
                  : 'Get started by creating your first visual object'}
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Visual Object
              </Button>
            </div>
          )}
        </div>

        {/* Create Modal */}
        <CreateEditModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateObject}
          folders={flatFolders}
          editingObject={null}
        />

        {/* Edit Modal */}
        <CreateEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingObject(null);
          }}
          onSave={handleEditObject}
          folders={flatFolders}
          editingObject={editingObject}
        />

        {/* Upload Assets Modal */}
        <UploadAssetsModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleBulkUpload}
          folders={flatFolders}
        />
      </div>
    </>
  );
}
