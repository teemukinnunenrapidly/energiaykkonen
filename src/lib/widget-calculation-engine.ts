/**
 * Widget Calculation Engine
 * 
 * A lightweight version of UnifiedCalculationEngine that works without Supabase
 * Uses pre-loaded formulas from config.json instead of database queries
 */

import { processLookupShortcode } from './conditional-lookup';

// Core types (same as unified engine)
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
  unit?: string; // Unit from formula configuration
  error?: string;
  processedCount: number;
  executionTime: number;
  dependencies: string[]; // Track which fields were actually used
}

export class WidgetCalculationEngine {
  private cache: Map<string, ProcessedValue> = new Map();
  private context: ProcessingContext;
  private formulas: any[] = [];
  private lookupTables: any[] = [];

  constructor(
    formulas: any[], // Pre-loaded formulas from config.json
    sessionId: string,
    formData: Record<string, any> = {},
    lookupTables: any[] = [] // Pre-loaded lookup tables from config.json
  ) {
    // Create safe copy of formData - convert all values to primitives
    const safeFormData: Record<string, any> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value === null || value === undefined) {
        safeFormData[key] = '';
      } else if (typeof value === 'object') {
        // Convert objects to strings or extract value property
        if (value.value !== undefined) {
          safeFormData[key] = value.value;
        } else {
          safeFormData[key] = String(value);
        }
      } else {
        safeFormData[key] = value;
      }
    }

    this.context = {
      sessionId,
      formData: safeFormData,
      maxDepth: 10,
      batchSize: 10,
    };
    this.formulas = formulas || [];
    this.lookupTables = lookupTables || [];
  }

  /**
   * Clear the processing cache - useful when form data changes
   */
  public clearCache(): void {
    console.log('🧹 Clearing WidgetCalculationEngine cache');
    this.cache.clear();
  }

  /**
   * Single entry point for all content processing
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

      // Check if this is a single calc or lookup shortcode to extract unit
      let unit: string | undefined;
      const singleCalcMatch = content.match(/^\[calc:([^\]]+)\]$/);  
      const singleLookupMatch = content.match(/^\[lookup:([^\]]+)\]$/);
      
      if (singleCalcMatch) {
        const formulaName = singleCalcMatch[1];
        console.log('Looking for formula:', formulaName);
        const formula = this.formulas.find(f => f.name === formulaName);
        console.log('Found formula:', formula?.name, 'with unit:', formula?.unit);
        if (formula && formula.unit) {
          unit = formula.unit;
          console.log('Setting unit:', unit);
        }
      } else if (singleLookupMatch) {
        const lookupName = singleLookupMatch[1];
        console.log('Looking for lookup table:', lookupName);
        const lookupTable = this.lookupTables.find(t => t.name === lookupName);
        
        if (lookupTable) {
          // Check if lookup name suggests a price
          if (lookupName.includes('hinta')) {
            unit = '€';
            console.log('Setting unit for price lookup:', unit);
          } else {
            // For other lookups, we need to resolve what they return to get the unit
            // Get the condition field value
            const conditionField = lookupTable.condition_field;
            const conditionValue = this.context.formData[conditionField];
            
            // Find matching lookup value
            const lookupValues = lookupTable.lookup_values || [];
            const matchingValue = lookupValues.find((v: any) => 
              v.condition_value === conditionValue
            );
            
            if (matchingValue && matchingValue.return_value) {
              // Check if the return value is a calc shortcode
              const calcMatch = String(matchingValue.return_value).match(/^\[calc:([^\]]+)\]$/);
              if (calcMatch) {
                const nestedFormulaName = calcMatch[1];
                const nestedFormula = this.formulas.find(f => f.name === nestedFormulaName);
                if (nestedFormula && nestedFormula.unit) {
                  unit = nestedFormula.unit;
                  console.log(`Setting unit from nested calc ${nestedFormulaName}:`, unit);
                }
              }
            }
          }
        }
      }

      if (dependencies.size === 0) {
        // No dependencies, return as-is
        return {
          success: true,
          result: content,
          unit,
          processedCount: 0,
          executionTime: performance.now() - startTime,
          dependencies: fieldDependencies,
        };
      }

      // Resolve all dependencies iteratively (no recursion)
      const resolvedDeps = await this.resolveDependencies(dependencies);

      // Apply resolved dependencies to content
      const finalResult = this.evaluateWithDependencies(content, resolvedDeps);

      const returnValue = {
        success: true,
        result: finalResult,
        unit,
        processedCount: dependencies.size,
        executionTime: performance.now() - startTime,
        dependencies: fieldDependencies,
      };
      console.log('Returning from process:', returnValue);
      return returnValue;
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
   * Extract field dependencies from content
   */
  public async extractFieldDependencies(content: string): Promise<string[]> {
    const fieldDeps = new Set<string>();
    const processedDeps = new Set<string>();

    await this._extractFieldDepsRecursive(content, fieldDeps, processedDeps);

    return Array.from(fieldDeps);
  }

  private async _extractFieldDepsRecursive(
    content: string,
    fieldDeps: Set<string>,
    processedDeps: Set<string>,
    depth: number = 0
  ): Promise<void> {
    if (depth > 5) return; // Prevent infinite recursion
    if (processedDeps.has(content)) return; // Already processed
    processedDeps.add(content);

    // Extract direct field references {field-name}
    const fieldPattern = /\{([a-z_][a-z0-9_]*)\}/gi;
    let match;
    while ((match = fieldPattern.exec(content)) !== null) {
      fieldDeps.add(match[1]);
    }

    // Extract calc: references and check their formulas
    const calcPattern = /\[calc:([^\]]+)\]/gi;
    while ((match = calcPattern.exec(content)) !== null) {
      const formulaName = match[1];
      const formula = this.formulas.find(f => f.name === formulaName);
      
      // Use formula_text (actual DB field) or formula (legacy)
      const formulaExpression = formula?.formula_text || formula?.formula;
      if (formulaExpression) {
        await this._extractFieldDepsRecursive(
          formulaExpression,
          fieldDeps,
          processedDeps,
          depth + 1
        );
      }
    }
    
    // Extract lookup: references and add their condition fields as dependencies
    const lookupPattern = /\[lookup:([^\]]+)\]/gi;
    while ((match = lookupPattern.exec(content)) !== null) {
      const lookupName = match[1];
      const lookupTable = this.lookupTables.find(t => t.name === lookupName);
      
      if (lookupTable) {
        const condField = (lookupTable as any).condition_field;
        if (condField) {
          fieldDeps.add(condField);
          console.log(`Added lookup condition field ${condField} as dependency for ${lookupName}`);
        }
        const conds: any[] = (lookupTable as any).conditions || [];
        conds.forEach(c => { if (c?.condition_field) fieldDeps.add(c.condition_field); });
      }
    }
  }

  /**
   * Extract all dependencies (fields, calcs, lookups) from content
   */
  private extractDependencies(content: string): Set<string> {
    const deps = new Set<string>();

    // Extract {field-name} patterns
    const fieldPattern = /\{([a-z_][a-z0-9_]*)\}/gi;
    let match;
    while ((match = fieldPattern.exec(content)) !== null) {
      deps.add(`field:${match[1]}`);
    }

    // Extract [calc:xxx] patterns
    const calcPattern = /\[calc:([^\]]+)\]/gi;
    while ((match = calcPattern.exec(content)) !== null) {
      deps.add(`calc:${match[1]}`);
    }

    // Extract [lookup:xxx] patterns
    const lookupPattern = /\[lookup:([^\]]+)\]/gi;
    while ((match = lookupPattern.exec(content)) !== null) {
      deps.add(`lookup:${match[1]}`);
    }

    return deps;
  }

  /**
   * Resolve all dependencies iteratively
   */
  private async resolveDependencies(
    dependencies: Set<string>
  ): Promise<Map<string, string>> {
    const resolved = new Map<string, string>();
    const queue = Array.from(dependencies);
    const visited = new Set<string>();
    let depth = 0;

    while (queue.length > 0 && depth < this.context.maxDepth) {
      const batch = queue.splice(0, this.context.batchSize);
      
      for (const dep of batch) {
        if (visited.has(dep)) continue;
        visited.add(dep);

        const value = await this.resolveSingleDependency(dep);
        resolved.set(dep, value);

        // Extract nested dependencies
        const nestedDeps = this.extractDependencies(value);
        for (const nested of nestedDeps) {
          if (!visited.has(nested)) {
            queue.push(nested);
          }
        }
      }
      
      depth++;
    }

    return resolved;
  }

  /**
   * Resolve a single dependency
   */
  private async resolveSingleDependency(dep: string): Promise<string> {
    // Check cache first
    if (this.cache.has(dep)) {
      return this.cache.get(dep)!.processed;
    }

    const [type, key] = dep.split(':', 2);
    let result = '';

    switch (type) {
      case 'field':
        result = String(this.context.formData[key] || '');
        break;

      case 'calc':
        result = await this.processCalculation(key);
        break;

      case 'lookup':
        result = await this.processLookup(key);
        break;

      default:
        result = dep;
    }

    // Cache the result
    this.cache.set(dep, {
      id: dep,
      type: type as any,
      raw: dep,
      processed: result,
      dependencies: [],
      timestamp: new Date(),
    });

    return result;
  }

  /**
   * Process a calculation using pre-loaded formulas
   */
  private async processCalculation(formulaName: string): Promise<string> {
    try {
      console.log(`Processing calculation: ${formulaName}`);
      console.log(`Available formulas:`, this.formulas.map(f => f.name));
      
      const formula = this.formulas.find(f => f.name === formulaName);
      
      if (!formula) {
        console.warn(`Formula not found: ${formulaName}`);
        console.warn(`Available formulas:`, this.formulas.map(f => f.name));
        return '0';
      }

      // Check if formula has a formula_text property (the actual field name in database)
      if (!formula.formula_text && !formula.formula) {
        console.warn(`Formula ${formulaName} has no formula expression`);
        console.warn(`Formula object keys:`, Object.keys(formula));
        return '0';
      }

      // Replace field references with actual values
      // Try both formula_text (actual DB field) and formula (legacy)
      let expression = formula.formula_text || formula.formula;
      console.log(`Formula expression for ${formulaName}:`, expression);
      
      // First, replace [field:name] with {name} format
      expression = expression.replace(/\[field:([^\]]+)\]/gi, '{$1}');
      
      // Process any nested [calc:...] references
      const calcPattern = /\[calc:([^\]]+)\]/gi;
      let calcMatch;
      while ((calcMatch = calcPattern.exec(expression)) !== null) {
        const nestedFormulaName = calcMatch[1];
        const nestedResult = await this.processCalculation(nestedFormulaName);
        expression = expression.replace(calcMatch[0], nestedResult);
      }
      
      // Process any [lookup:...] references
      const lookupPattern = /\[lookup:([^\]]+)\]/gi;
      let lookupMatch;
      while ((lookupMatch = lookupPattern.exec(expression)) !== null) {
        const lookupName = lookupMatch[1];
        const lookupResult = await this.processLookup(lookupName);
        expression = expression.replace(lookupMatch[0], lookupResult);
      }
      
      // Then replace {field-name} with actual values
      expression = expression.replace(/\{([a-z_][a-z0-9_]*)\}/gi, (match: string, fieldName: string) => {
        const value = this.context.formData[fieldName];
        console.log(`  Replacing field ${fieldName} with value: ${value}`);
        if (value === undefined || value === null || value === '') {
          return '0';
        }
        return String(value);
      });

      // Log the final expression for debugging
      console.log(`Final expression to evaluate: ${expression}`);
      
      // Evaluate the expression safely
      try {
        // Validate expression doesn't contain any remaining shortcodes
        if (expression.includes('[') || expression.includes(':')) {
          console.error(`Expression still contains shortcodes: ${expression}`);
          return '0';
        }
        
        // Create a safe evaluation context
        const func = new Function('data', `
          with(data) {
            return (${expression});
          }
        `);
        
        const result = func(this.context.formData);
        
        // Format the result
        if (typeof result === 'number') {
          if (formula.output_format === 'currency') {
            return new Intl.NumberFormat('fi-FI', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(result);
          } else if (formula.decimal_places !== undefined) {
            return result.toFixed(formula.decimal_places);
          }
          return String(result);
        }
        
        return String(result);
      } catch (evalError) {
        console.error(`Error evaluating formula ${formulaName}:`, evalError);
        return '0';
      }
    } catch (error) {
      console.error(`Error processing calculation ${formulaName}:`, error);
      return '0';
    }
  }

  /**
   * Process a lookup using pre-loaded lookup tables
   */
  private async processLookup(lookupName: string): Promise<string> {
    try {
      console.log(`Processing lookup: ${lookupName}`);
      console.log(`Available lookup tables:`, this.lookupTables.map(t => t.name));
      
      // Find the lookup table
      const lookupTable = this.lookupTables.find(t => t.name === lookupName);
      
      if (!lookupTable) {
        console.warn(`Lookup table not found: ${lookupName}`);
        // Fallback to simple lookup processing
        const result = await processLookupShortcode(
          lookupName,
          this.context.sessionId,
          this.context.formData
        );
        // processLookupShortcode returns an object with success flag
        if (result.success && result.shortcode) {
          return result.shortcode;
        }
        return '';
      }
      
      // Determine field/value sources (support both legacy lookup_values and new conditions)
      const conditionField = (lookupTable as any).condition_field || (lookupTable as any).conditions?.[0]?.condition_field;
      const conditionValue = conditionField ? this.context.formData[conditionField] : undefined;
      console.log(`Lookup ${lookupName}: checking ${conditionField} = ${conditionValue}`);

      const lookupValues: any[] = (lookupTable as any).lookup_values || (lookupTable as any).conditions || [];

      // Match by strict or string equality
      let matchingValue = lookupValues.find((v: any) => v.condition_value === conditionValue);
      if (!matchingValue) {
        matchingValue = lookupValues.find((v: any) => String(v.condition_value) === String(conditionValue));
      }
      if (!matchingValue) {
        matchingValue = lookupValues.find((v: any) => v.condition_value === 'default' || v.is_default);
      }

      if (matchingValue && matchingValue.return_value !== undefined) {
        const rv = String(matchingValue.return_value);
        const calcMatch = rv.match(/^\[calc:([^\]]+)\]$/);
        if (calcMatch) {
          return await this.processCalculation(calcMatch[1]);
        }
        return rv;
      }

      return '0';
    } catch (error) {
      console.error(`Error processing lookup ${lookupName}:`, error);
      return '';
    }
  }

  /**
   * Apply resolved dependencies to content
   */
  private evaluateWithDependencies(
    content: string,
    resolved: Map<string, string>
  ): string {
    let result = content;

    // Replace all resolved dependencies
    for (const [dep, value] of resolved) {
      const [type, key] = dep.split(':', 2);
      
      switch (type) {
        case 'field':
          result = result.replace(new RegExp(`\\{${key}\\}`, 'gi'), value);
          break;
        case 'calc':
          result = result.replace(new RegExp(`\\[calc:${key}\\]`, 'gi'), value);
          break;
        case 'lookup':
          result = result.replace(new RegExp(`\\[lookup:${key}\\]`, 'gi'), value);
          break;
      }
    }

    // If the entire result is an expression, evaluate it
    if (this.isExpression(result)) {
      try {
        const func = new Function('data', `
          with(data) {
            return (${result});
          }
        `);
        const evaluated = func(this.context.formData);
        return String(evaluated);
      } catch (error) {
        // If evaluation fails, return the partially processed result
        return result;
      }
    }

    return result;
  }

  /**
   * Check if content is a mathematical expression
   */
  private isExpression(content: string): boolean {
    // Check if it contains mathematical operators
    return /[\+\-\*\/\(\)]/.test(content) && !/\[|\{/.test(content);
  }
}