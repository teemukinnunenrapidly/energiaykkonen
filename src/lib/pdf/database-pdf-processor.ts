/**
 * Database-driven PDF shortcode processor
 * Fetches shortcode definitions from Supabase and processes them dynamically
 */

import { supabase, Lead } from '@/lib/supabase';
import { evaluateFormula } from './safe-formula-evaluator';

export interface PDFShortcode {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  source_type: 'field' | 'formula' | 'static' | 'special';
  source_value: string;
  format_type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  format_options?: Record<string, any>;
  fallback_value?: string;
  is_active: boolean;
}

export class DatabasePDFProcessor {
  private shortcodes: PDFShortcode[] = [];
  private lead: Lead;
  private customValues: Record<string, any>;
  private cache: Map<string, any> = new Map();

  constructor(lead: Lead, customValues: Record<string, any> = {}) {
    this.lead = lead;
    this.customValues = customValues;
  }

  /**
   * Load shortcodes from database
   */
  async loadShortcodes(): Promise<void> {
    const { data, error } = await supabase
      .from('pdf_shortcodes')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to load PDF shortcodes:', error);
      throw new Error('Could not load PDF shortcodes from database');
    }

    this.shortcodes = data || [];
    console.log(
      `Loaded ${this.shortcodes.length} active shortcodes from database`
    );
  }

  /**
   * Process a template string, replacing all shortcodes with values
   */
  async process(template: string): Promise<string> {
    // Ensure shortcodes are loaded
    if (this.shortcodes.length === 0) {
      await this.loadShortcodes();
    }

    let processedTemplate = template;

    // Process each shortcode
    for (const shortcode of this.shortcodes) {
      const value = await this.resolveShortcodeValue(shortcode);
      const formattedValue = this.formatValue(
        value,
        shortcode.format_type,
        shortcode.format_options
      );

      // Replace all occurrences of this shortcode in the template
      processedTemplate = processedTemplate.replace(
        new RegExp(this.escapeRegex(shortcode.code), 'g'),
        formattedValue
      );
    }

    return processedTemplate;
  }

  /**
   * Resolve the value for a shortcode based on its configuration
   */
  private async resolveShortcodeValue(shortcode: PDFShortcode): Promise<any> {
    // Check cache first
    if (this.cache.has(shortcode.code)) {
      return this.cache.get(shortcode.code);
    }

    let value: any;

    try {
      switch (shortcode.source_type) {
        case 'field':
          // Direct field access from lead object
          value = this.getFieldValue(shortcode.source_value);
          break;

        case 'formula':
          // Evaluate mathematical formula
          value = this.evaluateFormula(shortcode.source_value);
          break;

        case 'static':
          // Static value
          value = shortcode.source_value;
          break;

        case 'special':
          // Special function
          value = await this.evaluateSpecialFunction(shortcode.source_value);
          break;

        default:
          value = null;
      }
    } catch (error) {
      console.error(`Error resolving shortcode ${shortcode.code}:`, error);
      value = null;
    }

    // Use fallback if value is null/undefined
    if (value === null || value === undefined) {
      value = shortcode.fallback_value || '';
    }

    // Cache the result
    this.cache.set(shortcode.code, value);

    return value;
  }

  /**
   * Get a field value from the lead object using dot notation
   */
  private getFieldValue(fieldPath: string): any {
    // First check custom values
    if (fieldPath in this.customValues) {
      return this.customValues[fieldPath];
    }

    // Then check lead object
    const parts = fieldPath.split('.');
    let value: any = this.lead;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part as keyof typeof value];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate a formula using the safe evaluator
   */
  private evaluateFormula(formula: string): any {
    // Combine lead data and custom values for context
    const context = {
      ...this.lead,
      ...this.customValues,
    };

    return evaluateFormula(formula, context);
  }

  /**
   * Evaluate special functions
   */
  private async evaluateSpecialFunction(functionName: string): Promise<any> {
    switch (functionName) {
      case 'current_date':
        return new Date().toLocaleDateString('fi-FI');

      case 'current_time':
        return new Date().toLocaleTimeString('fi-FI');

      case 'calculation_number':
        const year = new Date().getFullYear();
        const idPart = this.lead.id?.slice(0, 6).toUpperCase() || '000001';
        return `${year}-${idPart}`;

      case 'translate_heating_type':
        return this.translateHeatingType(
          this.lead.form_data?.lammitysmuoto || ''
        );

      case 'efficiency_rating':
        return this.calculateEfficiencyRating();

      case 'full_name':
        return this.lead.nimi || '';

      case 'full_address':
        const parts = [this.lead.osoite, this.lead.paikkakunta].filter(Boolean);
        return parts.join(', ');

      default:
        console.warn(`Unknown special function: ${functionName}`);
        return '';
    }
  }

  /**
   * Format a value based on type and options
   */
  private formatValue(
    value: any,
    type?: string,
    options?: Record<string, any>
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const opts = options || {};

    switch (type) {
      case 'currency':
        const amount =
          typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(amount)) {
          return String(value);
        }

        return new Intl.NumberFormat('fi-FI', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: opts.decimals ?? 0,
          maximumFractionDigits: opts.decimals ?? 0,
        }).format(amount);

      case 'number':
        const num =
          typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(num)) {
          return String(value);
        }

        let formatted = new Intl.NumberFormat('fi-FI', {
          minimumFractionDigits: opts.decimals ?? 0,
          maximumFractionDigits: opts.decimals ?? 2,
        }).format(num);

        if (opts.prefix) {
          formatted = opts.prefix + formatted;
        }
        if (opts.suffix) {
          formatted = formatted + opts.suffix;
        }

        return formatted;

      case 'percentage':
        const percent =
          typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(percent)) {
          return String(value);
        }

        return (
          new Intl.NumberFormat('fi-FI', {
            minimumFractionDigits: opts.decimals ?? 1,
            maximumFractionDigits: opts.decimals ?? 1,
          }).format(percent) + ' %'
        );

      case 'date':
        const date = value instanceof Date ? value : new Date(String(value));
        if (isNaN(date.getTime())) {
          return String(value);
        }

        if (opts.format === 'iso') {
          return date.toISOString().split('T')[0];
        } else if (opts.format === 'long') {
          return date.toLocaleDateString('fi-FI', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } else {
          return date.toLocaleDateString('fi-FI');
        }

      case 'text':
      default:
        let text = String(value);
        if (opts.prefix) {
          text = opts.prefix + text;
        }
        if (opts.suffix) {
          text = text + opts.suffix;
        }
        return text;
    }
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Translation helpers
   */
  private translateHeatingType(type: string): string {
    const translations: Record<string, string> = {
      Oil: 'Öljylämmitys',
      Electric: 'Sähkölämmitys',
      District: 'Kaukolämpö',
      Other: 'Muu',
    };
    return translations[type] || type;
  }

  /**
   * Calculate efficiency rating based on savings
   */
  private calculateEfficiencyRating(): string {
    const savingsPercentage = this.lead.form_data?.vesikiertoinen
      ? ((this.lead.calculation_results?.annual_savings || 0) /
          this.lead.form_data.vesikiertoinen) *
        100
      : 0;

    if (savingsPercentage >= 70) {
      return 'A+';
    }
    if (savingsPercentage >= 60) {
      return 'A';
    }
    if (savingsPercentage >= 50) {
      return 'B';
    }
    if (savingsPercentage >= 40) {
      return 'C';
    }
    if (savingsPercentage >= 30) {
      return 'D';
    }
    return 'E';
  }

  /**
   * Get all available shortcodes (for admin UI)
   */
  async getAvailableShortcodes(): Promise<PDFShortcode[]> {
    if (this.shortcodes.length === 0) {
      await this.loadShortcodes();
    }
    return this.shortcodes;
  }

  /**
   * Get shortcodes by category (for admin UI)
   */
  async getShortcodesByCategory(category: string): Promise<PDFShortcode[]> {
    if (this.shortcodes.length === 0) {
      await this.loadShortcodes();
    }
    return this.shortcodes.filter(sc => sc.category === category);
  }

  /**
   * Get all categories (for admin UI)
   */
  async getCategories(): Promise<string[]> {
    if (this.shortcodes.length === 0) {
      await this.loadShortcodes();
    }
    const categories = new Set(this.shortcodes.map(sc => sc.category));
    return Array.from(categories).sort();
  }
}

/**
 * Process PDF data using database shortcodes
 */
export async function processPDFWithDatabaseShortcodes(
  template: string,
  lead: Lead,
  customValues?: Record<string, any>
): Promise<string> {
  const processor = new DatabasePDFProcessor(lead, customValues);
  return processor.process(template);
}

/**
 * Validate that a template has all its shortcodes defined
 */
export async function validatePDFTemplate(template: string): Promise<{
  valid: boolean;
  missingShortcodes: string[];
  definedShortcodes: string[];
}> {
  // Extract all shortcodes from the template
  const shortcodePattern = /\[[^\]]+\]/g;
  const foundShortcodes = template.match(shortcodePattern) || [];
  const uniqueShortcodes = Array.from(new Set(foundShortcodes));

  // Load available shortcodes from database
  const { data: availableShortcodes } = await supabase
    .from('pdf_shortcodes')
    .select('code')
    .eq('is_active', true);

  const availableCodes = new Set(
    (availableShortcodes || []).map(sc => sc.code)
  );

  const missingShortcodes = uniqueShortcodes.filter(
    code => !availableCodes.has(code)
  );
  const definedShortcodes = uniqueShortcodes.filter(code =>
    availableCodes.has(code)
  );

  return {
    valid: missingShortcodes.length === 0,
    missingShortcodes,
    definedShortcodes,
  };
}
