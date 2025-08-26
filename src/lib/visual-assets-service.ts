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

// Get visual object by ID with images and folder details
export async function getVisualObject(id: string): Promise<VisualObjectWithDetails | null> {
  const { data, error } = await supabase
    .from('visual_objects')
    .select(`
      *,
      images:visual_object_images(*),
      folder:visual_folders(*)
    `)
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
  fieldId?: string,
  fieldValue?: string
): Promise<VisualObjectWithDetails | null> {
  // Build the query to find the appropriate visual object
  let query = supabase
    .from('form_visual_mappings')
    .select(`
      visual_object_id,
      visual_objects!inner(
        *,
        images:visual_object_images(*),
        folder:visual_folders(*)
      )
    `)
    .eq('element_type', 'section')
    .eq('form_element_id', sectionId || '');

  // If we have a field ID, try to find a more specific mapping
  if (fieldId) {
    const fieldMapping = await supabase
      .from('form_visual_mappings')
      .select(`
        visual_object_id,
        visual_objects!inner(
          *,
          images:visual_object_images(*),
          folder:visual_folders(*)
        )
      `)
      .eq('element_type', 'field')
      .eq('form_element_id', fieldId)
      .single();

    if (fieldMapping.data) {
      return fieldMapping.data.visual_objects;
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

  return data.visual_objects;
}

// Create a new visual object
export async function createVisualObject(
  data: CreateVisualObjectData
): Promise<VisualObject> {
  const { data: result, error } = await supabase
    .from('visual_objects')
    .insert([data])
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
  const { data: result, error } = await supabase
    .from('visual_objects')
    .update(data)
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
  const { error } = await supabase
    .from('visual_objects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting visual object:', error);
    throw new Error(`Failed to delete visual object: ${error.message}`);
  }
}

// Add image to visual object
export async function addImageToVisualObject(
  data: CreateVisualObjectImageData
): Promise<VisualObjectImage> {
  const { data: result, error } = await supabase
    .from('visual_object_images')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error adding image to visual object:', error);
    throw new Error(`Failed to add image: ${error.message}`);
  }

  return result;
}

// Remove image from visual object
export async function removeImageFromVisualObject(imageId: string): Promise<void> {
  const { error } = await supabase
    .from('visual_object_images')
    .delete()
    .eq('id', imageId);

  if (error) {
    console.error('Error removing image:', error);
    throw new Error(`Failed to remove image: ${error.message}`);
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
export async function createVisualFolder(name: string, parentId?: string): Promise<VisualFolder> {
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
export async function trackVisualObjectView(visualObjectId: string): Promise<void> {
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
