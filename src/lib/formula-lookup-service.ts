/**
 * Formula Lookup Service
 * Manages database operations for admin-created conditional lookup tables
 */

import { supabase } from './supabase';

export interface FormulaLookup {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  conditions?: FormulaLookupCondition[];
}

export interface FormulaLookupCondition {
  id: string;
  lookup_id: string;
  condition_order: number;
  condition_rule: string; // e.g., "[field:heating_type] == 'oil'"
  target_shortcode: string; // e.g., "[calc:oil-heating-formula]"
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateFormulaLookupRequest {
  name: string;
  description?: string;
  conditions: {
    condition_rule: string;
    target_shortcode: string;
    description?: string;
  }[];
}

/**
 * Get all formula lookups with their conditions
 */
export async function getFormulaLookups(): Promise<FormulaLookup[]> {
  const { data, error } = await supabase
    .from('formula_lookups')
    .select(
      `
      *,
      formula_lookup_conditions (*)
    `
    )
    .order('name');

  if (error) {
    console.error('Error fetching formula lookups:', error);
    throw error;
  }

  return (
    data?.map(lookup => ({
      ...lookup,
      conditions:
        lookup.formula_lookup_conditions?.sort(
          (a: any, b: any) => a.condition_order - b.condition_order
        ) || [],
    })) || []
  );
}

/**
 * Get a single formula lookup by name
 */
export async function getFormulaLookupByName(
  name: string
): Promise<FormulaLookup | null> {
  const { data, error } = await supabase
    .from('formula_lookups')
    .select(
      `
      *,
      formula_lookup_conditions (*)
    `
    )
    .eq('name', name)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    // Handle cases where error might be empty object (seen in logs)
    if (Object.keys(error).length === 0 || (!error.code && !error.message)) {
      console.warn(
        'Empty error received fetching formula lookup, treating as not found:',
        name
      );
      return null;
    }
    console.error('Error fetching formula lookup:', error);
    throw error;
  }

  return {
    ...data,
    conditions:
      data.formula_lookup_conditions?.sort(
        (a: any, b: any) => a.condition_order - b.condition_order
      ) || [],
  };
}

/**
 * Create a new formula lookup with conditions
 */
export async function createFormulaLookup(
  request: CreateFormulaLookupRequest
): Promise<FormulaLookup> {
  // First create the lookup table
  const { data: lookup, error: lookupError } = await supabase
    .from('formula_lookups')
    .insert({
      name: request.name,
      description: request.description,
      is_active: true,
    })
    .select()
    .single();

  if (lookupError) {
    console.error('Error creating formula lookup:', lookupError);
    throw lookupError;
  }

  // Then create the conditions
  const conditions = request.conditions.map((condition, index) => ({
    lookup_id: lookup.id,
    condition_order: index + 1,
    condition_rule: condition.condition_rule,
    target_shortcode: condition.target_shortcode,
    description: condition.description,
    is_active: true,
  }));

  const { data: createdConditions, error: conditionsError } = await supabase
    .from('formula_lookup_conditions')
    .insert(conditions)
    .select();

  if (conditionsError) {
    console.error('Error creating lookup conditions:', conditionsError);
    throw conditionsError;
  }

  return {
    ...lookup,
    conditions: createdConditions.sort(
      (a, b) => a.condition_order - b.condition_order
    ),
  };
}

/**
 * Update formula lookup
 */
export async function updateFormulaLookup(
  id: string,
  updates: Partial<CreateFormulaLookupRequest>
): Promise<FormulaLookup> {
  // Update the lookup table
  const { data: lookup, error: lookupError } = await supabase
    .from('formula_lookups')
    .update({
      name: updates.name,
      description: updates.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (lookupError) {
    console.error('Error updating formula lookup:', lookupError);
    throw lookupError;
  }

  // If conditions are provided, replace them
  if (updates.conditions) {
    // Delete existing conditions
    await supabase
      .from('formula_lookup_conditions')
      .delete()
      .eq('lookup_id', id);

    // Create new conditions
    const conditions = updates.conditions.map((condition, index) => ({
      lookup_id: id,
      condition_order: index + 1,
      condition_rule: condition.condition_rule,
      target_shortcode: condition.target_shortcode,
      description: condition.description,
      is_active: true,
    }));

    const { data: createdConditions, error: conditionsError } = await supabase
      .from('formula_lookup_conditions')
      .insert(conditions)
      .select();

    if (conditionsError) {
      console.error('Error updating lookup conditions:', conditionsError);
      throw conditionsError;
    }

    return {
      ...lookup,
      conditions: createdConditions.sort(
        (a, b) => a.condition_order - b.condition_order
      ),
    };
  }

  // Return with existing conditions
  const updated = await getFormulaLookupByName(lookup.name);
  return updated!;
}

/**
 * Delete formula lookup
 */
export async function deleteFormulaLookup(id: string): Promise<void> {
  const { error } = await supabase
    .from('formula_lookups')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting formula lookup:', error);
    throw error;
  }
}

/**
 * Toggle formula lookup active status
 */
export async function toggleFormulaLookupStatus(
  id: string
): Promise<FormulaLookup> {
  // Get current status
  const { data: current, error: fetchError } = await supabase
    .from('formula_lookups')
    .select('is_active, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching current status:', fetchError);
    throw fetchError;
  }

  // Toggle status
  const { data: updated, error: updateError } = await supabase
    .from('formula_lookups')
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error toggling lookup status:', updateError);
    throw updateError;
  }

  const result = await getFormulaLookupByName(updated.name);
  return result!;
}

/**
 * Generate shortcode for formula lookup
 */
export function generateLookupShortcode(lookupName: string): string {
  return `[lookup:${lookupName}]`;
}
