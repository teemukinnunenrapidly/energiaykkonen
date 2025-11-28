/**
 * Enhanced Lookup Management Service
 *
 * This service provides CRUD operations for managing enhanced lookups,
 * rules, and defaults through the admin interface.
 */

import { supabase } from '@/lib/supabase';
import type {
  EnhancedLookup,
  LookupRule,
  LookupDefault,
  ConditionLogic,
  ActionConfig,
  ActionType,
} from './enhanced-lookup-engine';

// ========================================
// LOOKUP MANAGEMENT
// ========================================

export interface CreateLookupRequest {
  name: string;
  title: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateLookupRequest extends CreateLookupRequest {
  id: string;
}

export async function createEnhancedLookup(
  request: CreateLookupRequest
): Promise<EnhancedLookup> {
  const { data, error } = await supabase
    .from('enhanced_lookups')
    .insert({
      name: request.name,
      title: request.title,
      description: request.description,
      is_active: request.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create enhanced lookup: ${error.message}`);
  }

  return data;
}

export async function updateEnhancedLookup(
  request: UpdateLookupRequest
): Promise<EnhancedLookup> {
  const { data, error } = await supabase
    .from('enhanced_lookups')
    .update({
      name: request.name,
      title: request.title,
      description: request.description,
      is_active: request.is_active,
    })
    .eq('id', request.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update enhanced lookup: ${error.message}`);
  }

  return data;
}

export async function deleteEnhancedLookup(id: string): Promise<void> {
  const { error } = await supabase
    .from('enhanced_lookups')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete enhanced lookup: ${error.message}`);
  }
}

export async function getEnhancedLookups(): Promise<EnhancedLookup[]> {
  const { data, error } = await supabase
    .from('enhanced_lookups')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch enhanced lookups: ${error.message}`);
  }

  return data || [];
}

export async function getEnhancedLookupById(
  id: string
): Promise<EnhancedLookup | null> {
  const { data, error } = await supabase
    .from('enhanced_lookups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    } // Not found
    throw new Error(`Failed to fetch enhanced lookup: ${error.message}`);
  }

  return data;
}

// ========================================
// RULE MANAGEMENT
// ========================================

export interface CreateRuleRequest {
  lookup_id: string;
  name: string;
  description?: string;
  order_index: number;
  condition_logic: ConditionLogic;
  action_type: ActionType;
  action_config: ActionConfig;
  is_active?: boolean;
}

export interface UpdateRuleRequest extends CreateRuleRequest {
  id: string;
}

export async function createLookupRule(
  request: CreateRuleRequest
): Promise<LookupRule> {
  const { data, error } = await supabase
    .from('enhanced_lookup_rules')
    .insert({
      lookup_id: request.lookup_id,
      name: request.name,
      description: request.description,
      order_index: request.order_index,
      condition_logic: request.condition_logic,
      action_type: request.action_type,
      action_config: request.action_config,
      is_active: request.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lookup rule: ${error.message}`);
  }

  return data;
}

export async function updateLookupRule(
  request: UpdateRuleRequest
): Promise<LookupRule> {
  const { data, error } = await supabase
    .from('enhanced_lookup_rules')
    .update({
      lookup_id: request.lookup_id,
      name: request.name,
      description: request.description,
      order_index: request.order_index,
      condition_logic: request.condition_logic,
      action_type: request.action_type,
      action_config: request.action_config,
      is_active: request.is_active,
    })
    .eq('id', request.id)
    .select();

  if (error) {
    throw new Error(`Failed to update lookup rule: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No lookup rule found with id: ${request.id}`);
  }

  if (data.length > 1) {
    throw new Error(`Multiple lookup rules found with id: ${request.id}`);
  }

  return data[0];
}

export async function deleteLookupRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('enhanced_lookup_rules')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete lookup rule: ${error.message}`);
  }
}

export async function getLookupRules(lookupId: string): Promise<LookupRule[]> {
  const { data, error } = await supabase
    .from('enhanced_lookup_rules')
    .select('*')
    .eq('lookup_id', lookupId)
    .order('order_index');

  if (error) {
    throw new Error(`Failed to fetch lookup rules: ${error.message}`);
  }

  return data || [];
}

export async function reorderLookupRules(
  lookupId: string,
  ruleIds: string[]
): Promise<void> {
  // Update order_index for all rules based on array position
  const updates = ruleIds.map((ruleId, index) =>
    supabase
      .from('enhanced_lookup_rules')
      .update({ order_index: index + 1 })
      .eq('id', ruleId)
      .eq('lookup_id', lookupId)
  );

  const results = await Promise.allSettled(updates);
  const failures = results.filter(result => result.status === 'rejected');

  if (failures.length > 0) {
    throw new Error(`Failed to reorder ${failures.length} lookup rules`);
  }
}

// ========================================
// DEFAULT ACTION MANAGEMENT
// ========================================

export interface CreateDefaultRequest {
  lookup_id: string;
  action_type: ActionType;
  action_config: ActionConfig;
}

export interface UpdateDefaultRequest extends CreateDefaultRequest {
  id: string;
}

export async function createLookupDefault(
  request: CreateDefaultRequest
): Promise<LookupDefault> {
  const { data, error } = await supabase
    .from('enhanced_lookup_defaults')
    .insert({
      lookup_id: request.lookup_id,
      action_type: request.action_type,
      action_config: request.action_config,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lookup default: ${error.message}`);
  }

  return data;
}

export async function updateLookupDefault(
  request: UpdateDefaultRequest
): Promise<LookupDefault> {
  const { data, error } = await supabase
    .from('enhanced_lookup_defaults')
    .update({
      action_type: request.action_type,
      action_config: request.action_config,
    })
    .eq('id', request.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lookup default: ${error.message}`);
  }

  return data;
}

export async function getLookupDefault(
  lookupId: string
): Promise<LookupDefault | null> {
  const { data, error } = await supabase
    .from('enhanced_lookup_defaults')
    .select('*')
    .eq('lookup_id', lookupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    } // Not found
    // Handle cases where error might be empty object (seen in logs)
    if (Object.keys(error).length === 0 || (!error.code && !error.message)) {
      return null;
    }
    throw new Error(`Failed to fetch lookup default: ${error.message}`);
  }

  return data;
}

// ========================================
// ANALYTICS & DEBUGGING
// ========================================

export interface LookupAnalytics {
  lookup_name: string;
  lookup_title: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  default_used_count: number;
  avg_execution_time_ms: number;
  last_execution: string | null;
}

export async function getLookupAnalytics(
  lookupId?: string,
  days: number = 30
): Promise<LookupAnalytics[]> {
  let query = supabase.from('enhanced_lookup_analytics').select('*');

  if (lookupId) {
    // Need to join to get specific lookup
    query = supabase
      .from('enhanced_lookup_executions')
      .select(
        `
        enhanced_lookups!inner(name, title),
        *
      `
      )
      .eq('lookup_id', lookupId)
      .gte(
        'created_at',
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch lookup analytics: ${error.message}`);
  }

  return data || [];
}

export interface LookupExecution {
  id: string;
  session_id: string;
  lookup_name: string;
  input_values: Record<string, any>;
  matched_rule_id?: string;
  used_default: boolean;
  result_value: any;
  result_error?: string;
  execution_time_ms: number;
  created_at: string;
}

export async function getLookupExecutions(
  lookupId: string,
  limit: number = 100
): Promise<LookupExecution[]> {
  const { data, error } = await supabase
    .from('enhanced_lookup_executions')
    .select('*')
    .eq('lookup_id', lookupId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch lookup executions: ${error.message}`);
  }

  return data || [];
}

// ========================================
// TESTING & VALIDATION
// ========================================

export interface TestLookupRequest {
  lookup_name: string;
  test_data: Record<string, any>;
}

export async function testLookup(request: TestLookupRequest) {
  const { testEnhancedLookup } = await import('./enhanced-lookup-engine');
  return await testEnhancedLookup(request.lookup_name, request.test_data);
}

// ========================================
// TEMPLATE BUILDERS
// ========================================

/**
 * Create standard condition templates for common use cases
 */
export const ConditionTemplates = {
  equals: (field: string, value: any): ConditionLogic => ({
    type: 'AND',
    conditions: [{ field, operator: 'equals', value }],
  }),

  range: (field: string, min: number, max: number): ConditionLogic => ({
    type: 'AND',
    conditions: [
      { field, operator: 'greater_than_or_equal', value: min },
      { field, operator: 'less_than_or_equal', value: max },
    ],
  }),

  multipleFields: (
    conditions: Array<{ field: string; operator: string; value: any }>
  ): ConditionLogic => ({
    type: 'AND',
    conditions: conditions.map(c => ({
      field: c.field,
      operator: c.operator as any,
      value: c.value,
    })),
  }),

  anyOf: (field: string, values: any[]): ConditionLogic => ({
    type: 'AND',
    conditions: [{ field, operator: 'in', value: values }],
  }),
};

/**
 * Create standard action templates
 */
export const ActionTemplates = {
  staticValue: (value: any): ActionConfig => ({ value }),

  formula: (formulaText: string, unit?: string): ActionConfig => ({
    formula_text: formulaText,
    unit,
  }),

  lookupTable: (
    tableName: string,
    keyField: string,
    valueField: string
  ): ActionConfig => ({
    lookup_table: tableName,
    key_field: keyField,
    value_field: valueField,
  }),

  error: (message: string): ActionConfig => ({ message }),
};
