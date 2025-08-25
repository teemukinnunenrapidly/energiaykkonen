import { supabase } from '@/lib/supabase';
import { FormSchema } from '@/types/form';

export interface FormSchemaRecord {
  id: string;
  name: string;
  description: string | null;
  schema_data: FormSchema;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFormSchemaData {
  name: string;
  description?: string | null;
  schema_data: FormSchema;
}

export interface UpdateFormSchemaData {
  name?: string;
  description?: string | null;
  schema_data?: FormSchema;
  is_active?: boolean;
}

// Get the current user ID
async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

// Create a new form schema
export async function createFormSchema(
  data: CreateFormSchemaData
): Promise<FormSchemaRecord> {
  const userId = await getCurrentUserId();

  const { data: result, error } = await supabase
    .from('form_schemas')
    .insert({
      name: data.name,
      description: data.description,
      schema_data: data.schema_data,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating form schema:', error);
    throw new Error(`Failed to create form schema: ${error.message}`);
  }

  return result;
}

// Get a form schema by ID
export async function getFormSchema(
  id: string
): Promise<FormSchemaRecord | null> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching form schema:', error);
    throw new Error(`Failed to fetch form schema: ${error.message}`);
  }

  return data;
}

// Get the active form schema by name
export async function getActiveFormSchema(
  name: string
): Promise<FormSchemaRecord | null> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('name', name)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching active form schema:', error);
    throw new Error(`Failed to fetch active form schema: ${error.message}`);
  }

  return data;
}

// Update an existing form schema
export async function updateFormSchema(
  id: string,
  data: UpdateFormSchemaData
): Promise<FormSchemaRecord> {
  const { data: result, error } = await supabase
    .from('form_schemas')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating form schema:', error);
    throw new Error(`Failed to update form schema: ${error.message}`);
  }

  return result;
}

// Create a new version of a form schema
export async function createNewVersion(
  id: string,
  data: UpdateFormSchemaData
): Promise<FormSchemaRecord> {
  // First, get the current schema to increment version
  const current = await getFormSchema(id);
  if (!current) {
    throw new Error('Form schema not found');
  }

  // Deactivate the current version
  await updateFormSchema(id, { is_active: false });

  // Create a new version
  const newVersion = await createFormSchema({
    name: data.name || current.name,
    description: data.description ?? current.description,
    schema_data: data.schema_data || current.schema_data,
  });

  return newVersion;
}

// List all form schemas for the current user
export async function listFormSchemas(): Promise<FormSchemaRecord[]> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing form schemas:', error);
    throw new Error(`Failed to list form schemas: ${error.message}`);
  }

  return data || [];
}

// Delete a form schema (soft delete by setting is_active to false)
export async function deleteFormSchema(id: string): Promise<void> {
  const { error } = await supabase
    .from('form_schemas')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting form schema:', error);
    throw new Error(`Failed to delete form schema: ${error.message}`);
  }
}

// Hard delete a form schema (use with caution)
export async function hardDeleteFormSchema(id: string): Promise<void> {
  const { error } = await supabase.from('form_schemas').delete().eq('id', id);

  if (error) {
    console.error('Error hard deleting form schema:', error);
    throw new Error(`Failed to hard delete form schema: ${error.message}`);
  }
}
