/**
 * Session-Based Calculation Engine
 *
 * This engine allows for simple math expressions with shortcode references,
 * making it easy for non-technical users to create chained calculations.
 *
 * Supported syntax:
 * - Basic math: +, -, *, /, ()
 * - Shortcode references: [calc:formula-name]
 * - Combined: ([calc:energy-usage] * 0.15 + 100)
 */

import {
  executeFormulaWithFieldResolution,
  getFormulas,
} from './formula-service';

export interface CalculationResult {
  success: boolean;
  result?: number;
  error?: string;
}

export interface CalculationContext {
  sessionId: string;
  results: Map<string, number>;
  formData: Record<string, any>;
}

/**
 * Global calculation contexts for active sessions
 */
const calculationContexts = new Map<string, CalculationContext>();

/**
 * Helper function to escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get or create a calculation context for a session
 */
export function getCalculationContext(sessionId: string): CalculationContext {
  if (!calculationContexts.has(sessionId)) {
    calculationContexts.set(sessionId, {
      sessionId,
      results: new Map<string, number>(),
      formData: {},
    });
  }
  return calculationContexts.get(sessionId)!;
}

/**
 * Update form data in the calculation context
 */
export function updateContextFormData(
  sessionId: string,
  formData: Record<string, any>
) {
  const context = getCalculationContext(sessionId);
  context.formData = { ...context.formData, ...formData };
}

/**
 * Store a calculation result in the session context
 */
export function storeCalculationResult(
  sessionId: string,
  formulaName: string,
  result: number
) {
  const context = getCalculationContext(sessionId);
  context.results.set(formulaName.toLowerCase(), result);
  console.log(`📊 Stored calculation result: ${formulaName} = ${result}`);
}

/**
 * Parse and evaluate a simple math expression with shortcode references
 */
export async function evaluateExpression(
  expression: string,
  sessionId: string,
  formData: Record<string, any> = {}
): Promise<CalculationResult> {
  try {
    const context = getCalculationContext(sessionId);

    // Update context with latest form data
    if (Object.keys(formData).length > 0) {
      updateContextFormData(sessionId, formData);
    }

    // First, resolve all [calc:xxx] references in the expression
    let resolvedExpression = expression;
    const calcReferences = expression.match(/\[calc:([^\]]+)\]/g) || [];

    console.log(`🔍 Expression before resolution: "${expression}"`);
    console.log(`🔍 Found calc references:`, calcReferences);

    for (const ref of calcReferences) {
      const formulaName = ref.replace(/\[calc:([^\]]+)\]/, '$1').trim();
      console.log(
        `🔍 Processing reference: "${ref}" -> formula name: "${formulaName}"`
      );

      // Check if we have a cached result in the session
      const cachedResult = context.results.get(formulaName.toLowerCase());

      if (cachedResult !== undefined) {
        console.log(
          `✅ Using cached result for ${formulaName}: ${cachedResult}`
        );
        // Use global replace to handle multiple occurrences of the same reference
        resolvedExpression = resolvedExpression.replace(
          new RegExp(escapeRegExp(ref), 'g'),
          cachedResult.toString()
        );
        console.log(
          `🔍 After replacing "${ref}" with cached "${cachedResult}": "${resolvedExpression}"`
        );
      } else {
        // If not cached, we need to execute the formula
        console.log(`🔄 Calculating ${formulaName}...`);

        // Find the formula in the database
        const formulas = await getFormulas();
        const formula = formulas.find(
          f =>
            f.name.toLowerCase() === formulaName.toLowerCase() ||
            f.name.toLowerCase().replace(/\s+/g, '-') ===
              formulaName.toLowerCase()
        );

        if (!formula) {
          return {
            success: false,
            error: `Formula '${formulaName}' not found`,
          };
        }

        // Execute the formula with field resolution
        const result = await executeFormulaWithFieldResolution(
          formula.formula_text,
          context.formData
        );

        if (!result.success || result.result === undefined) {
          return {
            success: false,
            error: `Failed to calculate '${formulaName}': ${result.error}`,
          };
        }

        // Cache the result
        storeCalculationResult(sessionId, formulaName, result.result);

        // Replace in expression using regex to handle special characters
        resolvedExpression = resolvedExpression.replace(
          new RegExp(escapeRegExp(ref), 'g'),
          result.result.toString()
        );
        console.log(
          `🔍 After replacing "${ref}" with "${result.result}": "${resolvedExpression}"`
        );
      }
    }

    console.log(`🔍 Final resolved expression: "${resolvedExpression}"`);

    // Now evaluate the resolved expression as simple math
    const evaluationResult = evaluateMathExpression(resolvedExpression);

    return evaluationResult;
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return {
      success: false,
      error: `Failed to evaluate expression: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Evaluate a simple math expression (after all shortcodes are resolved)
 * Supports: +, -, *, /, parentheses, and decimal numbers
 */
function evaluateMathExpression(expression: string): CalculationResult {
  try {
    // Remove any whitespace
    const cleanExpression = expression.replace(/\s/g, '');

    // Validate the expression contains only allowed characters
    if (!/^[0-9+\-*/().\s]+$/.test(cleanExpression)) {
      return {
        success: false,
        error: `Invalid characters in expression: ${expression}`,
      };
    }

    // Use Function constructor for safe evaluation (no access to global scope)
    // This is safer than eval() as it creates an isolated context
    const result = new Function('return ' + cleanExpression)();

    if (typeof result !== 'number' || isNaN(result)) {
      return {
        success: false,
        error: `Expression did not evaluate to a valid number`,
      };
    }

    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Invalid expression: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Clear calculation context for a session (useful for cleanup)
 */
export function clearCalculationContext(sessionId: string) {
  calculationContexts.delete(sessionId);
  console.log(`🧹 Cleared calculation context for session: ${sessionId}`);
}

/**
 * Get all stored results for a session
 */
export function getSessionCalculations(
  sessionId: string
): Record<string, number> {
  const context = calculationContexts.get(sessionId);
  if (!context) {
    return {};
  }

  const results: Record<string, number> = {};
  context.results.forEach((value, key) => {
    results[key] = value;
  });

  return results;
}
