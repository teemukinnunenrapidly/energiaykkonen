import { supabase } from '@/lib/supabase';

export interface VisualAsset {
  id: string;
  name: string;
  display_name: string;
  type: 'svg' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'pdf';
  category: 'icons' | 'charts' | 'forms' | 'backgrounds' | 'logos' | 'other';
  url: string;
  thumbnail_url: string | null;
  file_size: number;
  width: number | null;
  height: number | null;
  tags: string[];
  used_in: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVisualAssetData {
  name: string;
  display_name: string;
  type: VisualAsset['type'];
  category: VisualAsset['category'];
  url: string;
  thumbnail_url?: string;
  file_size: number;
  width?: number;
  height?: number;
  tags?: string[];
  used_in?: string[];
}

export interface UpdateVisualAssetData {
  name?: string;
  display_name?: string;
  category?: VisualAsset['category'];
  thumbnail_url?: string;
  tags?: string[];
  used_in?: string[];
  is_active?: boolean;
}

// Get all visual assets
export async function getVisualAssets(): Promise<VisualAsset[]> {
  const { data, error } = await supabase
    .from('visual_assets')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching visual assets:', error);
    throw new Error(`Failed to fetch visual assets: ${error.message}`);
  }

  return data || [];
}

// Get visual asset by ID
export async function getVisualAsset(id: string): Promise<VisualAsset | null> {
  const { data, error } = await supabase
    .from('visual_assets')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching visual asset:', error);
    throw new Error(`Failed to fetch visual asset: ${error.message}`);
  }

  return data;
}

// Create a new visual asset
export async function createVisualAsset(data: CreateVisualAssetData): Promise<VisualAsset> {
  const { data: result, error } = await supabase
    .from('visual_assets')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating visual asset:', error);
    throw new Error(`Failed to create visual asset: ${error.message}`);
  }

  return result;
}

// Update a visual asset
export async function updateVisualAsset(
  id: string,
  data: UpdateVisualAssetData
): Promise<VisualAsset> {
  const { data: result, error } = await supabase
    .from('visual_assets')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating visual asset:', error);
    throw new Error(`Failed to update visual asset: ${error.message}`);
  }

  return result;
}

// Delete a visual asset (soft delete)
export async function deleteVisualAsset(id: string): Promise<void> {
  const { error } = await supabase
    .from('visual_assets')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting visual asset:', error);
    throw new Error(`Failed to delete visual asset: ${error.message}`);
  }
}

// Get assets by category
export async function getVisualAssetsByCategory(category: VisualAsset['category']): Promise<VisualAsset[]> {
  const { data, error } = await supabase
    .from('visual_assets')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching visual assets by category:', error);
    throw new Error(`Failed to fetch visual assets by category: ${error.message}`);
  }

  return data || [];
}

// Search assets by name or tags
export async function searchVisualAssets(query: string): Promise<VisualAsset[]> {
  const { data, error } = await supabase
    .from('visual_assets')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,display_name.ilike.%${query}%,tags.cs.{${query}}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching visual assets:', error);
    throw new Error(`Failed to search visual assets: ${error.message}`);
  }

  return data || [];
}
