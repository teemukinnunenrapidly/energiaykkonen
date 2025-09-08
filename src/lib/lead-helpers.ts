import { Lead, LeadFormData } from './supabase';

/**
 * Helper functions for working with JSONB lead data
 */

/**
 * Extract and flatten lead data from JSONB structure
 * This provides backward compatibility for components expecting the old structure
 */
export function flattenLeadData(lead: Lead): any {
  if (!lead.form_data) {
    return lead;
  }

  // Extract commonly used fields from form_data for easier access
  return {
    ...lead,
    // Property details
    neliot: lead.form_data?.neliot,
    huonekorkeus: lead.form_data?.huonekorkeus,
    rakennusvuosi: lead.form_data?.rakennusvuosi,
    floors: lead.form_data?.floors,
    henkilomaara: lead.form_data?.henkilomaara,
    hot_water_usage: lead.form_data?.hot_water_usage,

    // Address (also check top-level fields since they exist in Lead interface)
    osoite: lead.osoite || lead.form_data?.osoite,
    paikkakunta: lead.paikkakunta || lead.form_data?.paikkakunta,

    // Heating
    lammitysmuoto: lead.form_data?.lammitysmuoto,
    vesikiertoinen: lead.form_data?.vesikiertoinen,
    current_energy_consumption: lead.form_data?.current_energy_consumption,

    // Calculations (check both form_data and calculation_results)
    annual_energy_need:
      lead.form_data?.annual_energy_need || lead.calculation_results?.annual_energy_need,
    heat_pump_consumption:
      lead.form_data?.heat_pump_consumption || lead.calculation_results?.heat_pump_consumption,
    heat_pump_cost_annual:
      lead.form_data?.heat_pump_cost_annual || lead.calculation_results?.heat_pump_cost_annual,
    annual_savings: lead.calculation_results?.annual_savings,
    five_year_savings: lead.calculation_results?.five_year_savings,
    ten_year_savings: lead.calculation_results?.ten_year_savings,
    payback_period: lead.form_data?.payback_period || lead.calculation_results?.payback_period,
    co2_reduction: lead.form_data?.co2_reduction || lead.calculation_results?.co2_reduction,

    // Preferences
    valittutukimuoto: lead.form_data?.valittutukimuoto,
    message: lead.form_data?.message,
  };
}

/**
 * Flatten an array of leads
 */
export function flattenLeadsData(leads: Lead[]): any[] {
  return leads.map(flattenLeadData);
}

/**
 * Get a value from lead, checking both form_data and top-level fields
 */
export function getLeadValue(lead: Lead, field: string): any {
  // Check if it's a fixed column
  if (field in lead && field !== 'form_data') {
    return (lead as any)[field];
  }

  // Check in form_data
  if (lead.form_data && field in lead.form_data) {
    return lead.form_data[field];
  }

  // Fallback to checking if it exists as a virtual field
  return (lead as any)[field];
}

/**
 * Create a lead object with proper JSONB structure from form data
 */
export function createLeadFromFormData(
  formData: Record<string, any>,
  calculations: Record<string, any>
): Partial<Lead> {
  // Define which fields are fixed columns (not in JSONB)
  const fixedFields = [
    'first_name',
    'last_name',
    'sahkoposti',
    'puhelinnumero',
    'status',
    'notes',
    'annual_savings',
    'five_year_savings',
    'ten_year_savings',
    'pdf_url',
    'pdf_generated_at',
    'ip_address',
    'user_agent',
    'source_page',
  ];

  // Separate fixed fields from dynamic fields
  const leadData: Partial<Lead> = {};
  const formDataFields: LeadFormData = {};

  // Process form data
  Object.entries(formData).forEach(([key, value]) => {
    if (fixedFields.includes(key)) {
      (leadData as any)[key] = value;
    } else {
      formDataFields[key] = value;
    }
  });

  // Add calculations to form_data
  Object.entries(calculations).forEach(([key, value]) => {
    if (fixedFields.includes(key)) {
      (leadData as any)[key] = value;
    } else {
      formDataFields[key] = value;
    }
  });

  // Add form_data to lead
  leadData.form_data = formDataFields;

  return leadData;
}

/**
 * Query helper to access JSONB fields in Supabase
 * Example: getJSONBQuery('neliot') returns "form_data->>'neliot'"
 */
export function getJSONBQuery(field: string): string {
  return `form_data->>'${field}'`;
}

/**
 * Build a Supabase filter for JSONB fields
 */
export function buildJSONBFilter(
  query: any,
  field: string,
  operator: string,
  value: any
): any {
  const jsonbPath = `form_data.${field}`;

  switch (operator) {
    case 'eq':
      return query.eq(jsonbPath, value);
    case 'neq':
      return query.neq(jsonbPath, value);
    case 'gt':
      return query.gt(jsonbPath, value);
    case 'gte':
      return query.gte(jsonbPath, value);
    case 'lt':
      return query.lt(jsonbPath, value);
    case 'lte':
      return query.lte(jsonbPath, value);
    case 'like':
      return query.like(jsonbPath, value);
    case 'ilike':
      return query.ilike(jsonbPath, value);
    case 'is':
      return query.is(jsonbPath, value);
    case 'in':
      return query.in(jsonbPath, value);
    default:
      return query;
  }
}
