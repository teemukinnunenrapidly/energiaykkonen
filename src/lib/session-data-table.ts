/**
 * Comprehensive Session Data Table
 * 
 * Like a waiter collecting information - this stores:
 * 1. Field values from form inputs
 * 2. Calculated values from formulas
 * 3. Conditional lookup results based on collected data
 * 4. All are available for lookups during calculations
 */

import { processLookupShortcode } from './conditional-lookup';

export interface SessionFieldData {
  fieldName: string;
  value: any;
  timestamp: string;
}

export interface SessionCalculationData {
  formulaName: string;
  value: number;
  unit?: string;
  timestamp: string;
}

export interface SessionDataTable {
  sessionId: string;
  fields: Map<string, SessionFieldData>;
  calculations: Map<string, SessionCalculationData>;
}

/**
 * Dependency tracking for smart invalidation
 * Maps calculation names to their field/calculation dependencies
 */
export interface DependencyMap {
  [calculationName: string]: {
    fields: string[];        // Field dependencies like ['neliot', 'huonekorkeus']
    calculations: string[];  // Calculation dependencies like ['Energy kwh']
  };
}

// Global dependency registry - can be populated from database or config
const dependencyRegistry = new Map<string, DependencyMap>();

/**
 * Auto-discovered dependencies from formula analysis
 * This gets populated when formulas are processed
 */
const autodiscoveredDependencies = new Map<string, { fields: Set<string>; calculations: Set<string> }>();

/**
 * Global session data tables
 * Key: sessionId, Value: SessionDataTable
 */
const sessionTables = new Map<string, SessionDataTable>();

/**
 * Invalidation tracking per session
 * Key: sessionId, Value: Set of calculation names that need recalculation
 */
const invalidationQueue = new Map<string, Set<string>>();

/**
 * Get or create session data table
 */
export function getSessionTable(sessionId: string): SessionDataTable {
  if (!sessionTables.has(sessionId)) {
    sessionTables.set(sessionId, {
      sessionId,
      fields: new Map<string, SessionFieldData>(),
      calculations: new Map<string, SessionCalculationData>()
    });
    console.log(`📋 [SESSION] Created new session table: ${sessionId}`);
  }
  return sessionTables.get(sessionId)!;
}

/**
 * Store field value in session (like a waiter writing down the order)
 * Now includes smart dependency tracking
 */
export function storeSessionField(sessionId: string, fieldName: string, value: any): void {
  const table = getSessionTable(sessionId);
  const key = fieldName.toLowerCase();
  
  // Check if this field value actually changed
  const existing = table.fields.get(key);
  const hasChanged = !existing || existing.value !== value;
  
  table.fields.set(key, {
    fieldName,
    value,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📋 [SESSION FIELD] Stored: "${fieldName}" = ${value}`);
  
  // If field changed, invalidate dependent calculations
  if (hasChanged) {
    invalidateDependentCalculations(sessionId, fieldName, 'field');
  }
}

/**
 * Store calculation result in session
 * Now includes dependency discovery
 */
export function storeSessionCalculation(sessionId: string, formulaName: string, value: number, unit?: string): void {
  const table = getSessionTable(sessionId);
  const key = formulaName.toLowerCase();
  
  // Check if this calculation value actually changed
  const existing = table.calculations.get(key);
  const hasChanged = !existing || existing.value !== value;
  
  table.calculations.set(key, {
    formulaName,
    value,
    unit,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📋 [SESSION CALC] Stored: "${formulaName}" = ${value} ${unit || ''}`);
  
  // If calculation changed, invalidate dependent calculations
  if (hasChanged) {
    invalidateDependentCalculations(sessionId, formulaName, 'calculation');
  }
}

/**
 * Get field value from session
 */
export function getSessionField(sessionId: string, fieldName: string): any {
  const table = getSessionTable(sessionId);
  const key = fieldName.toLowerCase();
  const field = table.fields.get(key);
  
  if (field) {
    console.log(`📋 [SESSION FIELD] Found: "${fieldName}" = ${field.value}`);
    return field.value;
  }
  
  console.log(`📋 [SESSION FIELD] Not found: "${fieldName}"`);
  return undefined;
}

/**
 * Get calculation value from session
 */
export function getSessionCalculation(sessionId: string, formulaName: string): SessionCalculationData | null {
  const table = getSessionTable(sessionId);
  const key = formulaName.toLowerCase();
  const calc = table.calculations.get(key);
  
  if (calc) {
    console.log(`📋 [SESSION CALC] Found: "${formulaName}" = ${calc.value} ${calc.unit || ''}`);
    return calc;
  }
  
  console.log(`📋 [SESSION CALC] Not found: "${formulaName}"`);
  return null;
}

/**
 * Update session with all current form data
 */
export function updateSessionWithFormData(sessionId: string, formData: Record<string, any>): void {
  console.log(`📋 [SESSION] Updating with form data:`, formData);
  
  for (const [fieldName, value] of Object.entries(formData)) {
    if (value !== undefined && value !== null && value !== '') {
      storeSessionField(sessionId, fieldName, value);
    }
  }
}

/**
 * Process formula with session data (fields, calculations, and lookups)
 */
export async function processFormulaWithSession(
  formulaText: string, 
  sessionId: string
): Promise<{ success: boolean; processedFormula?: string; error?: string }> {
  try {
    console.log(`📋 [SESSION] Processing formula: "${formulaText}"`);
    
    let processedFormula = formulaText;
    
    // Replace [field:xxx] references with session field values
    const fieldReferences = formulaText.match(/\[field:([^\]]+)\]/g) || [];
    console.log(`📋 [SESSION] Found field references:`, fieldReferences);
    
    for (const ref of fieldReferences) {
      const fieldName = ref.replace(/\[field:([^\]]+)\]/, '$1').trim();
      const fieldValue = getSessionField(sessionId, fieldName);
      
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return {
          success: false,
          error: `Field '${fieldName}' is required but has no value`
        };
      }
      
      // Convert to number for calculation
      const numericValue = Number(fieldValue);
      if (isNaN(numericValue)) {
        return {
          success: false,
          error: `Field '${fieldName}' contains non-numeric value: '${fieldValue}'`
        };
      }
      
      // Replace field reference with numeric value
      const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedFormula = processedFormula.replace(new RegExp(escaped, 'g'), numericValue.toString());
      console.log(`📋 [SESSION] Replaced "${ref}" with "${numericValue}": "${processedFormula}"`);
    }
    
    // Replace [lookup:xxx] references with conditional lookups
    const lookupReferences = processedFormula.match(/\[lookup:([^\]]+)\]/g) || [];
    console.log(`📋 [SESSION] Found lookup references:`, lookupReferences);
    
    for (const ref of lookupReferences) {
      const lookupName = ref.replace(/\[lookup:([^\]]+)\]/, '$1').trim();
      console.log(`📋 [SESSION] Processing lookup: "${lookupName}"`);
      
      // Get current session data to pass as form data
      const { fields } = getSessionSummary(sessionId);
      const lookupResult = await processLookupShortcode(lookupName, sessionId, fields);
      
      if (!lookupResult.success) {
        return {
          success: false,
          error: `Lookup failed for "${lookupName}": ${lookupResult.error}`
        };
      }
      
      // Replace lookup reference with the returned shortcode
      const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedFormula = processedFormula.replace(new RegExp(escaped, 'g'), lookupResult.shortcode!);
      console.log(`📋 [SESSION] Replaced "${ref}" with "${lookupResult.shortcode}": "${processedFormula}"`);
    }
    
    // Replace [calc:xxx] references with session calculation values
    const calcReferences = processedFormula.match(/\[calc:([^\]]+)\]/g) || [];
    console.log(`📋 [SESSION] Found calc references:`, calcReferences);
    
    for (const ref of calcReferences) {
      const formulaName = ref.replace(/\[calc:([^\]]+)\]/, '$1').trim();
      const calcData = getSessionCalculation(sessionId, formulaName);
      
      if (!calcData) {
        // Instead of failing immediately, mark this calculation as needing the dependency
        console.log(`⚠️ [SESSION] Dependency "${formulaName}" not yet calculated, deferring this calculation`);
        return {
          success: false,
          error: `Dependency calculation "${formulaName}" not yet available. This calculation will retry when the dependency is ready.`
        };
      }
      
      // Replace calc reference with numeric value
      const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const replacementValue = calcData.value.toString();
      console.log(`📋 [SESSION DEBUG] About to replace:`, {
        original: ref,
        escaped: escaped,
        replacementValue: replacementValue,
        beforeReplacement: processedFormula,
        calcDataValue: calcData.value,
        calcDataType: typeof calcData.value
      });
      
      // Use a more precise replacement to avoid regex issues with special characters
      processedFormula = processedFormula.replace(ref, replacementValue);
      console.log(`📋 [SESSION] Replaced "${ref}" with "${replacementValue}": "${processedFormula}"`);
    }
    
    console.log(`📋 [SESSION] Final processed formula: "${processedFormula}"`);
    
    // Auto-discover dependencies from the original formula
    discoverDependenciesFromFormula('unknown-formula', formulaText);
    
    return {
      success: true,
      processedFormula
    };
    
  } catch (error) {
    console.error('Error processing formula with session:', error);
    return {
      success: false,
      error: `Failed to process formula: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Evaluate processed formula safely
 */
export function evaluateProcessedFormula(processedFormula: string): { success: boolean; result?: number; error?: string } {
  try {
    console.log(`📋 [SESSION] Evaluating: "${processedFormula}"`);
    
    // Trim whitespace
    const trimmedFormula = processedFormula.trim();
    
    // Check for empty formula
    if (!trimmedFormula) {
      return {
        success: false,
        error: 'Empty formula cannot be evaluated'
      };
    }
    
    // Check for unbalanced parentheses
    const openParens = (trimmedFormula.match(/\(/g) || []).length;
    const closeParens = (trimmedFormula.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return {
        success: false,
        error: `Unbalanced parentheses in formula: ${trimmedFormula}`
      };
    }
    
    // Validate expression contains only safe mathematical characters
    if (!/^[0-9+\-*/().\s]+$/.test(trimmedFormula)) {
      // Log the specific invalid characters for debugging
      const invalidChars = trimmedFormula.match(/[^0-9+\-*/().\s]/g);
      console.error(`📋 [SESSION] Invalid characters found:`, invalidChars);
      return {
        success: false,
        error: `Invalid characters in processed formula: ${trimmedFormula}. Found: ${invalidChars?.join(', ')}`
      };
    }
    
    // Check for consecutive operators which could cause syntax errors
    if (/[+\-*/]{2,}/.test(trimmedFormula)) {
      return {
        success: false,
        error: `Consecutive operators detected in formula: ${trimmedFormula}`
      };
    }
    
    // Evaluate using Function constructor (safe)
    const result = new Function('return ' + trimmedFormula)();
    
    if (typeof result !== 'number' || isNaN(result)) {
      return {
        success: false,
        error: `Formula did not evaluate to a valid number. Result: ${result} (type: ${typeof result})`
      };
    }
    
    // Check for infinite or extremely large results
    if (!isFinite(result)) {
      return {
        success: false,
        error: 'Formula result is infinite or not a finite number'
      };
    }
    
    console.log(`📋 [SESSION] Evaluation result: ${result}`);
    
    return {
      success: true,
      result
    };
    
  } catch (error) {
    console.error('📋 [SESSION] Formula evaluation error:', error);
    return {
      success: false,
      error: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Formula: "${processedFormula}"`
    };
  }
}

/**
 * Get session summary for debugging
 */
export function getSessionSummary(sessionId: string): { fields: Record<string, any>; calculations: Record<string, SessionCalculationData> } {
  const table = getSessionTable(sessionId);
  
  const fields: Record<string, any> = {};
  table.fields.forEach((data, key) => {
    fields[key] = data.value;
  });
  
  const calculations: Record<string, SessionCalculationData> = {};
  table.calculations.forEach((data, key) => {
    calculations[key] = data;
  });
  
  return { fields, calculations };
}

/**
 * Clear session data
 */
export function clearSession(sessionId: string): void {
  sessionTables.delete(sessionId);
  invalidationQueue.delete(sessionId);
  console.log(`📋 [SESSION] Cleared session: ${sessionId}`);
}

/**
 * Dependency Management Functions
 */

/**
 * Register dependencies for a calculation
 */
export function registerDependencies(calculationName: string, dependencies: { fields?: string[]; calculations?: string[] }): void {
  const sessionId = 'global'; // For now, use global registry
  
  if (!dependencyRegistry.has(sessionId)) {
    dependencyRegistry.set(sessionId, {});
  }
  
  const registry = dependencyRegistry.get(sessionId)!;
  registry[calculationName] = {
    fields: dependencies.fields || [],
    calculations: dependencies.calculations || []
  };
  
  console.log(`🔗 [DEPENDENCIES] Registered for "${calculationName}":`, dependencies);
}

/**
 * Auto-discover dependencies from formula text
 */
export function discoverDependenciesFromFormula(formulaName: string, formulaText: string): void {
  const fields = new Set<string>();
  const calculations = new Set<string>();
  
  // Extract [field:xxx] references
  const fieldMatches = formulaText.match(/\[field:([^\]]+)\]/g) || [];
  fieldMatches.forEach(match => {
    const fieldName = match.replace(/\[field:([^\]]+)\]/, '$1').trim();
    fields.add(fieldName);
  });
  
  // Extract [calc:xxx] references  
  const calcMatches = formulaText.match(/\[calc:([^\]]+)\]/g) || [];
  calcMatches.forEach(match => {
    const calcName = match.replace(/\[calc:([^\]]+)\]/, '$1').trim();
    calculations.add(calcName);
  });
  
  // Extract [lookup:xxx] references (these can indirectly depend on fields)
  const lookupMatches = formulaText.match(/\[lookup:([^\]]+)\]/g) || [];
  if (lookupMatches.length > 0) {
    // Lookups typically depend on 'valitse' field for heating type selection
    fields.add('valitse');
  }
  
  autodiscoveredDependencies.set(formulaName, { fields, calculations });
  
  console.log(`🔍 [AUTO-DISCOVER] Dependencies for "${formulaName}":`, {
    fields: Array.from(fields),
    calculations: Array.from(calculations)
  });
}

/**
 * Discover dependencies from lookup conditions
 * Analyzes lookup table conditions to find field dependencies
 */
export async function discoverDependenciesFromLookup(lookupName: string): Promise<void> {
  try {
    const { getFormulaLookupByName } = await import('./formula-lookup-service');
    
    // Attempt to get the lookup table, but handle errors gracefully
    let lookupTable;
    try {
      lookupTable = await getFormulaLookupByName(lookupName);
    } catch (error) {
      console.log(`🔍 [DEPS] Database error fetching lookup "${lookupName}":`, error instanceof Error ? error.message : 'Unknown error');
      // Fallback: For "Menekki" lookup, we know it depends on the heating type field
      if (lookupName.toLowerCase() === 'menekki') {
        console.log(`🔍 [DEPS] Using fallback dependencies for Menekki lookup`);
        autodiscoveredDependencies.set(lookupName, { 
          fields: new Set(['valitse']), 
          calculations: new Set() 
        });
      }
      return;
    }
    
    if (!lookupTable || !lookupTable.conditions) {
      console.log(`🔍 [DEPS] No lookup table found for: ${lookupName}`);
      // Fallback for common lookup names
      if (lookupName.toLowerCase() === 'menekki') {
        console.log(`🔍 [DEPS] Using fallback dependencies for Menekki lookup`);
        autodiscoveredDependencies.set(lookupName, { 
          fields: new Set(['valitse']), 
          calculations: new Set() 
        });
      }
      return;
    }
    
    const fields = new Set<string>();
    const calculations = new Set<string>();
    
    // Analyze each condition to find dependencies
    for (const condition of lookupTable.conditions) {
      if (!condition.is_active) continue;
      
      // Extract field references from condition rules
      const fieldMatches = condition.condition_rule.match(/\[field:([^\]]+)\]/g) || [];
      fieldMatches.forEach(match => {
        const fieldName = match.replace(/\[field:([^\]]+)\]/, '$1').trim();
        fields.add(fieldName);
      });
      
      // Extract calc references from condition rules
      const calcMatches = condition.condition_rule.match(/\[calc:([^\]]+)\]/g) || [];
      calcMatches.forEach(match => {
        const calcName = match.replace(/\[calc:([^\]]+)\]/, '$1').trim();
        calculations.add(calcName);
      });
      
      // Also check the target shortcode for dependencies
      if (condition.target_shortcode) {
        const targetFieldMatches = condition.target_shortcode.match(/\[field:([^\]]+)\]/g) || [];
        targetFieldMatches.forEach(match => {
          const fieldName = match.replace(/\[field:([^\]]+)\]/, '$1').trim();
          fields.add(fieldName);
        });
        
        const targetCalcMatches = condition.target_shortcode.match(/\[calc:([^\]]+)\]/g) || [];
        targetCalcMatches.forEach(match => {
          const calcName = match.replace(/\[calc:([^\]]+)\]/, '$1').trim();
          calculations.add(calcName);
        });
      }
    }
    
    // Store discovered dependencies
    if (fields.size > 0 || calculations.size > 0) {
      autodiscoveredDependencies.set(lookupName, { fields, calculations });
      
      console.log(`🔍 [DEPS] Auto-discovered for lookup "${lookupName}": fields=${Array.from(fields).join(', ')}, calcs=${Array.from(calculations).join(', ')}`);
    }
  } catch (error) {
    console.error(`Failed to discover dependencies for lookup ${lookupName}:`, error);
  }
}

/**
 * Invalidate calculations that depend on a changed field or calculation
 */
function invalidateDependentCalculations(sessionId: string, changedItem: string, itemType: 'field' | 'calculation'): void {
  const dependents = findDependentCalculations(changedItem, itemType);
  
  if (dependents.length === 0) {
    console.log(`🔗 [DEPENDENCIES] No dependents found for ${itemType} "${changedItem}"`);
    return;
  }
  
  // Add to invalidation queue
  if (!invalidationQueue.has(sessionId)) {
    invalidationQueue.set(sessionId, new Set());
  }
  
  const queue = invalidationQueue.get(sessionId)!;
  dependents.forEach(dependent => queue.add(dependent));
  
  console.log(`🔄 [INVALIDATION] Queued for recalculation due to ${itemType} "${changedItem}":`, dependents);
}

/**
 * Find calculations that depend on a specific field or calculation
 */
function findDependentCalculations(changedItem: string, itemType: 'field' | 'calculation'): string[] {
  const dependents: string[] = [];
  const changedItemLower = changedItem.toLowerCase();
  
  // Check registered dependencies
  dependencyRegistry.forEach(registry => {
    Object.entries(registry).forEach(([calcName, deps]) => {
      const shouldInvalidate = itemType === 'field' 
        ? deps.fields.some(field => field.toLowerCase() === changedItemLower)
        : deps.calculations.some(calc => calc.toLowerCase() === changedItemLower);
        
      if (shouldInvalidate) {
        dependents.push(calcName);
      }
    });
  });
  
  // Check auto-discovered dependencies
  autodiscoveredDependencies.forEach((deps, calcName) => {
    const shouldInvalidate = itemType === 'field'
      ? Array.from(deps.fields).some(field => field.toLowerCase() === changedItemLower)
      : Array.from(deps.calculations).some(calc => calc.toLowerCase() === changedItemLower);
      
    if (shouldInvalidate && !dependents.includes(calcName)) {
      dependents.push(calcName);
    }
  });
  
  return dependents;
}

/**
 * Check if a calculation needs to be recalculated
 */
export function needsRecalculation(sessionId: string, calculationName: string): boolean {
  const queue = invalidationQueue.get(sessionId);
  return queue?.has(calculationName) || false;
}

/**
 * Mark a calculation as up-to-date (remove from invalidation queue)
 */
export function markCalculationCurrent(sessionId: string, calculationName: string): void {
  const queue = invalidationQueue.get(sessionId);
  if (queue) {
    queue.delete(calculationName);
    console.log(`✅ [INVALIDATION] Marked "${calculationName}" as current`);
  }
}

/**
 * Get dependency statistics for debugging
 */
export function getDependencyStats(): {
  registeredDependencies: number;
  autodiscoveredDependencies: number;
  totalInvalidationQueues: number;
} {
  let totalRegistered = 0;
  dependencyRegistry.forEach(registry => {
    totalRegistered += Object.keys(registry).length;
  });
  
  return {
    registeredDependencies: totalRegistered,
    autodiscoveredDependencies: autodiscoveredDependencies.size,
    totalInvalidationQueues: invalidationQueue.size
  };
}

/**
 * Initialize common calculation dependencies
 * This can be called on app startup or loaded from database
 */
export function initializeCommonDependencies(): void {
  // Energy calculation dependencies
  registerDependencies('Laskennallinen energiantarve (kwh)', {
    fields: ['neliot', 'huonekorkeus'],
    calculations: []
  });
  
  // Oil consumption depends on energy calculation and heating type
  registerDependencies('Öljyn menekki vuodessa', {
    fields: ['valitse'],
    calculations: ['Laskennallinen energiantarve (kwh)']
  });
  
  // Electric consumption
  registerDependencies('Sähkön kulutus vuodessa', {
    fields: ['valitse'],
    calculations: ['Laskennallinen energiantarve (kwh)']
  });
  
  // Savings calculations depend on consumption calculations
  registerDependencies('Vuosittainen säästö', {
    fields: ['valitse'],
    calculations: ['Öljyn menekki vuodessa', 'Sähkön kulutus vuodessa']
  });
  
  console.log('🚀 [DEPENDENCIES] Initialized common calculation dependencies');
}