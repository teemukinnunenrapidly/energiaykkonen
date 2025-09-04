/**
 * Main PDF data processor
 * Uses database-driven shortcodes for processing PDF data
 */

import { Lead } from '@/lib/supabase';
import { DatabasePDFProcessor } from './database-pdf-processor';
import { flattenLeadData } from '@/lib/lead-helpers';

/**
 * Process lead data into PDF-ready format using database shortcodes
 */
export async function processPDFData(lead: Lead): Promise<Record<string, any>> {
  // Flatten lead data to access JSONB fields
  const flatLead = flattenLeadData(lead);
  const processor = new DatabasePDFProcessor(flatLead);

  // Load shortcodes from database
  await processor.loadShortcodes();

  // Get all shortcodes to build a data object
  const shortcodes = await processor.getAvailableShortcodes();
  const pdfData: Record<string, any> = {};

  // Process each shortcode
  for (const shortcode of shortcodes) {
    // Use the shortcode's code as the key (without brackets)
    const key = shortcode.code
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .replace(/_/g, '');

    // Process the shortcode to get its value
    const value = await processor.process(shortcode.code);

    pdfData[key] = value;
  }

  // Add some standard fields that PDF might expect
  pdfData.customerName = `${flatLead.first_name} ${flatLead.last_name}`.trim();
  pdfData.customerAddress = flatLead.osoite || '';
  pdfData.customerEmail = flatLead.sahkoposti;
  pdfData.customerPhone = flatLead.puhelinnumero;
  pdfData.propertySize = `${flatLead.neliot} m²`;
  pdfData.annualSavings = flatLead.annual_savings;
  pdfData.fiveYearSavings = flatLead.five_year_savings;
  pdfData.tenYearSavings = flatLead.ten_year_savings;
  pdfData.paybackPeriod = flatLead.payback_period;
  pdfData.calculationNumber = flatLead.id?.slice(0, 8).toUpperCase() || '';
  pdfData.calculationDate = new Date().toLocaleDateString('fi-FI');

  return pdfData;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use processPDFData(lead) instead
 */
export async function processPDFDataLegacy(
  formData: Record<string, any>,
  calculations?: Record<string, any>
): Promise<Record<string, any>> {
  // Convert old format to Lead format
  const lead: Lead = {
    id: formData.id || `temp-${Date.now()}`,

    // Form inputs
    neliot: formData.squareMeters || formData.neliot || 0,
    huonekorkeus: parseFloat(
      formData.ceilingHeight || formData.huonekorkeus || 2.5
    ),
    rakennusvuosi: formData.constructionYear || formData.rakennusvuosi || '',
    floors: parseInt(formData.floors) || 1,

    lammitysmuoto: formData.heatingType || formData.lammitysmuoto || '',
    vesikiertoinen: formData.annualHeatingCost || formData.vesikiertoinen || 0,
    current_energy_consumption: formData.currentEnergyConsumption,

    henkilomaara: parseInt(formData.henkilomaara) || 2,
    hot_water_usage:
      formData.hotWaterUsage || formData.hot_water_usage || 'Normal',

    first_name: formData.firstName || formData.first_name || '',
    last_name: formData.lastName || formData.last_name || '',
    sahkoposti: formData.sahkoposti || '',
    puhelinnumero: formData.puhelinnumero || '',
    osoite: formData.streetAddress || formData.osoite,
    paikkakunta: formData.paikkakunta,
    valittutukimuoto: formData.contactPreference || 'Email',
    message: formData.message,

    // Calculated values (merge with calculations parameter)
    annual_energy_need: calculations?.annualEnergyNeed || 0,
    heat_pump_consumption: calculations?.heatPumpConsumption || 0,
    heat_pump_cost_annual: calculations?.heatPumpCostAnnual || 0,
    annual_savings: calculations?.annualSavings || 0,
    five_year_savings: calculations?.fiveYearSavings || 0,
    ten_year_savings: calculations?.tenYearSavings || 0,
    payback_period: calculations?.paybackPeriod || 0,
    co2_reduction: calculations?.co2Reduction || 0,

    // Metadata
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return processPDFData(lead);
}
