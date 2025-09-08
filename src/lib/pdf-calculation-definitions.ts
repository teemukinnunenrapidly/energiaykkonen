/**
 * PDF Calculation Definitions
 * Simplified calculations specifically for PDF generation
 * Uses lead form_data fields: menekinhintavuosi and laskennallinenenergiantarve
 */

export const PDF_CALCULATION_CONSTANTS = {
  // Heat pump efficiency (COP - Coefficient of Performance)
  HEAT_PUMP_COP: 3.8,
  
  // Electricity price per kWh
  ELECTRICITY_PRICE: 0.15, // €/kWh
  
  // CO2 emission factors
  CO2_PER_KWH_ELECTRICITY: 0.181, // kg CO2/kWh (Finnish grid average)
  CO2_PER_LITER_OIL: 2.66, // kg CO2/liter
  CO2_PER_KWH_DISTRICT: 0.188, // kg CO2/kWh (district heating)
  
  // Conversion factors
  KWH_PER_LITER_OIL: 10, // kWh/liter of heating oil
};

/**
 * Interface for form data from leads table
 */
export interface PDFFormData {
  // Required calculation fields
  menekinhintavuosi?: number; // Current annual heating cost in €
  laskennallinenenergiantarve?: number; // Calculated energy need in kWh/year
  lammitysmuoto?: string; // Heating type for CO2 calculation
  
  // Customer info for PDF
  nimi?: string;
  sahkoposti?: string;
  puhelinnumero?: string;
  osoite?: string;
  paikkakunta?: string;
  postinumero?: string;
  
  // Property info for display
  neliot?: number;
  huonekorkeus?: number;
  rakennusvuosi?: number;
  henkilomaara?: number;
  
  // Any additional fields
  [key: string]: any;
}

/**
 * Extract and normalize form data from lead
 */
export function extractFormData(lead: any): PDFFormData {
  // Handle both direct properties and form_data nested object
  const formData = lead.form_data || lead;
  
  return {
    // Required calculation fields
    menekinhintavuosi: parseFloat(formData.menekinhintavuosi || 0),
    laskennallinenenergiantarve: parseFloat(formData.laskennallinenenergiantarve || 0),
    lammitysmuoto: formData.lammitysmuoto || '',
    
    // Customer information
    nimi: formData.nimi || '',
    sahkoposti: formData.sahkoposti || '',
    puhelinnumero: formData.puhelinnumero || '',
    osoite: formData.osoite || '',
    paikkakunta: formData.paikkakunta || '',
    postinumero: formData.postinumero || '',
    
    // Property information
    neliot: parseFloat(formData.neliot || 0),
    huonekorkeus: parseFloat(formData.huonekorkeus || 2.5),
    rakennusvuosi: parseInt(formData.rakennusvuosi || 1980),
    henkilomaara: parseInt(formData.henkilomaara || 2),
    
    // Pass through all other fields
    ...formData,
  };
}

/**
 * Calculate CO2 emissions based on heating type and energy consumption
 */
export function calculateCO2Emissions(formData: PDFFormData): number {
  const energyNeed = formData.laskennallinenenergiantarve || 0;
  const heatingType = (formData.lammitysmuoto || '').toLowerCase();
  
  let co2PerYear = 0;
  
  switch (heatingType) {
    case 'öljylämmitys':
    case 'oil':
      // Convert kWh to liters of oil, then to CO2
      const litersOfOil = energyNeed / PDF_CALCULATION_CONSTANTS.KWH_PER_LITER_OIL;
      co2PerYear = litersOfOil * PDF_CALCULATION_CONSTANTS.CO2_PER_LITER_OIL;
      break;
      
    case 'sähkölämmitys':
    case 'suora sähkölämmitys':
    case 'electric':
      co2PerYear = energyNeed * PDF_CALCULATION_CONSTANTS.CO2_PER_KWH_ELECTRICITY;
      break;
      
    case 'kaukolämpö':
    case 'district':
      co2PerYear = energyNeed * PDF_CALCULATION_CONSTANTS.CO2_PER_KWH_DISTRICT;
      break;
      
    default:
      // Default to electricity emissions if heating type unknown
      co2PerYear = energyNeed * PDF_CALCULATION_CONSTANTS.CO2_PER_KWH_ELECTRICITY;
  }
  
  return Math.round(co2PerYear);
}

/**
 * PDF-specific calculations based on template requirements
 */
export const PDF_CALCULATIONS = {
  /**
   * Current system calculations
   */
  currentSystem: {
    // Current energy cost for 5 years
    cost5Years: (formData: PDFFormData): number => {
      const annualCost = formData.menekinhintavuosi || 0;
      return Math.round(annualCost * 5);
    },
    
    // Current energy cost for 10 years
    cost10Years: (formData: PDFFormData): number => {
      const annualCost = formData.menekinhintavuosi || 0;
      return Math.round(annualCost * 10);
    },
    
    // CO2 emissions per year
    co2PerYear: (formData: PDFFormData): number => {
      return calculateCO2Emissions(formData);
    },
  },
  
  /**
   * New heat pump system calculations
   */
  newSystem: {
    // Energy cost with new system, first year
    // Formula: (laskennallinenenergiantarve / 3.8) * 0.15€
    costYear1: (formData: PDFFormData): number => {
      const energyNeed = formData.laskennallinenenergiantarve || 0;
      const heatPumpConsumption = energyNeed / PDF_CALCULATION_CONSTANTS.HEAT_PUMP_COP;
      const annualCost = heatPumpConsumption * PDF_CALCULATION_CONSTANTS.ELECTRICITY_PRICE;
      return Math.round(annualCost);
    },
    
    // Energy cost with new system for 5 years
    cost5Years: (formData: PDFFormData): number => {
      const energyNeed = formData.laskennallinenenergiantarve || 0;
      const heatPumpConsumption = energyNeed / PDF_CALCULATION_CONSTANTS.HEAT_PUMP_COP;
      const annualCost = heatPumpConsumption * PDF_CALCULATION_CONSTANTS.ELECTRICITY_PRICE;
      return Math.round(annualCost * 5);
    },
    
    // Energy cost with new system for 10 years
    cost10Years: (formData: PDFFormData): number => {
      const energyNeed = formData.laskennallinenenergiantarve || 0;
      const heatPumpConsumption = energyNeed / PDF_CALCULATION_CONSTANTS.HEAT_PUMP_COP;
      const annualCost = heatPumpConsumption * PDF_CALCULATION_CONSTANTS.ELECTRICITY_PRICE;
      return Math.round(annualCost * 10);
    },
    
    // Heat pump electricity consumption (kWh/year)
    electricityConsumption: (formData: PDFFormData): number => {
      const energyNeed = formData.laskennallinenenergiantarve || 0;
      return Math.round(energyNeed / PDF_CALCULATION_CONSTANTS.HEAT_PUMP_COP);
    },
    
    // CO2 emissions with heat pump
    co2PerYear: (formData: PDFFormData): number => {
      const energyNeed = formData.laskennallinenenergiantarve || 0;
      const heatPumpConsumption = energyNeed / PDF_CALCULATION_CONSTANTS.HEAT_PUMP_COP;
      return Math.round(heatPumpConsumption * PDF_CALCULATION_CONSTANTS.CO2_PER_KWH_ELECTRICITY);
    },
  },
  
  /**
   * Savings calculations
   */
  savings: {
    // Savings first year
    // Formula: menekinhintavuosi - ((laskennallinenenergiantarve / 3.8) * 0.15€)
    year1: (formData: PDFFormData): number => {
      const currentCost = formData.menekinhintavuosi || 0;
      const newCost = PDF_CALCULATIONS.newSystem.costYear1(formData);
      return Math.round(currentCost - newCost);
    },
    
    // Savings for 5 years
    // Formula: (menekinhintavuosi * 5) - (((laskennallinenenergiantarve / 3.8) * 0.15€) * 5)
    year5: (formData: PDFFormData): number => {
      const currentCost5 = PDF_CALCULATIONS.currentSystem.cost5Years(formData);
      const newCost5 = PDF_CALCULATIONS.newSystem.cost5Years(formData);
      return Math.round(currentCost5 - newCost5);
    },
    
    // Savings for 10 years
    // Formula: (menekinhintavuosi * 10) - (((laskennallinenenergiantarve / 3.8) * 0.15€) * 10)
    year10: (formData: PDFFormData): number => {
      const currentCost10 = PDF_CALCULATIONS.currentSystem.cost10Years(formData);
      const newCost10 = PDF_CALCULATIONS.newSystem.cost10Years(formData);
      return Math.round(currentCost10 - newCost10);
    },
    
    // CO2 reduction per year
    co2Reduction: (formData: PDFFormData): number => {
      const currentCO2 = PDF_CALCULATIONS.currentSystem.co2PerYear(formData);
      const newCO2 = PDF_CALCULATIONS.newSystem.co2PerYear(formData);
      return Math.round(currentCO2 - newCO2);
    },
  },
};

/**
 * Generate all PDF calculations from a lead
 * Returns values matching the PDF template requirements
 */
export function generatePDFCalculations(lead: any) {
  const formData = extractFormData(lead);
  
  return {
    // Form data for display
    ...formData,
    
    // Current system values
    current_cost_1year: formData.menekinhintavuosi,
    current_cost_5years: PDF_CALCULATIONS.currentSystem.cost5Years(formData),
    current_cost_10years: PDF_CALCULATIONS.currentSystem.cost10Years(formData),
    current_co2_yearly: PDF_CALCULATIONS.currentSystem.co2PerYear(formData),
    
    // New system values
    new_cost_1year: PDF_CALCULATIONS.newSystem.costYear1(formData),
    new_cost_5years: PDF_CALCULATIONS.newSystem.cost5Years(formData),
    new_cost_10years: PDF_CALCULATIONS.newSystem.cost10Years(formData),
    new_electricity_consumption: PDF_CALCULATIONS.newSystem.electricityConsumption(formData),
    new_co2_yearly: PDF_CALCULATIONS.newSystem.co2PerYear(formData),
    
    // Savings values
    savings_1year: PDF_CALCULATIONS.savings.year1(formData),
    savings_5years: PDF_CALCULATIONS.savings.year5(formData),
    savings_10years: PDF_CALCULATIONS.savings.year10(formData),
    co2_reduction_yearly: PDF_CALCULATIONS.savings.co2Reduction(formData),
    
    // Keep legacy field names for compatibility
    annual_savings: PDF_CALCULATIONS.savings.year1(formData),
    five_year_savings: PDF_CALCULATIONS.savings.year5(formData),
    ten_year_savings: PDF_CALCULATIONS.savings.year10(formData),
    heat_pump_consumption: PDF_CALCULATIONS.newSystem.electricityConsumption(formData),
    heat_pump_cost_annual: PDF_CALCULATIONS.newSystem.costYear1(formData),
    co2_reduction: PDF_CALCULATIONS.savings.co2Reduction(formData),
    
    // Constants for display
    electricity_price: PDF_CALCULATION_CONSTANTS.ELECTRICITY_PRICE,
    heat_pump_cop: PDF_CALCULATION_CONSTANTS.HEAT_PUMP_COP,
  };
}