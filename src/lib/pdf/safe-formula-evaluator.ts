/**
 * Safe formula evaluator for PDF shortcodes
 * Uses mathjs library for secure mathematical expression evaluation
 * No eval() or Function() constructor - prevents code injection
 */

import { create, all } from 'mathjs';

export class SafeFormulaEvaluator {
  private math: any;
  
  constructor() {
    // Create a mathjs instance with limited functionality for safety
    this.math = create(all);
    
    // Remove potentially dangerous functions
    const dangerousFunctions = ['import', 'createUnit', 'evaluate', 'parse', 'compile'];
    dangerousFunctions.forEach(fn => {
      if (this.math[fn]) {
        delete this.math[fn];
      }
    });
    
    // Add custom safe functions
    this.math.import({
      concat: (...args: any[]) => args.map(String).join(''),
      uppercase: (str: string) => String(str).toUpperCase(),
      lowercase: (str: string) => String(str).toLowerCase(),
      trim: (str: string) => String(str).trim(),
    });
  }
  
  /**
   * Safely evaluate a formula with given context
   * @param formula - The formula to evaluate (e.g., "annual_savings / current_heating_cost * 100")
   * @param context - Object containing variable values
   * @returns The evaluated result or null if error
   */
  evaluate(formula: string, context: Record<string, any>): any {
    try {
      // Create a safe scope with only primitive values
      const safeScope: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(context)) {
        // Only allow primitive types and sanitize them
        if (typeof value === 'string') {
          safeScope[key] = value;
        } else if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          safeScope[key] = value;
        } else if (typeof value === 'boolean') {
          safeScope[key] = value;
        } else if (value === null) {
          safeScope[key] = 0; // Treat null as 0 for calculations
        } else if (value === undefined) {
          safeScope[key] = 0; // Treat undefined as 0 for calculations
        }
      }
      
      // Parse and evaluate the expression safely
      const node = this.math.parse(formula);
      const code = node.compile();
      const result = code.evaluate(safeScope);
      
      return result;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      console.error('Formula:', formula);
      console.error('Context keys:', Object.keys(context));
      return null;
    }
  }
  
  /**
   * Validate a formula without evaluating it
   * @param formula - The formula to validate
   * @returns Object with validation result
   */
  validate(formula: string): { valid: boolean; error?: string; variables?: string[] } {
    try {
      const node = this.math.parse(formula);
      
      // Extract variables from the parsed expression
      const variables: string[] = [];
      node.traverse((node: any) => {
        if (node.type === 'SymbolNode' && !this.math[node.name]) {
          if (!variables.includes(node.name)) {
            variables.push(node.name);
          }
        }
      });
      
      return {
        valid: true,
        variables
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid formula'
      };
    }
  }
  
  /**
   * Get all variables used in a formula
   * @param formula - The formula to analyze
   * @returns Array of variable names
   */
  getVariables(formula: string): string[] {
    try {
      const validation = this.validate(formula);
      return validation.variables || [];
    } catch {
      return [];
    }
  }
  
  /**
   * Test a formula with sample data
   * @param formula - The formula to test
   * @param sampleData - Sample data for testing
   * @returns Test result
   */
  test(formula: string, sampleData: Record<string, any>): {
    success: boolean;
    result?: any;
    error?: string;
    missingVariables?: string[];
  } {
    try {
      // First validate the formula
      const validation = this.validate(formula);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }
      
      // Check for missing variables
      const missingVars = validation.variables?.filter(
        v => !(v in sampleData)
      ) || [];
      
      if (missingVars.length > 0) {
        return {
          success: false,
          error: 'Missing variables in sample data',
          missingVariables: missingVars
        };
      }
      
      // Evaluate the formula
      const result = this.evaluate(formula, sampleData);
      
      if (result === null) {
        return {
          success: false,
          error: 'Evaluation returned null'
        };
      }
      
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }
}

// Singleton instance
let evaluatorInstance: SafeFormulaEvaluator | null = null;

/**
 * Get the singleton evaluator instance
 */
export function getEvaluator(): SafeFormulaEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new SafeFormulaEvaluator();
  }
  return evaluatorInstance;
}

/**
 * Quick helper to evaluate a formula
 */
export function evaluateFormula(formula: string, context: Record<string, any>): any {
  return getEvaluator().evaluate(formula, context);
}

/**
 * Quick helper to validate a formula
 */
export function validateFormula(formula: string): { valid: boolean; error?: string } {
  return getEvaluator().validate(formula);
}