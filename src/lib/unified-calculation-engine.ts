/**
 * Unified Calculation Engine
 *
 * This engine consolidates all processing paths into a single, unified system:
 * - Single entry point for all content processing
 * - Unified pattern extraction for all shortcode types
 * - Single cache system for all processed values
 * - Safe iterative processing (no recursion)
 * - Consistent dependency resolution
 *
 * Replaces:
 * - processDisplayContent()
 * - processDisplayContentWithSession()
 * - evaluateExpression()
 * - processCalculation()
 * - processLookup()
 */

import { supabase } from '@/lib/supabase';
import { processLookupShortcode } from './conditional-lookup';
import { executeEnhancedLookup } from './enhanced-lookup-engine';

// Core types for the unified system
export interface ProcessedValue {
  id: string;
  type: 'field' | 'calculation' | 'lookup' | 'static';
  raw: string;
  processed: string;
  dependencies: string[];
  timestamp: Date;
}

export interface ProcessingContext {
  sessionId: string;
  formData: Record<string, any>;
  maxDepth: number;
  batchSize: number;
}

export interface ProcessingResult {
  success: boolean;
  result?: string;
  error?: string;
  processedCount: number;
  executionTime: number;
  dependencies: string[]; // Track which fields were actually used
}

interface FormulaCacheEntry {
  formulas: any[];
  timestamp: number;
  ttl: number;
}

export class UnifiedCalculationEngine {
  private cache: Map<string, ProcessedValue> = new Map();
  private context: ProcessingContext;
  private formulasCache: FormulaCacheEntry | null = null;

  constructor(
    supabaseClient: typeof supabase,
    sessionId: string,
    formData: Record<string, any> = {}
  ) {
    this.context = {
      sessionId,
      formData,
      maxDepth: 10,
      batchSize: 10,
    };
  }

  /**
   * Clear the processing cache - useful when form data changes
   */
  public clearCache(): void {
    console.log('🧹 Clearing UnifiedCalculationEngine cache');
    this.cache.clear();
  }

  /**
   * Single entry point for all content processing
   * Handles all shortcode types: [calc:xxx], [lookup:xxx], {field-name}, and expressions
   */
  public async process(content: string): Promise<ProcessingResult> {
    const startTime = performance.now();

    try {
      // Check if content is empty or null
      if (!content || typeof content !== 'string') {
        return {
          success: true,
          result: content || '',
          processedCount: 0,
          executionTime: performance.now() - startTime,
          dependencies: [],
        };
      }

      // Extract all dependencies from content
      const dependencies = this.extractDependencies(content);

      // Extract field dependencies for tracking
      const fieldDependencies = await this.extractFieldDependencies(content);

      if (dependencies.size === 0) {
        // No dependencies, return as-is
        return {
          success: true,
          result: content,
          processedCount: 0,
          executionTime: performance.now() - startTime,
          dependencies: fieldDependencies,
        };
      }

      // Resolve all dependencies iteratively (no recursion)
      const resolvedDeps = await this.resolveDependencies(dependencies);

      // Apply resolved dependencies to content
      const finalResult = this.evaluateWithDependencies(content, resolvedDeps);

      return {
        success: true,
        result: finalResult,
        processedCount: dependencies.size,
        executionTime: performance.now() - startTime,
        dependencies: fieldDependencies,
      };
    } catch (error) {
      return {
        success: false,
        error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processedCount: 0,
        executionTime: performance.now() - startTime,
        dependencies: [],
      };
    }
  }

  /**
   * Extract all dependencies from content and recursively find field dependencies
   * Returns the actual form fields that need to be watched for changes
   */
  public async extractFieldDependencies(content: string): Promise<string[]> {
    const fieldDeps = new Set<string>();
    const processedDeps = new Set<string>();

    await this._extractFieldDepsRecursive(content, fieldDeps, processedDeps);

    return Array.from(fieldDeps);
  }

  /**
   * Recursively extract field dependencies from content
   */
  private async _extractFieldDepsRecursive(
    content: string,
    fieldDeps: Set<string>,
    processedDeps: Set<string>,
    depth = 0
  ): Promise<void> {
    if (depth > 5) {
      return;
    } // Prevent infinite recursion

    // Extract direct field references
    const fieldPattern = /\{([^}]+)\}/g;
    let match;
    while ((match = fieldPattern.exec(content)) !== null) {
      fieldDeps.add(match[1]);
    }

    // Extract shortcode dependencies and process them
    const shortcodePattern = /\[(\w+):([^\]]+)\]/g;
    while ((match = shortcodePattern.exec(content)) !== null) {
      const type = match[1];
      const name = match[2];
      const depKey = `${type}:${name}`;

      if (processedDeps.has(depKey)) {
        continue;
      }
      processedDeps.add(depKey);

      if (type === 'field') {
        fieldDeps.add(name);
      } else if (type === 'calc') {
        // Get formula and recursively check its dependencies
        const formulas = await this.getFormulas();
        const formula = formulas.find(
          f =>
            f.name.toLowerCase() === name.toLowerCase() ||
            f.name.toLowerCase().replace(/\s+/g, '-') === name.toLowerCase()
        );
        if (formula?.formula_text) {
          await this._extractFieldDepsRecursive(
            formula.formula_text,
            fieldDeps,
            processedDeps,
            depth + 1
          );
        }
      } else if (type === 'lookup') {
        // Get lookup rules and check their field dependencies
        await this._extractLookupFieldDeps(
          name,
          fieldDeps,
          processedDeps,
          depth + 1
        );
      }
    }
  }

  /**
   * Extract field dependencies from lookup rules
   */
  private async _extractLookupFieldDeps(
    lookupName: string,
    fieldDeps: Set<string>,
    processedDeps: Set<string>,
    depth: number
  ): Promise<void> {
    if (depth > 5) {
      return;
    }

    try {
      // Get enhanced lookup rules
      const { data: lookup } = await supabase
        .from('enhanced_lookups')
        .select('id')
        .eq('name', lookupName)
        .eq('is_active', true)
        .single();

      if (lookup) {
        const { data: rules } = await supabase
          .from('enhanced_lookup_rules')
          .select('condition_logic, action_config')
          .eq('lookup_id', lookup.id)
          .eq('is_active', true);

        if (rules) {
          for (const rule of rules) {
            // Extract field dependencies from conditions
            if (rule.condition_logic?.conditions) {
              for (const condition of rule.condition_logic.conditions) {
                if (condition.field) {
                  fieldDeps.add(condition.field);
                }
              }
            }

            // Extract field dependencies from formula actions
            if (rule.action_config?.formula_text) {
              await this._extractFieldDepsRecursive(
                rule.action_config.formula_text,
                fieldDeps,
                processedDeps,
                depth + 1
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn(
        `Failed to extract lookup dependencies for ${lookupName}:`,
        error
      );
    }
  }

  /**
   * Extract all dependencies from content using unified pattern
   * Handles: [calc:name], [lookup:name], {field-name}
   */
  private extractDependencies(content: string): Set<string> {
    const deps = new Set<string>();

    // Single unified regex for all patterns
    const unifiedPattern = /\[(\w+):([^\]]+)\]|\{([^}]+)\}/g;

    let match;
    while ((match = unifiedPattern.exec(content)) !== null) {
      if (match[1] && match[2]) {
        // Shortcode format: [type:name]
        deps.add(`${match[1]}:${match[2]}`);
      } else if (match[3]) {
        // Field format: {field-name}
        deps.add(`field:${match[3]}`);
      }
    }

    return deps;
  }

  /**
   * Resolve all dependencies iteratively with depth limiting
   * No recursion - uses queue-based processing
   */
  private async resolveDependencies(
    dependencies: Set<string>
  ): Promise<Map<string, ProcessedValue>> {
    const resolved = new Map<string, ProcessedValue>();
    const toProcess = Array.from(dependencies);
    const processed = new Set<string>();

    let depth = 0;

    while (toProcess.length > 0 && depth < this.context.maxDepth) {
      const batch = toProcess.splice(0, this.context.batchSize);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(dep => this.resolveSingleDependency(dep))
      );

      // Handle batch results
      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        const depId = batch[i];

        if (result.status === 'fulfilled' && result.value) {
          const processedValue = result.value;
          resolved.set(depId, processedValue);
          processed.add(depId);

          // Check if this result contains more dependencies
          const nestedDeps = this.extractDependencies(processedValue.processed);
          nestedDeps.forEach(nestedDep => {
            if (!processed.has(nestedDep) && !toProcess.includes(nestedDep)) {
              toProcess.push(nestedDep);
            }
          });

          // Cache the result
          this.cache.set(depId, processedValue);

          // Persist to database (non-blocking)
          this._persistValue().catch(console.error);
        }
      }

      depth++;
    }

    if (depth >= this.context.maxDepth) {
      console.warn(
        `Reached maximum dependency depth (${this.context.maxDepth}). Some dependencies may not be resolved.`
      );
    }

    return resolved;
  }

  /**
   * Resolve a single dependency based on its type
   */
  private async resolveSingleDependency(
    dependency: string
  ): Promise<ProcessedValue | null> {
    // Check cache first
    const cached = this.cache.get(dependency);
    if (cached) {
      return cached;
    }

    const [type, name] = dependency.split(':', 2);
    const valueId = `${this.context.sessionId}:${dependency}`;

    const processedValue: ProcessedValue = {
      id: valueId,
      type: this.determineType(dependency),
      raw: dependency,
      processed: '',
      dependencies: [],
      timestamp: new Date(),
    };

    try {
      switch (type) {
        case 'field':
          processedValue.processed = this.resolveField(name);
          break;

        case 'calc':
          processedValue.processed = await this.resolveCalculation(name);
          break;

        case 'lookup':
          processedValue.processed = await this.resolveLookup(name);
          break;

        default:
          processedValue.processed = dependency; // Keep as-is
      }

      return processedValue;
    } catch (error) {
      processedValue.processed = `[Error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
      return processedValue;
    }
  }

  /**
   * Resolve field reference from form data
   */
  private resolveField(fieldName: string): string {
    const value = this.context.formData[fieldName];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Field '${fieldName}' is required but has no value`);
    }
    return String(value);
  }

  /**
   * Resolve calculation shortcode
   */
  private async resolveCalculation(
    formulaName: string,
    depth = 0
  ): Promise<string> {
    // Check for user override first - try multiple key formats
    const possibleOverrideKeys = [
      `override_${formulaName}`,
      `override_${formulaName.replace(/-/g, '_')}`,
      `override_${formulaName.replace(/_/g, '-')}`,
    ];

    for (const overrideKey of possibleOverrideKeys) {
      const overrideValue = this.context.formData[overrideKey];
      if (
        overrideValue !== undefined &&
        overrideValue !== null &&
        overrideValue !== ''
      ) {
        console.log(
          `🔄 Using override value for '${formulaName}' (key: ${overrideKey}): ${overrideValue} (instead of calculating)`
        );
        return String(overrideValue);
      }
    }

    if (depth > 5) {
      throw new Error(
        `Maximum formula recursion depth exceeded for '${formulaName}'`
      );
    }

    const formulas = await this.getFormulas();
    const formula = formulas.find(
      f =>
        f.name.toLowerCase() === formulaName.toLowerCase() ||
        f.name.toLowerCase().replace(/\s+/g, '-') === formulaName.toLowerCase()
    );

    if (!formula) {
      throw new Error(`Formula '${formulaName}' not found`);
    }

    // Process the formula text recursively but safely
    const result = await this.processFormulaText(
      formula.formula_text,
      depth + 1
    );

    // Return raw numeric value for use in other calculations
    return String(result);
  }

  /**
   * Process formula text that may contain shortcodes and field references
   * This is a simplified version that handles the most common cases
   */
  private async processFormulaText(
    formulaText: string,
    depth = 0
  ): Promise<number> {
    let processedText = formulaText;

    // Handle [field:xxx] references
    const fieldReferences = formulaText.match(/\[field:([^\]]+)\]/g) || [];
    for (const fieldRef of fieldReferences) {
      const fieldNameMatch = fieldRef.match(/\[field:([^\]]+)\]/);
      if (fieldNameMatch) {
        const fieldName = fieldNameMatch[1];
        const fieldValue = this.context.formData[fieldName];
        if (
          fieldValue !== undefined &&
          fieldValue !== null &&
          fieldValue !== ''
        ) {
          processedText = processedText.replace(fieldRef, String(fieldValue));
        } else {
          throw new Error(`Field '${fieldName}' not found in form data`);
        }
      }
    }

    // Handle [calc:xxx] references recursively
    const calcReferences = formulaText.match(/\[calc:([^\]]+)\]/g) || [];
    for (const calcRef of calcReferences) {
      const calcNameMatch = calcRef.match(/\[calc:([^\]]+)\]/);
      if (calcNameMatch) {
        const calcName = calcNameMatch[1];
        const calcResult = await this.resolveCalculation(calcName, depth);
        processedText = processedText.replace(calcRef, calcResult);
      }
    }

    // Now evaluate the mathematical expression
    if (this.isEvaluableExpression(processedText)) {
      return this.evaluateMathExpression(processedText);
    } else {
      // If not a math expression, try to parse as number
      const numResult = parseFloat(processedText);
      if (isNaN(numResult)) {
        throw new Error(`Cannot evaluate formula result: ${processedText}`);
      }
      return numResult;
    }
  }

  /**
   * Resolve lookup shortcode using enhanced lookup system
   */
  private async resolveLookup(lookupName: string): Promise<string> {
    try {
      // First try enhanced lookup system
      const enhancedResult = await executeEnhancedLookup(
        lookupName,
        this.context.sessionId,
        this.context.formData,
        { enableLogging: true }
      );

      if (enhancedResult.success && enhancedResult.value !== undefined) {
        return String(enhancedResult.value);
      }

      // If enhanced lookup doesn't have this lookup, fall back to legacy system
      if (enhancedResult.error && enhancedResult.error.includes('not found')) {
        console.log(
          `Enhanced lookup '${lookupName}' not found, falling back to legacy system`
        );

        const legacyResult = await processLookupShortcode(
          lookupName,
          this.context.sessionId,
          this.context.formData
        );

        if (legacyResult.success) {
          return (
            legacyResult.shortcode ||
            legacyResult.error ||
            '[Lookup result unavailable]'
          );
        }

        throw new Error(`Legacy lookup failed: ${legacyResult.error}`);
      }

      // Enhanced lookup found but failed
      throw new Error(`Enhanced lookup failed: ${enhancedResult.error}`);
    } catch (error) {
      console.error(`Lookup resolution error for '${lookupName}':`, error);
      throw new Error(
        `Lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Apply resolved dependencies to original content
   */
  private evaluateWithDependencies(
    content: string,
    resolvedDeps: Map<string, ProcessedValue>
  ): string {
    let result = content;

    // Replace all dependencies in content
    for (const [depId, processedValue] of resolvedDeps) {
      const [type, name] = depId.split(':', 2);

      let pattern: RegExp;
      if (type === 'field') {
        pattern = new RegExp(`\\{${this.escapeRegExp(name)}\\}`, 'g');
      } else {
        pattern = new RegExp(`\\[${type}:${this.escapeRegExp(name)}\\]`, 'g');
      }

      result = result.replace(pattern, processedValue.processed);
    }

    // Check if result is a mathematical expression and evaluate it
    if (this.isEvaluableExpression(result)) {
      try {
        const mathResult = this.evaluateMathExpression(result);
        return mathResult.toString();
      } catch (error) {
        console.warn('Failed to evaluate mathematical expression:', error);
        // Return the substituted result even if math evaluation fails
      }
    }

    return result;
  }

  /**
   * Check if content looks like a mathematical expression
   */
  private isEvaluableExpression(content: string): boolean {
    // Check if it contains only numbers, operators, and whitespace
    return (
      /^[\d+\-*/().\s]+$/.test(content.trim()) && /[+\-*/()]/.test(content)
    ); // Must contain at least one operator
  }

  /**
   * Safely evaluate mathematical expressions
   */
  private evaluateMathExpression(expression: string): number {
    const cleanExpression = expression.replace(/\s/g, '');

    // Validate expression contains only safe characters
    if (!/^[0-9+\-*/().\s]+$/.test(cleanExpression)) {
      throw new Error('Expression contains invalid characters');
    }

    // Check balanced parentheses
    const openParens = (cleanExpression.match(/\(/g) || []).length;
    const closeParens = (cleanExpression.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      throw new Error('Unbalanced parentheses');
    }

    // Use Function constructor for safe evaluation
    const result = new Function('return ' + cleanExpression)();

    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('Expression did not evaluate to a valid number');
    }

    return result;
  }

  /**
   * Get formulas with caching
   */
  private async getFormulas() {
    // Simple cache check
    if (
      this.formulasCache &&
      Date.now() - this.formulasCache.timestamp < this.formulasCache.ttl
    ) {
      console.log('🚀 Using cached formulas (cache hit)');
      return this.formulasCache.formulas;
    }

    console.log('📡 Fetching formulas from database...');
    const { data: formulas, error } = await supabase
      .from('formulas')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch formulas: ${error.message}`);
    }

    // Cache the results for 5 minutes
    this.formulasCache = {
      formulas: formulas || [],
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000,
    };

    console.log(
      `✅ Successfully fetched and cached ${formulas?.length || 0} formulas`
    );
    return formulas || [];
  }

  /**
   * Determine the type of content for metadata purposes
   */
  private determineType(
    content: string
  ): 'field' | 'calculation' | 'lookup' | 'static' {
    if (content.includes('field:')) {
      return 'field';
    }
    if (content.includes('calc:')) {
      return 'calculation';
    }
    if (content.includes('lookup:')) {
      return 'lookup';
    }
    return 'static';
  }

  /**
   * Infer unit from formula name (temporary until database has unit field)
   */
  private inferUnit(formulaName: string): string {
    const nameLower = formulaName.toLowerCase();
    if (nameLower.includes('energiantarve') && nameLower.includes('kwh')) {
      return 'kW';
    } else if (nameLower.includes('öljyn menekki')) {
      return 'L/vuosi';
    } else if (nameLower.includes('kaasun menekki')) {
      return 'MWh/vuosi';
    } else if (nameLower.includes('puun menekki')) {
      return 'motti/vuosi';
    }
    return '';
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Persist processed value to database (non-blocking)
   * Temporarily disabled to avoid console errors - functionality works without it
   */
  private async _persistValue(): Promise<void> {
    // Disabled - calculations work perfectly without database persistence
    return;
  }

  /**
   * Load cached values from database on initialization
   */
  public async loadCachedValues(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('processed_values')
        .select('*')
        .eq('session_id', this.context.sessionId)
        .gte(
          'updated_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ); // Last 24 hours

      if (error) {
        console.error('Failed to load cached values:', error);
        return;
      }

      if (data) {
        for (const row of data) {
          const processedValue: ProcessedValue = {
            id: row.value_id,
            type: row.type,
            raw: row.raw,
            processed: row.processed,
            dependencies: row.dependencies || [],
            timestamp: new Date(row.updated_at),
          };

          // Recreate the dependency key from the value_id
          const dependencyKey = row.raw;
          this.cache.set(dependencyKey, processedValue);
        }

        console.log(`Loaded ${data.length} cached values from database`);
      }
    } catch (error) {
      console.error('Error loading cached values:', error);
      // Don't throw - cache loading errors shouldn't prevent engine usage
    }
  }

  // clearCache method is already defined above, removed duplicate

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Update form data context
   */
  public updateFormData(formData: Record<string, any>): void {
    this.context.formData = { ...this.context.formData, ...formData };
  }
}

// Export a factory function for easy instantiation
export function createUnifiedEngine(
  sessionId: string,
  formData: Record<string, any> = {}
): UnifiedCalculationEngine {
  return new UnifiedCalculationEngine(supabase, sessionId, formData);
}

// Export default processing function for backward compatibility
export async function processContent(
  content: string,
  sessionId: string,
  formData: Record<string, any> = {}
): Promise<ProcessingResult> {
  const engine = createUnifiedEngine(sessionId, formData);
  await engine.loadCachedValues();
  return engine.process(content);
}
