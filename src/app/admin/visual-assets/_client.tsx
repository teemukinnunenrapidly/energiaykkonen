'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  CreateEditModal,
  UploadAssetsModal,
} from '@/components/admin/visual-assets/visual-assets-modals';
import { Folder, FolderOpen, Plus, Search, ImageIcon, Eye, Edit, Trash2, Upload, Grid3X3, List } from 'lucide-react';

interface FolderNode extends VisualFolder {
  children: FolderNode[];
  isExpanded?: boolean;
}

export default function VisualAssetsClient() {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [visualObjects, setVisualObjects] = useState<VisualObjectWithDetails[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<VisualObjectWithDetails[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [editingObject, setEditingObject] = useState<VisualObjectWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const buildFolderTree = (flat: VisualFolder[]): FolderNode[] => {
    const map = new Map<string, FolderNode>();
    const roots: FolderNode[] = [];
    flat.forEach(f => map.set(f.id, { ...f, children: [], isExpanded: false }));
    flat.forEach(f => {
      const node = map.get(f.id)!;
      if (f.parent_id) {
        const parent = map.get(f.parent_id);
        if (parent) parent.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [foldersData, objectsData] = await Promise.all([
        getVisualFolders(),
        getVisualObjects(),
      ]);
      setFolders(buildFolderTree(foldersData));
      const details = await Promise.all(
        objectsData.map(async o => {
          try {
            return await getVisualObject(o.id);
          } catch {
            return null;
          }
        })
      );
      setVisualObjects(details.filter(Boolean) as VisualObjectWithDetails[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let filtered = visualObjects;
    if (selectedFolder) filtered = filtered.filter(o => o.folder_id === selectedFolder);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o => o.title.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q));
    }
    setFilteredObjects(filtered);
  }, [visualObjects, selectedFolder, searchQuery]);

  const toggleFolder = (id: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f));

  const renderFolderTree = (nodes: FolderNode[]) => nodes.map(folder => (
    <div key={folder.id}>
      <div className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${selectedFolder === folder.id ? 'bg-blue-100' : ''}`} onClick={() => setSelectedFolder(folder.id)}>
        <div className="w-4 h-4 mr-2">
          {folder.children.length > 0 && (
            <button onClick={e => { e.stopPropagation(); toggleFolder(folder.id); }} className="w-4 h-4 flex items-center justify-center">
              {folder.isExpanded ? <FolderOpen className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
            </button>
          )}
        </div>
        <span className="text-sm truncate">{folder.name}</span>
      </div>
      {folder.isExpanded && folder.children.length > 0 && (
        <div className="ml-4">{renderFolderTree(folder.children)}</div>
      )}
    </div>
  ));

  const handleDeleteObject = async (id: string) => {
    if (!confirm('Delete visual object?')) return;
    await deleteVisualObject(id);
    setVisualObjects(prev => prev.filter(o => o.id !== id));
  };

  const flatFolders: VisualFolder[] = [];
  (function extract(nodes: FolderNode[]) {
    nodes.forEach(n => { flatFolders.push({ id: n.id, name: n.name, parent_id: n.parent_id, created_at: new Date().toISOString() }); if (n.children.length) extract(n.children); });
  })(folders);

  return (
    <>
      <AdminNavigation />
      <div className="flex h-full">
        <div className="w-64 border-r bg-gray-50 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Folders</h2>
            <Button size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" /> New Folder
            </Button>
          </div>
          <div className="space-y-1">
            <div className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${selectedFolder === null ? 'bg-blue-100' : ''}`} onClick={() => setSelectedFolder(null)}>
              <span className="text-sm font-medium">All Visual Objects</span>
            </div>
            {renderFolderTree(folders)}
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Visual Assets</h1>
              <p className="text-gray-600">{filteredObjects.length} visual object{filteredObjects.length !== 1 ? 's' : ''}{selectedFolder && ' in selected folder'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsUploadModalOpen(true)}><Upload className="w-4 h-4 mr-2" /> Upload Assets</Button>
              <Button onClick={() => setIsCreateModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Object</Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search visual objects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><Grid3X3 className="w-4 h-4" /></Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredObjects.map(obj => {
              const isSelected = selectedObjects.has(obj.id);
              const firstImage = obj.images[0];
              const imageUrl = getSafeImageUrl(firstImage?.cloudflare_image_id, 'public');
              return (
                <Card key={obj.id} className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-blue-500' : ''}`} onClick={() => { const next = new Set(selectedObjects); next.has(obj.id) ? next.delete(obj.id) : next.add(obj.id); setSelectedObjects(next); }}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">{obj.images.length} {obj.images.length === 1 ? 'image' : 'images'}</Badge>
                      <div className="flex items-center gap-1 text-gray-500"><Eye className="w-3 h-3" /><span className="text-xs">{obj.view_count}</span></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {imageUrl ? <img src={imageUrl} alt={obj.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-400" /></div>}
                    </div>
                    <h3 className="font-semibold text-sm mb-1 truncate">{obj.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">Ref: {obj.name}</p>
                    {obj.description && <p className="text-xs text-gray-600 line-clamp-2">{obj.description}</p>}
                    <div className="flex items-center justify-between mt-3">
                      {obj.folder && <Badge variant="outline" className="text-xs">📁 {obj.folder.name}</Badge>}
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setEditingObject(obj); setIsEditModalOpen(true); }}><Edit className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handleDeleteObject(obj.id); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <CreateEditModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={async (data, images) => { const obj = await createVisualObject({ name: data.name, title: data.title, description: data.description, folder_id: data.folder_id === 'no-folder' ? undefined : data.folder_id, show_overlay: !!data.show_overlay }); if (images.length) { for (let i=0;i<images.length;i++){ const url = await uploadToCloudflare(images[i]); await addImageToVisualObject(obj.id, { cloudflare_image_id: url.split('/').pop()!, title: images[i].name, display_order: i }); } } await loadData(); }} folders={flatFolders} editingObject={null} />

      <CreateEditModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingObject(null); }} onSave={async (data, images) => { if (!editingObject) return; await updateVisualObject(editingObject.id, { name: data.name, title: data.title, description: data.description, folder_id: data.folder_id === 'no-folder' ? undefined : data.folder_id, show_overlay: !!data.show_overlay }); if (data.imagesToDelete?.length) { for (const imgId of data.imagesToDelete) { await removeImageFromVisualObject(editingObject.id, imgId); } } if (images.length) { const existing = editingObject.images.length - (data.imagesToDelete?.length || 0); for (let i=0;i<images.length;i++){ const url = await uploadToCloudflare(images[i]); await addImageToVisualObject(editingObject.id, { cloudflare_image_id: url.split('/').pop()!, title: images[i].name, display_order: existing + i }); } } await loadData(); }} folders={flatFolders} editingObject={editingObject} />

      <UploadAssetsModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={async (files, folderId) => { for (const file of files) { const base = file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'); const obj = await createVisualObject({ name: `visual_object_${base}`, title: file.name.split('.')[0], description: 'Uploaded from bulk upload', folder_id: folderId }); const url = await uploadToCloudflare(file); await addImageToVisualObject(obj.id, { cloudflare_image_id: url.split('/').pop()!, title: file.name, display_order: 0 }); } await loadData(); }} folders={flatFolders} />
    </>
  );
}



