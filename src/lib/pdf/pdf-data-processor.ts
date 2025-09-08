/**
 * Main PDF data processor
 * Uses database-driven shortcodes for processing PDF data
 */

import { Lead } from '@/lib/supabase';
import { DatabasePDFProcessor } from './database-pdf-processor';
import { flattenLeadData } from '@/lib/lead-helpers';

/**
 * Process lead data into PDF-ready format using hardcoded calculations
 */
export async function processPDFData(lead: Lead): Promise<Record<string, any>> {
  // Use our PDF-specific calculations directly
  const { generatePDFCalculations } = await import('../pdf-calculation-definitions');
  
  // Generate all PDF calculations from the lead
  const pdfCalculations = generatePDFCalculations(lead);
  
  // Flatten lead data to access JSONB fields
  const flatLead = flattenLeadData(lead);
  
  // Build PDF data object with all necessary fields
  const pdfData: Record<string, any> = {
    // All calculated values from PDF calculations
    ...pdfCalculations,
    
    // Customer information
    customerName: flatLead.nimi || `${flatLead.first_name} ${flatLead.last_name}`.trim() || 'Asiakas',
    customerAddress: flatLead.osoite || '',
    customerEmail: flatLead.sahkoposti || '',
    customerPhone: flatLead.puhelinnumero || '',
    customerCity: flatLead.paikkakunta || '',
    
    // Property information
    propertySize: `${flatLead.neliot || 0} m²`,
    buildingYear: flatLead.rakennusvuosi || '',
    buildingArea: flatLead.neliot || 0,
    peopleCount: flatLead.henkilomaara || 2,
    
    // Current heating system
    currentSystem: flatLead.lammitysmuoto || 'Nykyinen lämmitys',
    oilConsumption: Math.round((flatLead.laskennallinenenergiantarve || 0) / 10) || 2000,
    oilPrice: '1,30',
    currentMaintenance: 200,
    
    // New system (heat pump) - using calculated values
    electricityConsumption: pdfCalculations.new_electricity_consumption,
    electricityPrice: pdfCalculations.electricity_price,
    newMaintenance10Years: 30,
    
    // Cost comparisons - using calculated values
    currentYear1Cost: pdfCalculations.current_cost_1year,
    currentYear5Cost: pdfCalculations.current_cost_5years, 
    currentYear10Cost: pdfCalculations.current_cost_10years,
    newYear1Cost: pdfCalculations.new_cost_1year,
    newYear5Cost: pdfCalculations.new_cost_5years,
    newYear10Cost: pdfCalculations.new_cost_10years,
    
    // Savings - using calculated values
    savings1Year: pdfCalculations.savings_1year,
    savings5Year: pdfCalculations.savings_5years,
    savings10Year: pdfCalculations.savings_10years,
    annualSavings: pdfCalculations.annual_savings,
    fiveYearSavings: pdfCalculations.five_year_savings,
    tenYearSavings: pdfCalculations.ten_year_savings,
    
    // Environmental impact
    currentCO2: pdfCalculations.current_co2_yearly,
    newCO2: pdfCalculations.new_co2_yearly,
    co2Reduction: pdfCalculations.co2_reduction_yearly,
    
    // Heat pump details
    heat_pump_consumption: pdfCalculations.heat_pump_consumption,
    heat_pump_cost_annual: pdfCalculations.heat_pump_cost_annual,
    
    // Document metadata
    calculationNumber: flatLead.id?.slice(0, 8).toUpperCase() || Date.now().toString(36).toUpperCase(),
    calculationDate: new Date().toLocaleDateString('fi-FI'),
    
    // Energy calculations
    energyNeed: flatLead.laskennallinenenergiantarve || 0,
    annual_energy_need: flatLead.laskennallinenenergiantarve || 0,
    total_energy_need: flatLead.laskennallinenenergiantarve || 0,
  };

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
