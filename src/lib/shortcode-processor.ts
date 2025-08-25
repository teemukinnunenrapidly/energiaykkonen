import { executeFormula, getFormulas } from './formula-service';
import { Formula } from './types/formula';

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
  const shortcodeRegex = /\[calc:([^\]]+)\]/g;
  const shortcodes: Array<{
    original: string;
    formulaId: string;
    variables: Record<string, any>;
  }> = [];

  let match;
  while ((match = shortcodeRegex.exec(content)) !== null) {
    const [fullMatch, formulaName] = match;
    shortcodes.push({
      original: fullMatch,
      formulaId: formulaName.trim(),
      variables: {},
    });
  }

  return {
    content,
    shortcodes,
  };
}

/**
 * Process shortcodes in display content and replace with calculation results
 */
export async function processDisplayContent(
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

    // Process each shortcode
    for (const shortcode of parsed.shortcodes) {
      // Find the formula by name (assuming formula names are unique)
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
        // Execute the formula with form variables
        const executionResult = await executeFormula(
          formula.formula_text,
          formVariables,
          'system' // Use system user for display field processing
        );

        if (executionResult.success && executionResult.result !== undefined) {
          // Format the result (you can customize this based on formula type)
          const formattedResult = formatCalculationResult(
            executionResult.result,
            formula.formula_type || 'energy_calculation'
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
  const shortcodeRegex = /\[calc:([^\]]+)\]/g;
  const matches = content.match(shortcodeRegex);

  if (matches) {
    for (const match of matches) {
      const formulaName = match.replace(/\[calc:([^\]]+)\]/, '$1');

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
