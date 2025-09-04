/**
 * Comprehensive PDF field mappings based on saastolaskelma.html
 * Each key represents a field in the PDF, value is the shortcode to resolve it
 */

export const pdfShortcodeMappings = {
  // ===== HEADER SECTION =====
  // Company Information (Header Left)
  companyName: 'ENERGIAYKKÖNEN OY',
  companyRegistrationNumber: 'Y-tunnus: 2635343-7',
  companyAddress: 'Koivupurontie 6 b',
  companyPostcode: '40320 Jyväskylä',

  // Document Information (Header Center & Right)
  documentTitle: 'SÄÄSTÖLASKELMA',
  documentDate: '[CURRENT_DATE]',
  documentNumber: 'Laskelma #[CALCULATION_NUMBER]',

  // ===== CUSTOMER SECTION =====
  // Personal Information (Left Column)
  customerName: '[FULL_NAME]',
  customerEmail: '[lead:email]',
  customerPhone: '[lead:phone]',
  customerStreetAddress: '[lead:street_address]',
  customerCity: '[lead:city]',

  // Property Information (Right Column)
  residentsCount: '[lead:residents] henkilöä',
  constructionYear: '[lead:construction_year]',
  propertyArea: '[format:square_meters:number:decimals=0] m²',
  floorsCount: '[lead:floors] kerrosta',
  annualEnergyNeed:
    '[format:annual_energy_need:number:decimals=0,suffix= kWh/vuosi]',

  // ===== CURRENT HEATING SYSTEM (Left Box) =====
  currentSystemTitle: 'Nykyinen lämmitysjärjestelmä',
  currentSystemType: '[HEATING_TYPE_FI]',

  // Current System Costs
  currentCost1Year: '[format:current_heating_cost:currency]',
  currentCost5Years: '[format:current_heating_cost_5y:currency]',
  currentCost10Years: '[format:current_heating_cost_10y:currency]',

  // Current System Details
  oilConsumption: '[format:oil_consumption:number:decimals=0] L/vuosi',
  oilPrice: '[format:oil_price:currency:decimals=2] €/litra',
  currentMaintenanceCost: '[format:current_maintenance:currency] €/vuosi',
  currentCO2Emissions: '[format:current_co2:number:decimals=0] kg/vuosi',

  // ===== NEW HEATING SYSTEM (Right Box) =====
  newSystemTitle: 'Ilmavesilämpöpumppu',
  newSystemSubtitle: 'Moderni VILP-järjestelmä',

  // New System Costs & Savings
  newCost1Year: '[format:heat_pump_cost_annual:currency]',
  savings1Year: '[format:annual_savings:currency]',
  subsidyAmount: '[format:ely_subsidy:currency]',

  newCost5Years: '[format:heat_pump_cost_5y:currency]',
  savings5Years: '[format:five_year_savings:currency]',

  newCost10Years: '[format:heat_pump_cost_10y:currency]',
  savings10Years: '[format:ten_year_savings:currency]',

  // New System Details
  electricityConsumption:
    '[format:heat_pump_consumption:number:decimals=0] kWh/vuosi',
  electricityPrice: '[format:electricity_price:currency:decimals=2] €/kWh',
  maintenanceCostFirst5Years: '[format:maintenance_first_5y:currency] €/vuosi',
  maintenanceCostNext5Years: '[format:maintenance_next_5y:currency] €/vuosi',
  newCO2Emissions: '[format:new_co2:number:decimals=0] kg/vuosi',

  // System Efficiency Note
  efficiencyNote:
    'Arvio energiamäärästä, joka tarvitaan täyttämään laskennallinen energiantarve. Laskelmassa käytetty maltillista [COP_VALUE] hyötysuhdetta.',

  // Subsidy Note
  subsidyNote:
    '* ELY-keskuksen energiatuki öljylämmityksestä luopumiseen. Tuki on [format:ely_subsidy:currency] pientaloille. Edellyttää hakemuksen tekemistä ennen töiden aloittamista.',

  // ===== BENEFITS SECTION =====
  benefitsTitle: 'Moderni ilmavesilämpöpumppu Energiaykköseltä',
  benefit1: '10 vuoden huoltovapaat laitteet modernilla tekniikalla',
  benefit2: '5 vuoden täystakuu kaikille komponenteille',
  benefit3:
    'Kotitalousvähennys 40% työn osuudesta (max [format:tax_deduction_max:currency])',
  benefit4: 'Kiinteistön arvon nousu ja parempi energialuokka',
  benefit5: 'Älykäs etäohjaus mobiilisovelluksella',

  // ===== INFO BOX =====
  infoBoxTitle: 'Visiomme',
  infoBoxContent:
    'Visiomme uusiutuvan energian tuottamisesta ydinvoimalan verran (4 TWh vuodessa) on kunnianhimoinen. Tämä vastaa 380 000 polttomoottoriauton vuosittaisia päästöjä. Vision taustalla on paljon laskelmia, ja siksi pidämmekin sen toteuttamista täysin mahdollisena.',

  // ===== FOOTER =====
  footerLeft: 'Energiaykkönen Oy | Y-tunnus: 2635343-7',
  footerCenter: 'www.energiaykkonen.fi | info@energiaykkonen.fi',
  footerRight: 'Sivu 1/1',
};

/**
 * Additional calculated fields that need special processing
 * These are not directly from the lead data but need to be calculated
 */
export const calculatedFields = {
  // Oil consumption calculation (based on energy need and oil efficiency)
  oil_consumption: (lead: any) => {
    const oilEfficiency = 0.85; // 85% efficiency
    const oilEnergyContent = 10; // kWh per liter
    return Math.round(
      lead.annual_energy_need / (oilEfficiency * oilEnergyContent)
    );
  },

  // Oil price (market rate)
  oil_price: () => 1.3,

  // Current maintenance cost
  current_maintenance: () => 200,

  // Current CO2 emissions (oil heating)
  current_co2: (lead: any) => {
    const co2PerLiter = 2.66; // kg CO2 per liter of oil
    const oilConsumption = calculatedFields.oil_consumption(lead);
    return Math.round(oilConsumption * co2PerLiter);
  },

  // 5 and 10 year projections for current system
  current_heating_cost_5y: (lead: any) => lead.current_heating_cost * 5,
  current_heating_cost_10y: (lead: any) => lead.current_heating_cost * 10,

  // Heat pump 5 and 10 year costs
  heat_pump_cost_5y: (lead: any) => lead.heat_pump_cost_annual * 5,
  heat_pump_cost_10y: (lead: any) => lead.heat_pump_cost_annual * 10,

  // Electricity price
  electricity_price: () => 0.15,

  // Maintenance costs
  maintenance_first_5y: () => 0,
  maintenance_next_5y: () => 30,

  // New CO2 emissions (heat pump - assuming green electricity)
  new_co2: () => 0,

  // COP value
  COP_VALUE: () => '3.8',

  // ELY subsidy
  ely_subsidy: () => 4000,

  // Tax deduction maximum
  tax_deduction_max: () => 3200,
};

/**
 * Helper function to get all resolved values for PDF generation
 */
export function resolvePDFFields(
  processor: any,
  lead: any
): Record<string, string> {
  const resolved: Record<string, string> = {};

  // First, add calculated fields to the processor's custom values
  const customValues = { ...processor.customValues };
  for (const [key, calculator] of Object.entries(calculatedFields)) {
    if (typeof calculator === 'function') {
      customValues[key] = calculator(lead);
    }
  }

  // Create new processor with all custom values
  const enhancedProcessor = new processor.constructor(lead, customValues);

  // Process all shortcode mappings
  for (const [field, shortcode] of Object.entries(pdfShortcodeMappings)) {
    if (typeof shortcode === 'string') {
      // Check if it's a shortcode or plain text
      if (shortcode.includes('[') || shortcode.includes('{')) {
        resolved[field] = enhancedProcessor.process(shortcode);
      } else {
        // Plain text value
        resolved[field] = shortcode;
      }
    }
  }

  return resolved;
}
