/**
 * Main PDF shortcode processor - uses database-driven shortcodes
 * This is the primary interface for processing PDF templates
 */

import { Lead } from '@/lib/supabase';
import { DatabasePDFProcessor } from './database-pdf-processor';

/**
 * Process shortcodes in a template using database definitions
 * @param template - The template string containing shortcodes
 * @param lead - The lead data object
 * @param customValues - Optional custom values to add to the context
 * @returns Processed template with all shortcodes replaced
 */
export async function processShortcodes(
  template: string, 
  lead: Lead,
  customValues?: Record<string, any>
): Promise<string> {
  const processor = new DatabasePDFProcessor(lead, customValues);
  return processor.process(template);
}

/**
 * Re-export the database processor for advanced usage
 */
export { DatabasePDFProcessor } from './database-pdf-processor';
export type { PDFShortcode } from './database-pdf-processor';

/**
 * Validate a PDF template
 */
export { validatePDFTemplate } from './database-pdf-processor';

/**
 * Export safe formula evaluator utilities
 */
export { 
  evaluateFormula, 
  validateFormula,
  getEvaluator 
} from './safe-formula-evaluator';