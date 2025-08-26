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

// Create a new form schema
export async function createFormSchema(
  data: CreateFormSchemaData
): Promise<FormSchemaRecord> {
  const response = await fetch('/api/admin/form-schemas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to create form schema: ${errorData.error || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

// Get a form schema by ID
export async function getFormSchema(
  id: string
): Promise<FormSchemaRecord | null> {
  // For now, we'll use the list endpoint and filter by ID
  // This can be optimized later by adding an ID parameter to the API
  const schemas = await listFormSchemas();
  return schemas.find(schema => schema.id === id) || null;
}

// Get the active form schema by name
export async function getActiveFormSchema(
  name: string
): Promise<FormSchemaRecord | null> {
  const response = await fetch(
    `/api/admin/form-schemas?name=${encodeURIComponent(name)}&is_active=true`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to fetch active form schema: ${errorData.error || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data?.[0] || null;
}

// Update an existing form schema
export async function updateFormSchema(
  id: string,
  data: UpdateFormSchemaData
): Promise<FormSchemaRecord> {
  const response = await fetch('/api/admin/form-schemas', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to update form schema: ${errorData.error || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
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
  const response = await fetch('/api/admin/form-schemas');

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to list form schemas: ${errorData.error || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data || [];
}

// Delete a form schema (soft delete by setting is_active to false)
export async function deleteFormSchema(id: string): Promise<void> {
  await updateFormSchema(id, { is_active: false });
}
