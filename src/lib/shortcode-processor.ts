import {
  getFormulas,
  executeFormulaWithFieldResolution,
} from './formula-service';
import {
  evaluateExpression,
  storeCalculationResult,
} from './calculation-engine';
import { processLookupShortcode } from './conditional-lookup';

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
 */
export async function processDisplayContentWithSession(
  content: string,
  sessionId: string,
  formVariables: Record<string, any> = {}
): Promise<ShortcodeResult> {
  try {
    // Check if content looks like a simple expression with calc or lookup shortcodes
    // e.g., "([calc:something] / 10)" or "[lookup:something] * 2 + 100"
    const hasExpression =
      /[\+\-\*\/\(\)]/.test(content) && /\[(calc|lookup):/.test(content);

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
 */
export async function processDisplayContent(
  content: string,
  formVariables: Record<string, any> = {},
  sessionId?: string
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

    // Process each shortcode
    for (const shortcode of parsed.shortcodes) {
      if (shortcode.type === 'lookup') {
        // Handle lookup shortcodes
        if (!sessionId) {
          processedContent = processedContent.replace(
            shortcode.original,
            `[Error: Lookup shortcodes require session context]`
          );
          continue;
        }

        try {
          const lookupResult = await processLookupShortcode(
            shortcode.formulaId,
            sessionId,
            formVariables
          );

          if (lookupResult.success && lookupResult.shortcode) {
            // Recursively process the returned shortcode
            console.log(
              `🔄 [SHORTCODE] About to recursively process lookup result: "${lookupResult.shortcode}"`
            );

            const recursiveResult = await processDisplayContent(
              lookupResult.shortcode,
              formVariables,
              sessionId
            );

            console.log(`🔄 [SHORTCODE] Recursive processing result:`, {
              success: recursiveResult.success,
              result: recursiveResult.result,
              error: recursiveResult.error,
            });

            if (recursiveResult.success) {
              processedContent = processedContent.replace(
                shortcode.original,
                recursiveResult.result || lookupResult.shortcode
              );
            } else {
              processedContent = processedContent.replace(
                shortcode.original,
                `[Error: ${recursiveResult.error}]`
              );
            }
          } else {
            processedContent = processedContent.replace(
              shortcode.original,
              `[Error: ${lookupResult.error || 'Lookup failed'}]`
            );
          }
        } catch (error) {
          console.error(
            `Error processing lookup ${shortcode.formulaId}:`,
            error
          );
          processedContent = processedContent.replace(
            shortcode.original,
            `[Error: Lookup processing failed]`
          );
        }
        continue;
      }

      // Handle calc shortcodes (existing logic)
      const formula = formulas.find(
        f =>
          f.name.toLowerCase() === shortcode.formulaId.toLowerCase() ||
          f.name.toLowerCase().replace(/\s+/g, '-') ===
            shortcode.formulaId.toLowerCase()
      );

      if (!formula) {
        console.warn(`Formula not found for shortcode: ${shortcode.formulaId}`);
        // Replace with error message or keep original
        processedContent = processedContent.replace(
          shortcode.original,
          `[Error: Formula '${shortcode.formulaId}' not found]`
        );
        continue;
      }

      try {
        // Use session-based formula processing if sessionId is available
        // This handles [field:xxx], [calc:xxx], and [lookup:xxx] references
        let executionResult;

        if (sessionId) {
          console.log(
            `🔄 [SHORTCODE] Processing formula with session: "${formula.formula_text}"`
          );
          // Use session-aware processing
          const { processFormulaWithSession, evaluateProcessedFormula } =
            await import('./session-data-table');

          const processed = await processFormulaWithSession(
            formula.formula_text,
            sessionId
          );
          if (processed.success) {
            const evaluated = evaluateProcessedFormula(
              processed.processedFormula!
            );
            executionResult = {
              success: evaluated.success,
              result: evaluated.result,
              error: evaluated.error,
              executionTime: 0,
            };
          } else {
            executionResult = {
              success: false,
              error: processed.error,
              executionTime: 0,
            };
          }
        } else {
          console.log(
            `🔄 [SHORTCODE] Processing formula without session: "${formula.formula_text}"`
          );
          // Fallback to field-only resolution
          executionResult = await executeFormulaWithFieldResolution(
            formula.formula_text,
            formVariables
          );
        }

        if (executionResult.success && executionResult.result !== undefined) {
          // Store result in session cache if sessionId is provided
          if (sessionId) {
            storeCalculationResult(
              sessionId,
              formula.name,
              executionResult.result
            );
          }

          // Format the result with proper unit and Finnish locale
          // Get unit from formula database or use fallback based on formula name
          let unit = formula.unit || '';

          // Fallback unit mapping based on formula names (temporary until database has unit field)
          if (!unit) {
            const nameLower = formula.name.toLowerCase();
            if (
              nameLower.includes('energiantarve') &&
              nameLower.includes('kwh')
            ) {
              unit = 'kW';
            } else if (nameLower.includes('öljyn menekki')) {
              unit = 'L/vuosi';
            } else if (nameLower.includes('kaasun menekki')) {
              unit = 'MWh/vuosi';
            } else if (nameLower.includes('puun menekki')) {
              unit = 'motti/vuosi';
            }
          }

          const formattedResult = unit
            ? `${executionResult.result.toLocaleString('fi-FI')} ${unit}`
            : executionResult.result.toLocaleString('fi-FI');

          console.log(
            `🎯 [FORMAT] Formatted formula result: ${executionResult.result} → ${formattedResult} (unit: "${unit}", formula: "${formula.name}")`
          );

          // Replace the shortcode with the result
          processedContent = processedContent.replace(
            shortcode.original,
            formattedResult
          );
        } else {
          // Replace with error message
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
