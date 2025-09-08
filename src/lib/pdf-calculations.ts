/**
 * PDF Calculation Service
 * Extracts shortcodes from PDF templates and calculates all values needed for PDF generation
 * Uses separate PDF-specific calculation definitions
 */

import { createUnifiedEngine } from './unified-calculation-engine';
import { supabase } from './supabase';
import type { CalculationResults } from './supabase';
import { 
  generatePDFCalculations, 
  extractFormData,
  PDF_CALCULATIONS 
} from './pdf-calculation-definitions';

/**
 * Extract all unique shortcodes from a PDF template
 */
export function extractShortcodesFromTemplate(template: string): string[] {
  const shortcodes = new Set<string>();

  // Match all shortcode patterns: [calc:name], [lookup:name], [form:field]
  const shortcodePattern = /\[(calc|lookup|form):([^\]]+)\]/g;

  let match;
  while ((match = shortcodePattern.exec(template)) !== null) {
    shortcodes.add(`[${match[1]}:${match[2]}]`);
  }

  return Array.from(shortcodes);
}

/**
 * Calculate all values needed for PDF generation based on lead form_data
 * This is the main entry point for PDF calculations
 */
export async function calculatePDFValues(
  formData: Record<string, any>,
  sessionId?: string
): Promise<CalculationResults> {
  try {
    console.log('📊 Starting PDF calculations using form_data...');

    // 1. Get the active PDF template
    const { data: pdfTemplate, error: templateError } = await supabase
      .from('pdf_templates')
      .select('template_html')
      .eq('is_active', true)
      .single();

    if (templateError || !pdfTemplate) {
      console.warn('No active PDF template found, using default calculations');
      return getDefaultCalculations(formData);
    }

    // 2. Extract all shortcodes from the template
    const shortcodes = extractShortcodesFromTemplate(pdfTemplate.template_html);
    console.log(
      `📝 Found ${shortcodes.length} shortcodes in PDF template:`,
      shortcodes
    );

    // 3. Create calculation engine with form data
    const engine = createUnifiedEngine(sessionId || 'pdf-calc', formData);

    // 4. Process each shortcode and collect results
    const results: CalculationResults = {};

    for (const shortcode of shortcodes) {
      try {
        // Parse shortcode type and name
        const match = shortcode.match(/\[(calc|lookup|form):([^\]]+)\]/);
        if (!match) {
          continue;
        }

        const [, type, name] = match;
        const key = `${type}_${name.replace(/-/g, '_')}`;

        // Process based on type
        if (type === 'form') {
          // Direct form field value
          results[key] = formData[name];
        } else {
          // Calculate using unified engine
          const result = await engine.process(shortcode);
          if (result.success && result.result) {
            // Store numeric value if possible
            const numericValue = parseFloat(
              String(result.result)
                .replace(/\s/g, '') // Remove spaces
                .replace(',', '.') // Convert comma to dot
            );
            results[key] = isNaN(numericValue) ? result.result : numericValue;
          }
        }

        console.log(`✅ Calculated ${key}: ${results[key]}`);
      } catch (error) {
        console.warn(`Failed to calculate shortcode ${shortcode}:`, error);
      }
    }

    // 5. Add standard calculations that should always be present
    const standardCalcs = await calculateStandardMetrics(formData, engine);

    // Merge standard calculations with template-specific ones
    return {
      ...standardCalcs,
      ...results,
    };
  } catch (error) {
    console.error('Error calculating PDF values:', error);
    return getDefaultCalculations(formData);
  }
}

/**
 * Calculate standard metrics that should always be present
 * Uses PDF-specific calculations based on form_data
 */
async function calculateStandardMetrics(
  formData: Record<string, any>,
  engine: any
): Promise<CalculationResults> {
  // Use PDF-specific calculations
  const calculatedMetrics = generatePDFCalculations(formData) as any;

  // Also get values from database formulas/lookups for additional data
  const results: CalculationResults = {};

  // Standard database-driven calculations
  const standardShortcodes = [
    '[calc:annual-energy-need]',
    '[calc:heat-pump-consumption]',
    '[calc:heat-pump-cost-annual]',
    '[lookup:kokonaismenekki]',
    '[lookup:menekin-hinta]',
    '[calc:annual-savings]',
    '[calc:five-year-savings]',
    '[calc:ten-year-savings]',
    '[calc:payback-period]',
    '[calc:co2-reduction]',
  ];

  for (const shortcode of standardShortcodes) {
    try {
      const result = await engine.process(shortcode);
      if (result.success && result.result) {
        const key = shortcode
          .replace(/\[|\]/g, '')
          .replace(/:/g, '_')
          .replace(/-/g, '_');

        // Parse numeric value
        const numericValue = parseFloat(
          String(result.result).replace(/\s/g, '').replace(',', '.')
        );

        results[key] = isNaN(numericValue) ? result.result : numericValue;
      }
    } catch (error) {
      console.warn(`Failed to calculate database metric ${shortcode}:`, error);
    }
  }

  // Merge calculated metrics with database results (prioritize calculated)
  return {
    // Energy metrics
    annual_energy_need:
      calculatedMetrics.annual_energy_need || results.calc_annual_energy_need,
    heat_pump_consumption:
      calculatedMetrics.heat_pump_consumption ||
      results.calc_heat_pump_consumption,
    heat_pump_cost_annual:
      calculatedMetrics.heat_pump_cost_annual ||
      results.calc_heat_pump_cost_annual,
    current_heating_cost:
      calculatedMetrics.current_heating_cost ||
      results.lookup_menekin_hinta ||
      formData.menekinhintavuosi,

    // Savings metrics
    annual_savings:
      calculatedMetrics.annual_savings || results.calc_annual_savings,
    five_year_savings:
      calculatedMetrics.five_year_savings || results.calc_five_year_savings,
    ten_year_savings:
      calculatedMetrics.ten_year_savings || results.calc_ten_year_savings,
    monthly_savings: calculatedMetrics.monthly_savings,

    // Financial metrics
    payback_period:
      calculatedMetrics.payback_period || results.calc_payback_period,
    return_on_investment: calculatedMetrics.return_on_investment,

    // Environmental metrics
    co2_reduction:
      calculatedMetrics.co2_reduction || results.calc_co2_reduction,
    efficiency_improvement: calculatedMetrics.efficiency_improvement,

    // Include all other results
    ...results,
  };
}

/**
 * Get default calculations when template processing fails
 * Uses PDF-specific calculations as fallback
 */
function getDefaultCalculations(
  formData: Record<string, any>
): CalculationResults {
  // Use PDF-specific calculations to ensure consistent results
  const pdfMetrics = generatePDFCalculations(formData) as any;
  
  // Return calculated values with fallback to form_data if available
  return {
    annual_energy_need: pdfMetrics.annual_energy_need || 
      formData.annual_energy_need || 
      formData.laskennallinenenergiantarve,
    heat_pump_consumption: pdfMetrics.heat_pump_consumption || 
      formData.heat_pump_consumption,
    heat_pump_cost_annual: pdfMetrics.heat_pump_cost_annual || 
      formData.heat_pump_cost_annual,
    current_heating_cost: pdfMetrics.current_heating_cost ||
      formData.menekinhintavuosi || 
      formData.current_heating_cost,
    annual_savings: pdfMetrics.annual_savings || 
      formData.annual_savings,
    five_year_savings: pdfMetrics.five_year_savings || 
      formData.five_year_savings,
    ten_year_savings: pdfMetrics.ten_year_savings || 
      formData.ten_year_savings,
    payback_period: pdfMetrics.payback_period || 
      formData.payback_period,
    co2_reduction: pdfMetrics.co2_reduction || 
      formData.co2_reduction,
  };
}
