import {
  getFormulas,
  executeFormulaWithFieldResolution,
} from './formula-service';
import { evaluateExpression } from './calculation-engine';
import { createUnifiedEngine } from './unified-calculation-engine';

export interface ShortcodeResult {
  success: boolean;
  result?: string;
  error?: string;
}

export interface ProcessedDisplayContent {
  content: string;
  shortcodes: Array<{
    original: string;
    formulaId: string;
    variables: Record<string, any>;
    type?: 'calc' | 'lookup';
  }>;
}

/**
 * Shortcode Processor for Display Fields
 *
 * This service processes shortcodes in display field content and replaces them
 * with actual calculation results. It supports the format [calc:formula-name]
 * where formula-name corresponds to a formula in the database.
 */

/**
 * Parse display content and extract shortcodes
 */
export function parseDisplayContent(content: string): ProcessedDisplayContent {
  const shortcodeRegex = /\[(calc|lookup):([^\]]+)\]/g;
  const shortcodes: Array<{
    original: string;
    formulaId: string;
    variables: Record<string, any>;
    type?: 'calc' | 'lookup';
  }> = [];

  let match;
  while ((match = shortcodeRegex.exec(content)) !== null) {
    const [fullMatch, type, formulaName] = match;
    shortcodes.push({
      original: fullMatch,
      formulaId: formulaName.trim(),
      variables: {},
      type: type as 'calc' | 'lookup',
    });
  }

  return {
    content,
    shortcodes,
  };
}

/**
 * Process shortcodes with session-based calculation engine
 * Supports simple math expressions like ([calc:energy] * 0.1)
 *
 * NEW: Now uses UnifiedCalculationEngine for better performance
 */
export async function processDisplayContentWithSession(
  content: string,
  sessionId: string,
  formVariables: Record<string, any> = {}
): Promise<ShortcodeResult> {
  try {
    // Use the new unified engine first
    const engine = createUnifiedEngine(sessionId, formVariables);
    await engine.loadCachedValues();
    const result = await engine.process(content);

    if (result.success) {
      return {
        success: true,
        result: result.result,
      };
    } else {
      console.warn(
        'Unified engine failed, falling back to legacy processing:',
        result.error
      );
      // Fall back to legacy processing if unified engine fails
      return processDisplayContentLegacy(content, sessionId, formVariables);
    }
  } catch (error) {
    console.error(
      'Error in unified processing, falling back to legacy:',
      error
    );
    // Fall back to legacy processing on any error
    return processDisplayContentLegacy(content, sessionId, formVariables);
  }
}

/**
 * Legacy processing function (kept as fallback)
 */
async function processDisplayContentLegacy(
  content: string,
  sessionId: string,
  formVariables: Record<string, any> = {}
): Promise<ShortcodeResult> {
  try {
    // Check if content looks like a simple expression with calc or lookup shortcodes
    // e.g., "([calc:something] / 10)" or "[lookup:something] * 2 + 100"
    // Note: hyphen moved to end to avoid being treated as character range
    const hasExpression =
      /[\+\*\/\(\)\-]/.test(content) && /\[(calc|lookup):/.test(content);

    if (hasExpression) {
      // Use the calculation engine for expression evaluation
      const result = await evaluateExpression(
        content,
        sessionId,
        formVariables
      );

      if (result.success && result.result !== undefined) {
        return {
          success: true,
          result: formatCalculationResult(result.result, 'energy_calculation'),
        };
      } else {
        return {
          success: false,
          error: result.error || 'Expression evaluation failed',
        };
      }
    }

    // For simple shortcodes without expressions, use the original processing
    return processDisplayContent(content, formVariables, sessionId);
  } catch (error) {
    console.error('Error processing display content with session:', error);
    return {
      success: false,
      error: `Failed to process content: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Process shortcodes in display content and replace with calculation results
 * Now supports optional sessionId for caching results
 *
 * NEW: Uses UnifiedCalculationEngine when sessionId is available
 */
export async function processDisplayContent(
  content: string,
  formVariables: Record<string, any> = {},
  sessionId?: string
): Promise<ShortcodeResult> {
  // If sessionId is provided, use the unified engine
  if (sessionId) {
    return processDisplayContentWithSession(content, sessionId, formVariables);
  }

  // Otherwise, use legacy processing
  return processDisplayContentLegacyOnly(content, formVariables);
}

/**
 * Legacy-only processing (for when no sessionId is available)
 */
async function processDisplayContentLegacyOnly(
  content: string,
  formVariables: Record<string, any> = {}
): Promise<ShortcodeResult> {
  try {
    const parsed = parseDisplayContent(content);

    if (parsed.shortcodes.length === 0) {
      // No shortcodes found, return content as-is
      return {
        success: true,
        result: content,
      };
    }

    // Get all formulas to find the ones referenced in shortcodes
    const formulas = await getFormulas();
    let processedContent = content;

    // Process each shortcode (simplified for legacy without session)
    for (const shortcode of parsed.shortcodes) {
      if (shortcode.type === 'lookup') {
        // Lookup shortcodes require session context
        processedContent = processedContent.replace(
          shortcode.original,
          `[Error: Lookup shortcodes require session context]`
        );
        continue;
      }

      // Handle calc shortcodes
      const formula = formulas.find(
        f =>
          f.name.toLowerCase() === shortcode.formulaId.toLowerCase() ||
          f.name.toLowerCase().replace(/\s+/g, '-') ===
            shortcode.formulaId.toLowerCase()
      );

      if (!formula) {
        processedContent = processedContent.replace(
          shortcode.original,
          `[Error: Formula '${shortcode.formulaId}' not found]`
        );
        continue;
      }

      try {
        // Use field-only resolution (no session context)
        const executionResult = await executeFormulaWithFieldResolution(
          formula.formula_text,
          formVariables
        );

        if (executionResult.success && executionResult.result !== undefined) {
          const formattedResult =
            executionResult.result.toLocaleString('fi-FI');
          processedContent = processedContent.replace(
            shortcode.original,
            formattedResult
          );
        } else {
          processedContent = processedContent.replace(
            shortcode.original,
            `[Error: ${executionResult.error || 'Calculation failed'}]`
          );
        }
      } catch (error) {
        console.error(`Error executing formula ${formula.name}:`, error);
        processedContent = processedContent.replace(
          shortcode.original,
          `[Error: Calculation failed]`
        );
      }
    }

    return {
      success: true,
      result: processedContent,
    };
  } catch (error) {
    console.error('Error processing display content:', error);
    return {
      success: false,
      error: `Failed to process shortcodes: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Format calculation results based on formula type
 */
function formatCalculationResult(result: number, formulaType: string): string {
  switch (formulaType) {
    case 'energy_calculation':
      // Format energy calculations (savings, costs, etc.)
      if (Math.abs(result) >= 1000) {
        return `${(result / 1000).toFixed(1)}k`;
      }
      return result.toFixed(0);

    case 'efficiency':
      // Format efficiency as percentage
      return `${result.toFixed(1)}%`;

    case 'payback_period':
      // Format payback period in years
      return `${result.toFixed(1)} years`;

    default:
      // Default formatting
      return result.toFixed(2);
  }
}

/**
 * Get available shortcodes for display fields
 */
export async function getAvailableShortcodes(): Promise<
  Array<{
    name: string;
    shortcode: string;
    description: string;
    category: string;
  }>
> {
  try {
    const formulas = await getFormulas();

    return formulas.map(formula => ({
      name: formula.name,
      shortcode: `[calc:${formula.name.toLowerCase().replace(/\s+/g, '-')}]`,
      description: formula.description || 'No description available',
      category: formula.formula_type || 'custom',
    }));
  } catch (error) {
    console.error('Error getting available shortcodes:', error);
    return [];
  }
}

/**
 * Validate shortcode syntax
 */
export function validateShortcodeSyntax(content: string): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check for proper shortcode syntax
  const shortcodeRegex = /\[(calc|lookup):([^\]]+)\]/g;
  const matches = content.match(shortcodeRegex);

  if (matches) {
    for (const match of matches) {
      const formulaName = match.replace(/\[(calc|lookup):([^\]]+)\]/, '$2');

      // Check if formula name contains invalid characters
      if (!/^[a-zA-Z0-9\-\s]+$/.test(formulaName)) {
        errors.push(`Invalid characters in formula name: ${formulaName}`);
        suggestions.push(
          `Use only letters, numbers, hyphens, and spaces in formula names`
        );
      }

      // Check if formula name is too long
      if (formulaName.length > 50) {
        errors.push(`Formula name too long: ${formulaName}`);
        suggestions.push(`Keep formula names under 50 characters`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}
