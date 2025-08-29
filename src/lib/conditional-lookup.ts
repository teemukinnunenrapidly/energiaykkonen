/**
 * Conditional Lookup System
 *
 * Like giving the "waiter" decision-making skills based on collected information.
 * Evaluates conditions and returns appropriate shortcodes for dynamic calculations.
 *
 * Usage: [lookup:table-name] -> evaluates conditions -> returns matching shortcode
 * Now uses database-stored lookup tables created by admins in the Calculations page.
 */

import {
  getSessionField,
  getSessionCalculation,
  storeSessionField,
  getSessionSummary,
} from './session-data-table';
import { getFormulaLookupByName } from './formula-lookup-service';

export interface LookupCondition {
  condition: string; // e.g., "[field:heating_type] == 'oil'"
  shortcode: string; // e.g., "[calc:oil-heating-formula]"
  description?: string; // Human readable description
}

export interface LookupTable {
  name: string;
  conditions: LookupCondition[];
}

/**
 * Predefined lookup tables
 * In the future, these could be stored in the database
 */
const LOOKUP_TABLES: Record<string, LookupTable> = {
  // Example: heating type selector
  'heating-calculation': {
    name: 'heating-calculation',
    conditions: [
      {
        condition: "[field:heating_type] == 'oil'",
        shortcode: '[calc:oil-heating-formula]',
        description: 'Oil heating calculation',
      },
      {
        condition: "[field:heating_type] == 'electric'",
        shortcode: '[calc:electric-heating-formula]',
        description: 'Electric heating calculation',
      },
      {
        condition: "[field:heating_type] == 'gas'",
        shortcode: '[calc:gas-heating-formula]',
        description: 'Gas heating calculation',
      },
      {
        condition: "[field:heating_type] == 'district'",
        shortcode: '[calc:district-heating-formula]',
        description: 'District heating calculation',
      },
      {
        condition: 'true', // Default fallback
        shortcode: '[calc:default-heating-formula]',
        description: 'Default heating calculation',
      },
    ],
  },

  // Example: house size selector
  'house-size-calculation': {
    name: 'house-size-calculation',
    conditions: [
      {
        condition: '[field:square_meters] > 200',
        shortcode: '[calc:large-house-formula]',
        description: 'Large house calculation (>200m²)',
      },
      {
        condition: '[field:square_meters] > 100',
        shortcode: '[calc:medium-house-formula]',
        description: 'Medium house calculation (100-200m²)',
      },
      {
        condition: 'true', // Default fallback
        shortcode: '[calc:small-house-formula]',
        description: 'Small house calculation (≤100m²)',
      },
    ],
  },
};

/**
 * Process a lookup shortcode by evaluating conditions from database
 */
export async function processLookupShortcode(
  lookupName: string,
  sessionId: string,
  formData?: Record<string, any>
): Promise<{ success: boolean; shortcode?: string; error?: string }> {
  try {
    console.log(`🔍 [LOOKUP] Processing lookup: "${lookupName}"`);

    // Store current form data in session if provided
    if (formData) {
      console.log(
        `🔍 [LOOKUP] Storing form data to session for lookup processing:`,
        formData
      );
      for (const [fieldName, value] of Object.entries(formData)) {
        if (value !== undefined && value !== null && value !== '') {
          storeSessionField(sessionId, fieldName, value);
        }
      }
    }

    // Get the lookup table from database
    const lookupTable = await getFormulaLookupByName(lookupName);
    if (!lookupTable) {
      return {
        success: false,
        error: `Lookup table '${lookupName}' not found in database. Please create it in the Calculations page.`,
      };
    }

    console.log(
      `🔍 [LOOKUP] Found table with ${lookupTable.conditions?.length || 0} conditions`
    );

    // Debug: Log current session data for this lookup
    const { fields, calculations } = getSessionSummary(sessionId);
    console.log(`🔍 [LOOKUP DEBUG] Session data available:`, fields);
    console.log(
      `🔍 [LOOKUP DEBUG] Session calculations available:`,
      calculations
    );
    console.log(`🔍 [LOOKUP DEBUG] Field keys:`, Object.keys(fields));
    console.log(
      `🔍 [LOOKUP DEBUG] Calculation keys:`,
      Object.keys(calculations)
    );
    console.log(
      `🔍 [LOOKUP DEBUG] Specifically looking for 'valitse' field:`,
      getSessionField(sessionId, 'valitse')
    );
    console.log(
      `🔍 [LOOKUP DEBUG] Looking for energy calculation:`,
      calculations['Laskennallinen energiantarve (kwh)']
    );

    // Evaluate each condition in order
    for (const condition of lookupTable.conditions || []) {
      if (!condition.is_active) {
        continue;
      }

      console.log(
        `🔍 [LOOKUP] Evaluating condition ${lookupTable.conditions?.indexOf(condition) ?? -1 + 1}: "${condition.condition_rule}"`
      );
      console.log(
        `🔍 [LOOKUP] Target shortcode: "${condition.target_shortcode}"`
      );

      const result = evaluateCondition(condition.condition_rule, sessionId);

      console.log(`🔍 [LOOKUP] Condition evaluation result:`, result);

      if (!result.success) {
        console.log(`❌ [LOOKUP] Condition evaluation failed: ${result.error}`);
        continue; // Try next condition
      }

      if (result.result) {
        console.log(
          `✅ [LOOKUP] Condition matched! Returning: "${condition.target_shortcode}"`
        );
        return {
          success: true,
          shortcode: condition.target_shortcode,
        };
      }

      if (!result.success) {
        console.log(`⚠️ [LOOKUP] Condition evaluation failed: ${result.error}`);
      } else {
        console.log(`❌ [LOOKUP] Condition evaluated but returned false`);
      }
    }

    // No conditions matched - provide helpful debugging info
    console.log(`❌ [LOOKUP] No conditions matched for '${lookupName}'`);
    console.log(
      `🔍 [LOOKUP DEBUG] Final session data summary:`,
      getSessionSummary(sessionId)
    );

    const sessionFields = getSessionSummary(sessionId).fields;
    const debugInfo = Object.entries(sessionFields)
      .map(([key, value]) => `${key}="${value}"`)
      .join(', ');

    return {
      success: false,
      error: `No conditions matched in lookup table '${lookupName}'. Debug info: Available field values: ${debugInfo}`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Lookup processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Evaluate a single condition against session data
 * Supports: [field:name] == 'value', [field:name] > 100, etc.
 */
function evaluateCondition(
  condition: string,
  sessionId: string
): { success: boolean; result?: boolean; error?: string } {
  try {
    console.log(`🔍 [LOOKUP] Evaluating condition: "${condition}"`);

    // Handle special case: "true" (always matches)
    if (condition.trim() === 'true') {
      return { success: true, result: true };
    }

    // Debug: Log all available session fields for troubleshooting
    const { fields } = getSessionSummary(sessionId);
    console.log(`🔍 [LOOKUP DEBUG] All session fields:`, Object.keys(fields));
    console.log(`🔍 [LOOKUP DEBUG] Session field values:`, fields);

    // Process field references first
    let processedCondition = condition;

    // Replace [field:xxx] references with session field values
    const fieldReferences = condition.match(/\[field:([^\]]+)\]/g) || [];

    for (const ref of fieldReferences) {
      const fieldName = ref.replace(/\[field:([^\]]+)\]/, '$1').trim();
      let fieldValue = getSessionField(sessionId, fieldName);

      console.log(
        `🔍 [LOOKUP DEBUG] Looking for field '${fieldName}', got value:`,
        fieldValue
      );

      // If exact field name not found, try common field name mappings
      if (fieldValue === undefined) {
        const { fields } = getSessionSummary(sessionId);
        console.log(
          `🔍 [LOOKUP DEBUG] Field '${fieldName}' not found, trying field mapping...`
        );
        console.log(
          `🔍 [LOOKUP DEBUG] Available session fields:`,
          Object.keys(fields)
        );

        // Try common field name variations for Finnish forms
        const fieldMappings: Record<string, string[]> = {
          valitse: [
            'valitse_jompi_kumpi',
            'valitse',
            'heating_type',
            'lämmitystyyppi',
          ],
          heating_type: [
            'valitse_jompi_kumpi',
            'valitse',
            'heating_type',
            'lämmitystyyppi',
          ],
          neliot: ['square_meters', 'neliot', 'm2'],
          korkeus: ['ceiling_height', 'huonekorkeus_m', 'korkeus'],
          henkilomaara: ['residents', 'henkil_m_r', 'henkilomaara'],
          rakennusvuosi: ['construction_year', 'rakennusvuosi'],
        };

        const possibleFields = fieldMappings[fieldName.toLowerCase()] || [
          fieldName,
        ];

        for (const possibleField of possibleFields) {
          const testValue = fields[possibleField];
          if (testValue !== undefined) {
            console.log(
              `🔍 [LOOKUP DEBUG] Found field mapping: '${fieldName}' → '${possibleField}' = ${testValue}`
            );
            fieldValue = testValue;
            break;
          }
        }
      }

      if (fieldValue === undefined) {
        console.error(
          `🔍 [LOOKUP DEBUG] Field '${fieldName}' not found in session data for sessionId: ${sessionId}`
        );
        return {
          success: false,
          error: `Field '${fieldName}' not found in session data`,
        };
      }

      // Replace field reference with actual value (properly quoted if string)
      const quotedValue =
        typeof fieldValue === 'string' ? `"${fieldValue}"` : fieldValue;
      processedCondition = processedCondition.replace(
        ref,
        quotedValue.toString()
      );
    }

    // Replace [calc:xxx] references with session calculation values
    const calcReferences = processedCondition.match(/\[calc:([^\]]+)\]/g) || [];

    for (const ref of calcReferences) {
      const formulaName = ref.replace(/\[calc:([^\]]+)\]/, '$1').trim();
      const calcData = getSessionCalculation(sessionId, formulaName);

      if (!calcData) {
        return {
          success: false,
          error: `Calculation '${formulaName}' not found in session data`,
        };
      }

      // Replace calc reference with numeric value
      processedCondition = processedCondition.replace(
        ref,
        calcData.value.toString()
      );
    }

    console.log(`🔍 [LOOKUP] Processed condition: "${processedCondition}"`);
    console.log(`🔍 [LOOKUP] Testing regex match for condition...`);

    // Validate condition contains only safe characters for evaluation (including Unicode letters like ä, ö, å)
    // Allow all Unicode letters, numbers, comparison operators, quotes, and safe punctuation
    const regexTest = /^[\p{L}\p{N}\s"'=!<>()._-]+$/u.test(processedCondition);
    console.log(`🔍 [LOOKUP] Regex test result: ${regexTest}`);
    console.log(
      `🔍 [LOOKUP] Failed characters (if any):`,
      processedCondition.match(/[^\p{L}\p{N}\s"'=!<>()._-]/gu)
    );

    if (!regexTest) {
      return {
        success: false,
        error: `Unsafe characters in condition: ${processedCondition}`,
      };
    }

    // Evaluate the condition using Function constructor (safe)
    console.log(`🔍 [LOOKUP] About to evaluate: ${processedCondition}`);
    const result = new Function('return ' + processedCondition)();

    console.log(
      `🔍 [LOOKUP] Condition result: ${result} (type: ${typeof result})`
    );
    console.log(`🔍 [LOOKUP] Boolean result: ${Boolean(result)}`);

    // Special debugging for string comparisons
    if (processedCondition.includes('==')) {
      const parts = processedCondition.split('==').map(p => p.trim());
      console.log(`🔍 [LOOKUP] Comparison parts:`, parts);
      console.log(
        `🔍 [LOOKUP] Left side: ${parts[0]} (length: ${parts[0]?.length})`
      );
      console.log(
        `🔍 [LOOKUP] Right side: ${parts[1]} (length: ${parts[1]?.length})`
      );
    }

    return {
      success: true,
      result: Boolean(result),
    };
  } catch (error) {
    return {
      success: false,
      error: `Condition evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get available lookup tables (for admin interface)
 */
export function getAvailableLookupTables(): LookupTable[] {
  return Object.values(LOOKUP_TABLES);
}

/**
 * Add a new lookup table (for future database storage)
 */
export function addLookupTable(table: LookupTable): void {
  LOOKUP_TABLES[table.name] = table;
  console.log(`📋 [LOOKUP] Added new lookup table: "${table.name}"`);
}

/**
 * Handle fallback lookups for common Finnish table names that might be missing
 * Preserved for future use when fallback lookups are needed
 */
// function _handleFallbackLookups(
//   lookupName: string,
//   sessionId: string
// ): string | null {
// //   // Handle "Menekki" (consumption) - likely related to energy consumption
//   if (lookupName.toLowerCase().includes('menekki')) {
//     console.log(
//       `🔍 [LOOKUP] Applying fallback for consumption-related lookup: "${lookupName}"`
//     );
//
//     // Get session data to make a reasonable fallback calculation
//     const { fields } = getSessionSummary(sessionId);
//
//     // If we have heating type, return appropriate calculation
//     const heatingType = fields.valitse_jompi_kumpi || fields.heating_type;
//     if (heatingType) {
//       if (
//         heatingType.toLowerCase().includes('öljy') ||
//         heatingType.toLowerCase().includes('oil')
//       ) {
//         return '[calc:oil-consumption]';
//       }
//       if (
//         heatingType.toLowerCase().includes('sähkö') ||
//         heatingType.toLowerCase().includes('electric')
//       ) {
//         return '[calc:electric-consumption]';
//       }
//       if (
//         heatingType.toLowerCase().includes('kaasu') ||
//         heatingType.toLowerCase().includes('gas')
//       ) {
//         return '[calc:gas-consumption]';
//       }
//       if (
//         heatingType.toLowerCase().includes('kaukolämpö') ||
//         heatingType.toLowerCase().includes('district')
//       ) {
//         return '[calc:district-heating-consumption]';
//       }
//     }
//
//     // Default fallback for consumption
//     return '[calc:energy-consumption-default]';
//   }
//
//   // Add more fallbacks for other common Finnish lookup names
//   if (lookupName.toLowerCase().includes('lämmitys')) {
//     return '[calc:heating-calculation]';
//   }
//
//   if (lookupName.toLowerCase().includes('säästö')) {
//     return '[calc:savings-calculation]';
//   }
//
//   return null; // No fallback found
// }
