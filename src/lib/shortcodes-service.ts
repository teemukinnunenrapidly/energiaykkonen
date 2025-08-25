import { supabase } from '@/lib/supabase';

export interface Shortcode {
  id: string;
  name: string;
  description: string;
  example: string;
  category: 'customer' | 'results' | 'company' | 'system';
  replacement_value: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateShortcodeData {
  name: string;
  description: string;
  example: string;
  category: Shortcode['category'];
  replacement_value: string;
}

export interface UpdateShortcodeData {
  name?: string;
  description?: string;
  example?: string;
  category?: Shortcode['category'];
  replacement_value?: string;
  is_active?: boolean;
}

// Get all shortcodes
export async function getShortcodes(): Promise<Shortcode[]> {
  const { data, error } = await supabase
    .from('shortcodes')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching shortcodes:', error);
    throw new Error(`Failed to fetch shortcodes: ${error.message}`);
  }

  return data || [];
}

// Get shortcode by ID
export async function getShortcode(id: string): Promise<Shortcode | null> {
  const { data, error } = await supabase
    .from('shortcodes')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching shortcode:', error);
    throw new Error(`Failed to fetch shortcode: ${error.message}`);
  }

  return data;
}

// Create a new shortcode
export async function createShortcode(
  data: CreateShortcodeData
): Promise<Shortcode> {
  const { data: result, error } = await supabase
    .from('shortcodes')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating shortcode:', error);
    throw new Error(`Failed to create shortcode: ${error.message}`);
  }

  return result;
}

// Update an existing shortcode
export async function updateShortcode(
  id: string,
  data: UpdateShortcodeData
): Promise<Shortcode> {
  const { data: result, error } = await supabase
    .from('shortcodes')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating shortcode:', error);
    throw new Error(`Failed to update shortcode: ${error.message}`);
  }

  return result;
}

// Delete a shortcode (soft delete)
export async function deleteShortcode(id: string): Promise<void> {
  const { error } = await supabase
    .from('shortcodes')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting shortcode:', error);
    throw new Error(`Failed to delete shortcode: ${error.message}`);
  }
}

// Get shortcodes by category
export async function getShortcodesByCategory(
  category: Shortcode['category']
): Promise<Shortcode[]> {
  const { data, error } = await supabase
    .from('shortcodes')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching shortcodes by category:', error);
    throw new Error(`Failed to fetch shortcodes by category: ${error.message}`);
  }

  return data || [];
}

// Process content by replacing shortcodes with their values
export async function processShortcodes(
  content: string,
  context: Record<string, any>
): Promise<string> {
  const shortcodes = await getShortcodes();
  let processedContent = content;

  for (const shortcode of shortcodes) {
    const regex = new RegExp(`\\{\\{${shortcode.name}\\}\\}`, 'g');

    // Get the actual value from context or use the replacement_value
    let value = shortcode.replacement_value;

    // Try to get value from context if it's a dynamic shortcode
    if (shortcode.name.includes('.')) {
      const [category, field] = shortcode.name.split('.');
      if (context[category] && context[category][field]) {
        value = context[category][field];
      }
    }

    processedContent = processedContent.replace(regex, value);
  }

  return processedContent;
}
