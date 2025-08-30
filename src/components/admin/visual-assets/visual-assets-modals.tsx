import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getSafeImageUrl } from '@/lib/visual-assets-service';

interface VisualFolder {
  id: string;
  name: string;
}

interface VisualObjectImage {
  id: string;
  cloudflare_image_id: string;
  title?: string;
  display_order: number;
}

interface CreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, images: File[]) => Promise<void>;
  folders: VisualFolder[];
  editingObject?: {
    id: string;
    name: string;
    title: string;
    description?: string;
    folder_id?: string;
    images: VisualObjectImage[];
  } | null;
}

export function CreateEditModal({
  isOpen,
  onClose,
  onSave,
  folders,
  editingObject,
}: CreateEditModalProps) {
  const [formData, setFormData] = useState({
    name: editingObject?.name || '',
    title: editingObject?.title || '',
    description: editingObject?.description || '',
    folder_id: editingObject?.folder_id || '',
  });

  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<VisualObjectImage[]>(
    editingObject?.images || []
  );
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate reference name from title
  const generateReferenceName = (title: string) => {
    return `visual_object_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  };

  // Handle title change and auto-generate reference name
  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      name: !editingObject ? generateReferenceName(value) : prev.name,
    }));
  };

  // Handle image selection
  const handleImageSelect = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const fileArray = Array.from(files);
    setNewImages(prev => [...prev, ...fileArray]);

    // Create preview URLs
    const urls = fileArray.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...urls]);
  };

  // Remove new image
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Mark existing image for deletion
  const markImageForDeletion = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.title) {
      alert('Please fill in required fields');
      return;
    }

    if (!editingObject && newImages.length === 0) {
      alert('Please add at least one image');
      return;
    }

    setLoading(true);
    try {
      await onSave(
        {
          ...formData,
          imagesToDelete: editingObject ? imagesToDelete : undefined,
        },
        newImages
      );
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save visual object');
    } finally {
      setLoading(false);
    }
  };

  // Update state when editingObject changes
  React.useEffect(() => {
    console.log('Modal editingObject changed:', editingObject);
    if (editingObject) {
      console.log('Setting form data for editing:', editingObject);
      setFormData({
        name: editingObject.name || '',
        title: editingObject.title || '',
        description: editingObject.description || '',
        folder_id: editingObject.folder_id || '',
      });
      console.log('Setting existing images:', editingObject.images);
      setExistingImages(editingObject.images || []);
      setImagesToDelete([]);
      setCurrentImageIndex(0);
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        title: '',
        description: '',
        folder_id: '',
      });
      setExistingImages([]);
      setImagesToDelete([]);
      setCurrentImageIndex(0);
    }
  }, [editingObject]);

  // Clean up preview URLs on unmount
  React.useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const allImages = [
    ...existingImages.map(img => ({
      type: 'existing' as const,
      url: getSafeImageUrl(img.cloudflare_image_id, 'public'),
      id: img.id,
      title: img.title,
    })),
    ...imagePreviewUrls.map((url, index) => ({
      type: 'new' as const,
      url,
      id: `new-${index}`,
      title: newImages[index].name,
    })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingObject ? 'Edit Visual Object' : 'Create Visual Object'}
          </DialogTitle>
          <DialogDescription>
            {editingObject
              ? 'Update the visual object details and manage its images.'
              : 'Create a new visual object with images for the calculator interface.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Section */}
          <div>
            <Label className="mb-2 block">Images</Label>

            {/* Image Carousel */}
            {allImages.length > 0 && (
              <div className="relative mb-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={allImages[currentImageIndex].url}
                    alt={allImages[currentImageIndex].title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setCurrentImageIndex(prev =>
                          prev === 0 ? allImages.length - 1 : prev - 1
                        )
                      }
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setCurrentImageIndex(prev =>
                          prev === allImages.length - 1 ? 0 : prev + 1
                        )
                      }
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                <Badge className="absolute top-2 right-2">
                  {currentImageIndex + 1} / {allImages.length}
                </Badge>
              </div>
            )}

            {/* Existing Images Grid */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Existing Images</p>
                <div className="grid grid-cols-4 gap-2">
                  {existingImages.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={getSafeImageUrl(
                          img.cloudflare_image_id,
                          'thumbnail'
                        )}
                        alt={img.title || ''}
                        className="w-full aspect-square object-cover rounded border cursor-pointer"
                        onClick={() => setCurrentImageIndex(index)}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => markImageForDeletion(img.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Grid */}
            {newImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">New Images</p>
                <div className="grid grid-cols-4 gap-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="w-full aspect-square object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => handleImageSelect(e.target.files)}
            />
          </div>

          {/* Title Field */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Enter display title"
              required
            />
          </div>

          {/* Reference Name Field */}
          <div>
            <Label htmlFor="name">Reference Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="visual_object_xxx"
              pattern="^visual_object_[a-z0-9_]+$"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in shortcodes: [visual:object-name]
            </p>
          </div>

          {/* Description Field */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {/* Folder Selection */}
          <div>
            <Label htmlFor="folder">Folder</Label>
            <Select
              value={formData.folder_id}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, folder_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-folder">No Folder</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editingObject ? 'Save Changes' : 'Create Object'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Upload Assets Modal Component
export function UploadAssetsModal({
  isOpen,
  onClose,
  onUpload,
  folders,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], folderId?: string) => Promise<void>;
  folders: VisualFolder[];
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) {
      return;
    }
    setSelectedFiles(Array.from(files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    setUploading(true);
    try {
      await onUpload(
        selectedFiles,
        selectedFolder === 'no-folder' ? undefined : selectedFolder
      );
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload assets');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Assets</DialogTitle>
          <DialogDescription>
            Select and upload multiple images to create visual objects quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <Label>Select Images</Label>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Click to select images or drag and drop
              </p>
              {selectedFiles.length > 0 && (
                <p className="mt-2 text-sm font-medium">
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => handleFileSelect(e.target.files)}
            />
          </div>

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full aspect-square object-cover rounded"
                  />
                  <p className="text-xs truncate mt-1">{file.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* Folder Selection */}
          <div>
            <Label htmlFor="upload-folder">Target Folder (Optional)</Label>
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger id="upload-folder">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-folder">No Folder</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Upload {selectedFiles.length} Image
            {selectedFiles.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
