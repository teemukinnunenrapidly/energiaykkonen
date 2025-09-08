/**
 * Enhanced Lookup Engine with Conditional Formula Selection
 *
 * This engine enables rule-based lookups that can:
 * - Evaluate complex conditions against form data
 * - Conditionally select and execute formulas
 * - Return static values or query lookup tables
 * - Provide fallback behavior and error handling
 * - Log execution for debugging and analytics
 */

import { supabase } from '@/lib/supabase';
import { UnifiedCalculationEngine } from './unified-calculation-engine';

// ========================================
// TYPES AND INTERFACES
// ========================================

export interface EnhancedLookup {
  id: string;
  name: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LookupRule {
  id: string;
  lookup_id: string;
  order_index: number;
  name: string;
  description?: string;
  condition_logic: ConditionLogic;
  action_type: ActionType;
  action_config: ActionConfig;
  is_active: boolean;
}

export interface LookupDefault {
  id: string;
  lookup_id: string;
  action_type: ActionType;
  action_config: ActionConfig;
}

export type ActionType = 'formula' | 'value' | 'lookup' | 'error';

export interface ConditionLogic {
  type: 'AND' | 'OR';
  conditions: Condition[];
}

export interface Condition {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in';

export interface ActionConfig {
  // For formula action
  formula_text?: string;
  formula_id?: string;
  unit?: string;

  // For value action
  value?: any;

  // For lookup action
  lookup_table?: string;
  key_field?: string;
  value_field?: string;

  // For error action
  message?: string;
}

export interface LookupExecutionResult {
  success: boolean;
  value?: any;
  numericValue?: number; // Numeric value for calculations
  error?: string;
  matched_rule_id?: string;
  used_default: boolean;
  execution_time_ms: number;
  debug_info?: {
    lookup_name: string;
    input_values: Record<string, any>;
    evaluated_rules: Array<{
      rule_id: string;
      rule_name: string;
      condition_result: boolean;
      condition_details?: any;
    }>;
  };
}

export interface LookupExecutionContext {
  sessionId: string;
  formData: Record<string, any>;
  enableLogging?: boolean;
  enableDebug?: boolean;
}

// ========================================
// ENHANCED LOOKUP ENGINE CLASS
// ========================================

export class EnhancedLookupEngine {
  private static instance: EnhancedLookupEngine;
  private lookupCache: Map<string, EnhancedLookup> = new Map();
  private rulesCache: Map<string, LookupRule[]> = new Map();
  private defaultsCache: Map<string, LookupDefault> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): EnhancedLookupEngine {
    if (!EnhancedLookupEngine.instance) {
      EnhancedLookupEngine.instance = new EnhancedLookupEngine();
    }
    return EnhancedLookupEngine.instance;
  }

  /**
   * Main entry point - execute an enhanced lookup
   */
  public async executeLookup(
    lookupName: string,
    context: LookupExecutionContext
  ): Promise<LookupExecutionResult> {
    const startTime = performance.now();

    try {
      // Ensure cache is fresh
      await this.ensureCacheLoaded();

      // Get lookup definition
      const lookup = this.lookupCache.get(lookupName);
      if (!lookup || !lookup.is_active) {
        return {
          success: false,
          error: `Lookup '${lookupName}' not found or inactive`,
          used_default: false,
          execution_time_ms: performance.now() - startTime,
        };
      }

      // Get rules for this lookup (ordered by order_index)
      const rules = this.rulesCache.get(lookup.id) || [];
      const debugInfo: LookupExecutionResult['debug_info'] = context.enableDebug
        ? {
            lookup_name: lookupName,
            input_values: { ...context.formData },
            evaluated_rules: [],
          }
        : undefined;

      // Evaluate rules in order until one matches
      for (const rule of rules) {
        if (!rule.is_active) {
          continue;
        }

        const conditionResult = this.evaluateCondition(
          rule.condition_logic,
          context.formData
        );

        // Add detailed logging for menekin-hinta lookup
        if (
          lookupName === 'menekin-hinta' ||
          lookupName === 'kokonaismenekki'
        ) {
          console.log(`🔍 Evaluating rule for '${lookupName}':`, {
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority,
            conditionLogic: rule.condition_logic,
            conditionMatches: conditionResult,
            availableFields: Object.keys(context.formData || {}),
            formDataValues: context.formData,
          });
        }

        if (debugInfo) {
          debugInfo.evaluated_rules.push({
            rule_id: rule.id,
            rule_name: rule.name,
            condition_result: conditionResult,
            condition_details: rule.condition_logic,
          });
        }

        if (conditionResult) {
          // Rule matches - execute action
          const actionResult = await this.executeAction(
            rule.action_type,
            rule.action_config,
            context
          );

          const result: LookupExecutionResult = {
            success: actionResult.success,
            value: actionResult.value,
            error: actionResult.error,
            matched_rule_id: rule.id,
            used_default: false,
            execution_time_ms: performance.now() - startTime,
            debug_info: debugInfo,
          };

          // Log execution if enabled
          if (context.enableLogging) {
            await this.logExecution(lookup, result, context);
          }

          return result;
        }
      }

      // No rules matched - use default
      const defaultAction = this.defaultsCache.get(lookup.id);
      if (defaultAction) {
        const actionResult = await this.executeAction(
          defaultAction.action_type,
          defaultAction.action_config,
          context
        );

        const result: LookupExecutionResult = {
          success: actionResult.success,
          value: actionResult.value,
          error: actionResult.error,
          matched_rule_id: undefined,
          used_default: true,
          execution_time_ms: performance.now() - startTime,
          debug_info: debugInfo,
        };

        if (context.enableLogging) {
          await this.logExecution(lookup, result, context);
        }

        return result;
      }

      // No default - return error with debug info
      console.error(`❌ Lookup '${lookupName}' failed:`, {
        availableRules: rules.length,
        formData: context.formData,
        debugInfo: debugInfo,
      });

      return {
        success: false,
        error: `No rules matched for lookup '${lookupName}' and no default action configured`,
        used_default: false,
        execution_time_ms: performance.now() - startTime,
        debug_info: debugInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: `Enhanced lookup execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        used_default: false,
        execution_time_ms: performance.now() - startTime,
      };
    }
  }

  // ========================================
  // CONDITION EVALUATION
  // ========================================

  private evaluateCondition(
    logic: ConditionLogic,
    formData: Record<string, any>
  ): boolean {
    if (!logic.conditions || logic.conditions.length === 0) {
      return true; // Empty condition = always true
    }

    const results = logic.conditions.map(condition =>
      this.evaluateSingleCondition(condition, formData)
    );

    return logic.type === 'AND'
      ? results.every(result => result)
      : results.some(result => result);
  }

  private evaluateSingleCondition(
    condition: Condition,
    formData: Record<string, any>
  ): boolean {
    const fieldValue = formData[condition.field];
    const compareValue = condition.value;

    // Handle null/undefined values
    if (fieldValue === null || fieldValue === undefined) {
      return (
        condition.operator === 'not_equals' || condition.operator === 'not_in'
      );
    }

    switch (condition.operator) {
      case 'equals':
        return fieldValue === compareValue;

      case 'not_equals':
        return fieldValue !== compareValue;

      case 'greater_than':
        return Number(fieldValue) > Number(compareValue);

      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(compareValue);

      case 'less_than':
        return Number(fieldValue) < Number(compareValue);

      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(compareValue);

      case 'contains':
        return String(fieldValue)
          .toLowerCase()
          .includes(String(compareValue).toLowerCase());

      case 'starts_with':
        return String(fieldValue)
          .toLowerCase()
          .startsWith(String(compareValue).toLowerCase());

      case 'ends_with':
        return String(fieldValue)
          .toLowerCase()
          .endsWith(String(compareValue).toLowerCase());

      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);

      case 'not_in':
        return (
          Array.isArray(compareValue) && !compareValue.includes(fieldValue)
        );

      default:
        console.warn(`Unknown condition operator: ${condition.operator}`);
        return false;
    }
  }

  // ========================================
  // ACTION EXECUTION
  // ========================================

  private async executeAction(
    actionType: ActionType,
    config: ActionConfig,
    context: LookupExecutionContext
  ): Promise<{ success: boolean; value?: any; error?: string }> {
    switch (actionType) {
      case 'formula':
        return await this.executeFormulaAction(config, context);

      case 'value':
        return this.executeValueAction(config);

      case 'lookup':
        return await this.executeLookupTableAction(config, context);

      case 'error':
        return {
          success: false,
          error: config.message || 'Lookup resulted in configured error',
        };

      default:
        return {
          success: false,
          error: `Unknown action type: ${actionType}`,
        };
    }
  }

  private async executeFormulaAction(
    config: ActionConfig,
    context: LookupExecutionContext
  ): Promise<{ success: boolean; value?: any; error?: string }> {
    if (!config.formula_text) {
      return {
        success: false,
        error: 'Formula action missing formula_text',
      };
    }

    try {
      // Use UnifiedCalculationEngine to process the formula text which may contain shortcodes
      const engine = new UnifiedCalculationEngine(
        supabase,
        context.sessionId,
        context.formData
      );
      const result = await engine.process(config.formula_text);

      if (result.success && result.result !== undefined) {
        // For lookup results, we need to format the final display with units
        // The result should already contain the properly formatted value with units
        // from the formula's unit field in the database

        // Parse numeric result for potential formatting
        let numericResult: number | undefined;
        const resultString = String(result.result);

        // Try to extract numeric value
        // Handle Finnish locale formatting: spaces are thousand separators, commas are decimal separators
        // Replace spaces (thousand separators) and convert comma to dot for parsing
        const numMatch = resultString
          .replace(/\s/g, '') // Remove spaces (thousand separators)
          .replace(/,/g, '.') // Convert comma (decimal separator) to dot
          .match(/^([+-]?[0-9]*\.?[0-9]+)/);
        if (numMatch) {
          numericResult = parseFloat(numMatch[1]);
        }

        // Get the unit from the formula that was executed
        let finalResult = result.result;
        if (numericResult !== undefined) {
          // Extract formula name from the formula_text to get its unit
          const formulaMatch = config.formula_text?.match(/\[calc:([^\]]+)\]/);
          if (formulaMatch) {
            const formulaName = formulaMatch[1];
            // We need to get the formula's unit from the database
            const { data: formula } = await supabase
              .from('formulas')
              .select('unit')
              .eq('name', formulaName)
              .single();

            if (formula?.unit) {
              finalResult = `${numericResult.toLocaleString('fi-FI')} ${formula.unit}`;
            } else {
              finalResult = numericResult.toLocaleString('fi-FI');
            }
          }
        }

        return {
          success: true,
          value: finalResult,
          numericValue: numericResult, // Add numeric value for calculations
        };
      } else {
        return {
          success: false,
          error: result.error || 'Formula execution failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Formula execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private executeValueAction(config: ActionConfig): {
    success: boolean;
    value?: any;
    error?: string;
  } {
    if (config.value === undefined) {
      return {
        success: false,
        error: 'Value action missing value',
      };
    }

    return {
      success: true,
      value: config.value,
    };
  }

  private async executeLookupTableAction(
    config: ActionConfig,
    context: LookupExecutionContext
  ): Promise<{ success: boolean; value?: any; error?: string }> {
    if (!config.lookup_table || !config.key_field || !config.value_field) {
      return {
        success: false,
        error: 'Lookup table action missing required configuration',
      };
    }

    try {
      const keyValue = context.formData[config.key_field];
      if (keyValue === undefined || keyValue === null) {
        return {
          success: false,
          error: `Key field '${config.key_field}' not found in form data`,
        };
      }

      const { data, error } = await supabase
        .from(config.lookup_table)
        .select(config.value_field)
        .eq(config.key_field, keyValue)
        .single();

      if (error) {
        return {
          success: false,
          error: `Lookup table query failed: ${error.message}`,
        };
      }

      if (!data) {
        return {
          success: false,
          error: `No matching record found in ${config.lookup_table} for ${config.key_field}='${keyValue}'`,
        };
      }

      return {
        success: true,
        value: data[config.value_field as keyof typeof data],
      };
    } catch (error) {
      return {
        success: false,
        error: `Lookup table error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ========================================
  // CACHE MANAGEMENT
  // ========================================

  private async ensureCacheLoaded(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp < this.CACHE_TTL) {
      return; // Cache is still fresh
    }

    await this.loadCache();
    this.cacheTimestamp = now;
  }

  private async loadCache(): Promise<void> {
    try {
      // Load lookups
      const { data: lookups, error: lookupsError } = await supabase
        .from('enhanced_lookups')
        .select('*')
        .eq('is_active', true);

      if (lookupsError) {
        throw lookupsError;
      }

      // Load rules
      const { data: rules, error: rulesError } = await supabase
        .from('enhanced_lookup_rules')
        .select('*')
        .eq('is_active', true)
        .order('lookup_id, order_index');

      if (rulesError) {
        throw rulesError;
      }

      // Load defaults
      const { data: defaults, error: defaultsError } = await supabase
        .from('enhanced_lookup_defaults')
        .select('*');

      if (defaultsError) {
        throw defaultsError;
      }

      // Update caches
      this.lookupCache.clear();
      this.rulesCache.clear();
      this.defaultsCache.clear();

      // Cache lookups by name
      lookups?.forEach(lookup => {
        this.lookupCache.set(lookup.name, lookup);
      });

      // Cache rules by lookup_id
      rules?.forEach(rule => {
        if (!this.rulesCache.has(rule.lookup_id)) {
          this.rulesCache.set(rule.lookup_id, []);
        }
        this.rulesCache.get(rule.lookup_id)!.push(rule);
      });

      // Cache defaults by lookup_id
      defaults?.forEach(defaultAction => {
        this.defaultsCache.set(defaultAction.lookup_id, defaultAction);
      });

      console.log(
        `Enhanced lookup cache loaded: ${lookups?.length || 0} lookups, ${rules?.length || 0} rules, ${defaults?.length || 0} defaults`
      );
    } catch (error) {
      console.error('Failed to load enhanced lookup cache:', error);
      throw error;
    }
  }

  // ========================================
  // EXECUTION LOGGING
  // ========================================

  private async logExecution(
    lookup: EnhancedLookup,
    result: LookupExecutionResult,
    context: LookupExecutionContext
  ): Promise<void> {
    try {
      await supabase.from('enhanced_lookup_executions').insert({
        session_id: context.sessionId,
        lookup_id: lookup.id,
        lookup_name: lookup.name,
        input_values: context.formData,
        matched_rule_id: result.matched_rule_id,
        used_default: result.used_default,
        result_value: result.value,
        result_error: result.error,
        execution_time_ms: Math.round(result.execution_time_ms),
      });
    } catch (error) {
      console.error('Failed to log enhanced lookup execution:', error);
      // Don't throw - logging errors shouldn't break the lookup
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Clear the cache (useful for testing or admin operations)
   */
  public clearCache(): void {
    this.lookupCache.clear();
    this.rulesCache.clear();
    this.defaultsCache.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    lookups: number;
    rules: number;
    defaults: number;
    cacheAge: number;
    isStale: boolean;
  } {
    const now = Date.now();
    return {
      lookups: this.lookupCache.size,
      rules: Array.from(this.rulesCache.values()).reduce(
        (sum, rules) => sum + rules.length,
        0
      ),
      defaults: this.defaultsCache.size,
      cacheAge: now - this.cacheTimestamp,
      isStale: now - this.cacheTimestamp >= this.CACHE_TTL,
    };
  }

  /**
   * Test a lookup with given input (useful for debugging)
   */
  public async testLookup(
    lookupName: string,
    testData: Record<string, any>,
    sessionId: string = 'test'
  ): Promise<LookupExecutionResult> {
    return await this.executeLookup(lookupName, {
      sessionId,
      formData: testData,
      enableDebug: true,
      enableLogging: false,
    });
  }
}

// ========================================
// FACTORY FUNCTIONS & EXPORTS
// ========================================

/**
 * Get the singleton instance of the enhanced lookup engine
 */
export function getEnhancedLookupEngine(): EnhancedLookupEngine {
  return EnhancedLookupEngine.getInstance();
}

/**
 * Execute an enhanced lookup (convenience function)
 */
export async function executeEnhancedLookup(
  lookupName: string,
  sessionId: string,
  formData: Record<string, any>,
  options: {
    enableLogging?: boolean;
    enableDebug?: boolean;
  } = {}
): Promise<LookupExecutionResult> {
  const engine = getEnhancedLookupEngine();
  return await engine.executeLookup(lookupName, {
    sessionId,
    formData,
    enableLogging: options.enableLogging ?? false,
    enableDebug: options.enableDebug ?? false,
  });
}

/**
 * Test an enhanced lookup with debug info (convenience function for development)
 */
export async function testEnhancedLookup(
  lookupName: string,
  testData: Record<string, any>
): Promise<LookupExecutionResult> {
  const engine = getEnhancedLookupEngine();
  return await engine.testLookup(lookupName, testData);
}
