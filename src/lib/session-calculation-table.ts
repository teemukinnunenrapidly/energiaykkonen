/**
 * Session-Based Calculation Lookup Table
 *
 * This creates a lookup table where each shortcode and its calculated value
 * is stored by formula name for the session. When processing expressions,
 * we look up the values from this table instead of re-executing formulas.
 */

export interface CalculationEntry {
  formulaName: string;
  value: number;
  unit?: string;
  timestamp: string;
}

/**
 * Session-based calculation lookup table
 * Key: sessionId, Value: Map of formulaName -> CalculationEntry
 */
const sessionCalculations = new Map<string, Map<string, CalculationEntry>>();

/**
 * Store a calculation result in the session lookup table
 */
export function storeSessionCalculation(
  sessionId: string,
  formulaName: string,
  value: number,
  unit?: string
): void {
  if (!sessionCalculations.has(sessionId)) {
    sessionCalculations.set(sessionId, new Map<string, CalculationEntry>());
  }

  const sessionTable = sessionCalculations.get(sessionId)!;
  const key = formulaName.toLowerCase();

  sessionTable.set(key, {
    formulaName,
    value,
    unit,
    timestamp: new Date().toISOString(),
  });

  console.log(
    `📊 [SESSION TABLE] Stored: "${formulaName}" = ${value} ${unit || ''}`
  );
}

/**
 * Lookup a calculation result from the session table
 */
export function lookupSessionCalculation(
  sessionId: string,
  formulaName: string
): CalculationEntry | null {
  const sessionTable = sessionCalculations.get(sessionId);
  if (!sessionTable) {
    console.log(`📊 [SESSION TABLE] No session table found for: ${sessionId}`);
    return null;
  }

  const key = formulaName.toLowerCase();
  const entry = sessionTable.get(key);

  if (entry) {
    console.log(
      `📊 [SESSION TABLE] Found: "${formulaName}" = ${entry.value} ${entry.unit || ''}`
    );
  } else {
    console.log(`📊 [SESSION TABLE] Not found: "${formulaName}"`);
  }

  return entry || null;
}

/**
 * Get all calculations for a session (for debugging)
 */
export function getSessionCalculationTable(
  sessionId: string
): Record<string, CalculationEntry> {
  const sessionTable = sessionCalculations.get(sessionId);
  if (!sessionTable) {
    return {};
  }

  const result: Record<string, CalculationEntry> = {};
  sessionTable.forEach((entry, key) => {
    result[key] = entry;
  });

  return result;
}

/**
 * Clear session calculation table
 */
export function clearSessionCalculations(sessionId: string): void {
  sessionCalculations.delete(sessionId);
  console.log(
    `📊 [SESSION TABLE] Cleared calculations for session: ${sessionId}`
  );
}

/**
 * Process an expression by replacing shortcodes with session table values
 * Example: "[calc:energy]/10" becomes "20820/10"
 */
export function resolveExpressionFromSession(
  expression: string,
  sessionId: string
): { success: boolean; resolvedExpression?: string; error?: string } {
  try {
    console.log(`📊 [SESSION TABLE] Processing expression: "${expression}"`);

    // Find all [calc:xxx] references
    const calcReferences = expression.match(/\[calc:([^\]]+)\]/g) || [];
    console.log(`📊 [SESSION TABLE] Found references:`, calcReferences);

    let resolvedExpression = expression;

    // Replace each reference with its session table value
    for (const ref of calcReferences) {
      const formulaName = ref.replace(/\[calc:([^\]]+)\]/, '$1').trim();
      console.log(`📊 [SESSION TABLE] Looking up: "${formulaName}"`);

      const entry = lookupSessionCalculation(sessionId, formulaName);

      if (!entry) {
        return {
          success: false,
          error: `No calculation found in session for: "${formulaName}". Make sure it's calculated first.`,
        };
      }

      // Replace the shortcode with the numeric value
      const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      resolvedExpression = resolvedExpression.replace(
        new RegExp(escaped, 'g'),
        entry.value.toString()
      );
      console.log(
        `📊 [SESSION TABLE] Replaced "${ref}" with "${entry.value}": "${resolvedExpression}"`
      );
    }

    console.log(
      `📊 [SESSION TABLE] Final resolved expression: "${resolvedExpression}"`
    );

    return {
      success: true,
      resolvedExpression,
    };
  } catch (error) {
    console.error('Error resolving expression from session:', error);
    return {
      success: false,
      error: `Failed to resolve expression: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Evaluate a resolved math expression safely
 */
export function evaluateMathExpression(expression: string): {
  success: boolean;
  result?: number;
  error?: string;
} {
  try {
    console.log(`📊 [SESSION TABLE] Evaluating math: "${expression}"`);

    // Validate expression contains only safe characters
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      return {
        success: false,
        error: `Invalid characters in expression: ${expression}`,
      };
    }

    // Evaluate using Function constructor (safe)
    const result = new Function('return ' + expression)();

    if (typeof result !== 'number' || isNaN(result)) {
      return {
        success: false,
        error: 'Expression did not evaluate to a valid number',
      };
    }

    console.log(`📊 [SESSION TABLE] Math result: ${result}`);

    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Math evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
