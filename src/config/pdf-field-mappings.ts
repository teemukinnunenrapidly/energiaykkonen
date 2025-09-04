// src/config/pdf-field-mappings.ts

/**
 * PDF Field Mappings Configuration
 * 
 * Maps PDF template fields to data sources:
 * - {field_name} - Form field values from user input
 * - [calc:formula_name] - Calculated values from formulas
 * - [lookup:value_name] - Lookup values from database
 * - CURRENT_DATE - Current date
 * - AUTO_GENERATE - Auto-generated values
 */

export const pdfFieldMappings = {
  // Asiakastiedot (Customer Information)
  customerName: '{name}',
  customerEmail: '{email}',
  customerPhone: '{phone}',
  customerAddress: '{address}',
  customerCity: '{postcode} {city}',
  peopleCount: '{people_count}',
  buildingYear: '{building_year}',
  buildingArea: '{building_area}',
  floors: '{floors}',
  energyNeed: '[calc:total_energy_need]',
  
  // Nykyinen järjestelmä (Current System)
  currentSystem: '{current_heating}',
  oilConsumption: '[calc:oil_consumption]',
  oilPrice: '[lookup:oil_price]',
  currentMaintenance: '[lookup:oil_maintenance]',
  currentCO2: '[calc:current_co2]',
  currentYear1Cost: '[calc:current_yearly_cost]',
  currentYear5Cost: '[calc:current_5year_cost]',
  currentYear10Cost: '[calc:current_10year_cost]',
  
  // Uusi järjestelmä (New System)
  electricityConsumption: '[calc:heat_pump_consumption]',
  electricityPrice: '[lookup:electricity_price]',
  newYear1Cost: '[calc:new_yearly_cost]',
  newYear5Cost: '[calc:new_5year_cost]',
  newYear10Cost: '[calc:new_10year_cost]',
  newMaintenance5Years: '[lookup:heat_pump_maintenance_5y]',
  newMaintenance10Years: '[lookup:heat_pump_maintenance_10y]',
  newCO2: '[calc:new_co2]',
  
  // Säästöt (Savings)
  savings1Year: '[calc:yearly_savings]',
  savings5Year: '[calc:5year_savings]',
  savings10Year: '[calc:10year_savings]',
  elySupport: '[lookup:ely_support]',
  kotitalousvahennys: '[calc:household_deduction]',
  
  // Järjestelmän tiedot (System Information)
  heatPumpModel: '[lookup:recommended_heat_pump]',
  heatPumpCOP: '[lookup:heat_pump_cop]',
  
  // Metadata
  calculationDate: 'CURRENT_DATE',
  calculationNumber: 'AUTO_GENERATE',
  companyName: 'ENERGIAYKKÖNEN OY',
  companyId: '2635343-7',
  companyAddress: 'Koivupurontie 6 b',
  companyPostcode: '40320 Jyväskylä',
  companyWebsite: 'www.energiaykkonen.fi',
  companyEmail: 'info@energiaykkonen.fi',
};

/**
 * PDF formatting configuration
 * Defines how different types of values should be formatted
 */
export const pdfFormatting = {
  currency: {
    style: 'currency',
    currency: 'EUR',
    locale: 'fi-FI',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
  number: {
    locale: 'fi-FI',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
  decimal: {
    locale: 'fi-FI',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  },
  percentage: {
    style: 'percent',
    locale: 'fi-FI',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
  date: {
    locale: 'fi-FI',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  },
};

/**
 * Field type definitions for automatic formatting
 */
export const fieldTypes: Record<string, keyof typeof pdfFormatting> = {
  // Currency fields
  oilPrice: 'currency',
  electricityPrice: 'currency',
  currentYear1Cost: 'currency',
  currentYear5Cost: 'currency',
  currentYear10Cost: 'currency',
  newYear1Cost: 'currency',
  newYear5Cost: 'currency',
  newYear10Cost: 'currency',
  savings1Year: 'currency',
  savings5Year: 'currency',
  savings10Year: 'currency',
  elySupport: 'currency',
  kotitalousvahennys: 'currency',
  currentMaintenance: 'currency',
  newMaintenance5Years: 'currency',
  newMaintenance10Years: 'currency',
  
  // Number fields
  peopleCount: 'number',
  buildingYear: 'number',
  buildingArea: 'number',
  floors: 'number',
  energyNeed: 'number',
  oilConsumption: 'number',
  electricityConsumption: 'number',
  currentCO2: 'number',
  newCO2: 'number',
  
  // Decimal fields
  heatPumpCOP: 'decimal',
  
  // Date fields
  calculationDate: 'date',
};

/**
 * Helper function to get mapped value with proper formatting
 */
export function getMappedValue(fieldName: keyof typeof pdfFieldMappings): string {
  return pdfFieldMappings[fieldName];
}

/**
 * Helper function to get field type for formatting
 */
export function getFieldType(fieldName: string): keyof typeof pdfFormatting | undefined {
  return fieldTypes[fieldName];
}

/**
 * Process all mappings for PDF generation
 * This function will be used to prepare data for the PDF
 */
export async function processPDFMappings(
  formData: Record<string, any>,
  sessionId: string
): Promise<Record<string, any>> {
  const processedData: Record<string, any> = {};
  
  // This will be implemented to process all mappings
  // using the shortcode processor
  
  return processedData;
}