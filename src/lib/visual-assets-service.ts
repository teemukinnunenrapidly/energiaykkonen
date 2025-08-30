import { supabase } from '@/lib/supabase';

// Visual Object - represents a visual asset with multiple images
export interface VisualObject {
  id: string;
  name: string;
  title: string;
  description?: string;
  folder_id?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Visual Object Image - individual images within a visual object
export interface VisualObjectImage {
  id: string;
  visual_object_id: string;
  cloudflare_image_id: string;
  display_order: number;
  created_at: string;
}

// Visual Folder - for organizing visual objects
export interface VisualFolder {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
}

// Form to Visual Object mapping
export interface FormVisualMapping {
  id: string;
  form_element_id: string;
  element_type: 'section' | 'field' | 'option';
  visual_object_id: string;
  created_at: string;
}

// Visual Object View tracking
export interface VisualObjectView {
  id: string;
  visual_object_id: string;
  viewed_at: string;
}

// Extended Visual Object with images and folder info
export interface VisualObjectWithDetails extends VisualObject {
  images: VisualObjectImage[];
  folder?: VisualFolder;
}

// Context for visual support system
export interface VisualContext {
  sectionId?: string;
  fieldId?: string;
  fieldValue?: string;
}

export interface CreateVisualObjectData {
  name: string;
  title: string;
  description?: string;
  folder_id?: string;
}

export interface UpdateVisualObjectData {
  name?: string;
  title?: string;
  description?: string;
  folder_id?: string;
}

export interface CreateVisualObjectImageData {
  visual_object_id: string;
  cloudflare_image_id: string;
  display_order?: number;
}

export interface CreateFormVisualMappingData {
  form_element_id: string;
  element_type: 'section' | 'field' | 'option';
  visual_object_id: string;
}

// Get all visual objects
export async function getVisualObjects(): Promise<VisualObject[]> {
  const { data, error } = await supabase
    .from('visual_objects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching visual objects:', error);
    throw new Error(`Failed to fetch visual objects: ${error.message}`);
  }

  return data || [];
}

// Get visual object by ID with images
export async function getVisualObjectById(
  id: string
): Promise<VisualObjectWithDetails | null> {
  if (!id) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('visual_objects')
    .select(
      `
      *,
      images:visual_object_images(*)
    `
    )
    .eq('id', id)
    .maybeSingle(); // Use maybeSingle() to handle cases where object doesn't exist

  if (error) {
    console.error('Error fetching visual object by ID:', error);
    return null;
  }

  return data;
}

// Get visual object by ID with images and folder details
export async function getVisualObject(
  id: string
): Promise<VisualObjectWithDetails | null> {
  const { data, error } = await supabase
    .from('visual_objects')
    .select(
      `
      *,
      images:visual_object_images(*),
      folder:visual_folders(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching visual object:', error);
    throw new Error(`Failed to fetch visual object: ${error.message}`);
  }

  return data;
}

// Get visual object by context (section, field, value) for VisualSupport component
export async function getVisualObjectByContext(
  sectionId?: string,
  fieldId?: string
): Promise<VisualObjectWithDetails | null> {
  // Build the query to find the appropriate visual object
  const query = supabase
    .from('form_visual_mappings')
    .select(
      `
      visual_object_id,
      visual_objects!inner(
        *,
        images:visual_object_images(*),
        folder:visual_folders(*)
      )
    `
    )
    .eq('element_type', 'section')
    .eq('form_element_id', sectionId || '');

  // If we have a field ID, try to find a more specific mapping
  if (fieldId) {
    const fieldMapping = await supabase
      .from('form_visual_mappings')
      .select(
        `
        visual_object_id,
        visual_objects!inner(
          *,
          images:visual_object_images(*),
          folder:visual_folders(*)
        )
      `
      )
      .eq('element_type', 'field')
      .eq('form_element_id', fieldId)
      .single();

    if (fieldMapping.data) {
      return fieldMapping.data.visual_objects[0] || null;
    }
  }

  // If no field-specific mapping, return the section mapping
  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching visual object by context:', error);
    return null;
  }

  return data.visual_objects[0] || null;
}

// Create a new visual object
export async function createVisualObject(
  data: CreateVisualObjectData
): Promise<VisualObject> {
  // Clean up folder_id - convert empty string to null
  const cleanedData = {
    ...data,
    folder_id: data.folder_id && data.folder_id !== '' ? data.folder_id : null,
  };
  
  const { data: result, error } = await supabase
    .from('visual_objects')
    .insert([cleanedData])
    .select()
    .single();

  if (error) {
    console.error('Error creating visual object:', error);
    throw new Error(`Failed to create visual object: ${error.message}`);
  }

  return result;
}

// Update a visual object
export async function updateVisualObject(
  id: string,
  data: UpdateVisualObjectData
): Promise<VisualObject> {
  // Clean up folder_id - convert empty string to null
  const cleanedData = {
    ...data,
    folder_id: data.folder_id !== undefined 
      ? (data.folder_id && data.folder_id !== '' ? data.folder_id : null)
      : undefined,
  };
  
  const { data: result, error } = await supabase
    .from('visual_objects')
    .update(cleanedData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating visual object:', error);
    throw new Error(`Failed to update visual object: ${error.message}`);
  }

  return result;
}

// Delete a visual object (cascades to images and mappings)
export async function deleteVisualObject(id: string): Promise<void> {
  const { error } = await supabase.from('visual_objects').delete().eq('id', id);

  if (error) {
    console.error('Error deleting visual object:', error);
    throw new Error(`Failed to delete visual object: ${error.message}`);
  }
}

// Create form to visual object mapping
export async function createFormVisualMapping(
  data: CreateFormVisualMappingData
): Promise<FormVisualMapping> {
  const { data: result, error } = await supabase
    .from('form_visual_mappings')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating form visual mapping:', error);
    throw new Error(`Failed to create mapping: ${error.message}`);
  }

  return result;
}

// Get all folders
export async function getVisualFolders(): Promise<VisualFolder[]> {
  const { data, error } = await supabase
    .from('visual_folders')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching visual folders:', error);
    throw new Error(`Failed to fetch folders: ${error.message}`);
  }

  return data || [];
}

// Create folder
export async function createVisualFolder(
  name: string,
  parentId?: string
): Promise<VisualFolder> {
  const { data, error } = await supabase
    .from('visual_folders')
    .insert([{ name, parent_id: parentId }])
    .select()
    .single();

  if (error) {
    console.error('Error creating folder:', error);
    throw new Error(`Failed to create folder: ${error.message}`);
  }

  return data;
}

// Track view of visual object
export async function trackVisualObjectView(
  visualObjectId: string
): Promise<void> {
  // Increment view count
  await supabase
    .from('visual_objects')
    .update({ view_count: supabase.rpc('increment') })
    .eq('id', visualObjectId);

  // Add view record
  await supabase
    .from('visual_object_views')
    .insert([{ visual_object_id: visualObjectId }]);
}

/**
 * Upload an image to Cloudflare via API route
 * @param file - The image file to upload
 * @returns The Cloudflare image ID
 */
export async function uploadToCloudflare(file: File): Promise<string> {
  // Validate file before upload
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/admin/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.imageId;
  } catch (error) {
    console.error('Failed to upload to Cloudflare:', error);
    throw error;
  }
}

// Add image to visual object (updated signature)
export async function addImageToVisualObject(
  visualObjectId: string,
  data: {
    cloudflare_image_id: string;
    title?: string;
    display_order: number;
  }
): Promise<VisualObjectImage> {
  const { data: result, error } = await supabase
    .from('visual_object_images')
    .insert([
      {
        visual_object_id: visualObjectId,
        cloudflare_image_id: data.cloudflare_image_id,
        display_order: data.display_order,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding image to visual object:', error);
    throw new Error(`Failed to add image: ${error.message}`);
  }

  return result;
}

// Remove image from visual object (updated signature)
export async function removeImageFromVisualObject(
  visualObjectId: string,
  imageId: string
): Promise<void> {
  // First get the image to find its Cloudflare ID
  const { data: image, error: fetchError } = await supabase
    .from('visual_object_images')
    .select('cloudflare_image_id')
    .eq('id', imageId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch image: ${fetchError.message}`);
  }

  // Delete from database
  const { error } = await supabase
    .from('visual_object_images')
    .delete()
    .eq('id', imageId)
    .eq('visual_object_id', visualObjectId);

  if (error) {
    throw new Error(`Failed to remove image: ${error.message}`);
  }

  // Delete from Cloudflare (optional - you might want to keep images for a while)
  if (image?.cloudflare_image_id) {
    try {
      await deleteFromCloudflare(image.cloudflare_image_id);
    } catch (error) {
      // Log but don't fail - image might be used elsewhere
      console.error('Failed to delete from Cloudflare:', error);
    }
  }
}

/**
 * Delete an image from Cloudflare Images via server-side API
 * @param imageId - The Cloudflare image ID to delete
 */
export async function deleteFromCloudflare(imageId: string): Promise<void> {
  try {
    const response = await fetch(
      `/api/admin/delete-image?imageId=${encodeURIComponent(imageId)}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to delete from Cloudflare: ${error.error || 'Unknown error'}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        `Failed to delete from Cloudflare: ${data.error || 'Unknown error'}`
      );
    }
  } catch (error) {
    console.error('Failed to delete from Cloudflare:', error);
    throw error;
  }
}

/**
 * Get Cloudflare image URL with variant
 * @param imageId - The Cloudflare image ID
 * @param variant - The variant name (public, thumbnail, etc.)
 * @returns The full image URL
 */
export function getCloudflareImageUrl(
  imageId: string,
  variant: 'public' | 'thumbnail' | 'avatar' | 'cover' = 'public'
): string {
  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;

  if (!accountHash) {
    console.error('Cloudflare account hash not configured');
    return '';
  }

  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

/**
 * Safely get Cloudflare image URL or fallback
 * @param imageId - The Cloudflare image ID
 * @param variant - The variant name
 * @returns The image URL or a placeholder
 */
export function getSafeImageUrl(
  imageId: string | null | undefined,
  variant: 'public' | 'thumbnail' | 'avatar' | 'cover' = 'public'
): string {
  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;

  // If no image ID, return placeholder
  if (!imageId) {
    return '/placeholder-image.svg'; // Make sure to add this file to your public folder
  }

  // If Cloudflare not configured, return placeholder
  if (!accountHash || accountHash === 'your_account_hash') {
    console.warn('Cloudflare Images not configured');
    return '/placeholder-image.svg';
  }

  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

/**
 * Upload multiple images to Cloudflare
 * @param files - Array of image files
 * @returns Array of Cloudflare image IDs
 */
export async function uploadMultipleToCloudflare(
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadToCloudflare(file));

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Failed to upload multiple files:', error);
    throw error;
  }
}

/**
 * Validate image before upload
 * @param file - The file to validate
 * @returns Boolean indicating if file is valid
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, WebP, or SVG.',
    };
  }

  // Check file size (Cloudflare max is 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}
