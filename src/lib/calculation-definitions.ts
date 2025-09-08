/**
 * Calculation Definitions and Constants
 * Core formulas and logic for heat pump savings calculations
 */

export const CALCULATION_CONSTANTS = {
  // Energy factors
  BASE_ENERGY_PER_M2: 100, // kWh/m²/year
  CEILING_HEIGHT_FACTOR: 2.5, // Reference ceiling height (m)
  HEAT_PUMP_COP: 3.3, // Coefficient of Performance

  // Prices (can be updated from database or settings)
  ELECTRICITY_PRICE: 0.12, // €/kWh
  OIL_PRICE: 1.3, // €/liter
  DISTRICT_HEATING_PRICE: 0.09, // €/kWh

  // Installation costs
  DEFAULT_INSTALLATION_COST: 15000, // €
  INSTALLATION_WITH_SUPPORT: 12000, // € (after government support)

  // CO2 emission factors
  CO2_PER_LITER_OIL: 2.66, // kg CO2/liter
  CO2_PER_KWH_ELECTRICITY: 0.181, // kg CO2/kWh (Finnish grid average)
  CO2_PER_KWH_DISTRICT: 0.188, // kg CO2/kWh (district heating)

  // Conversion factors
  KWH_PER_LITER_OIL: 10, // kWh/liter of heating oil

  // Adjustment factors
  BUILDING_AGE_FACTOR: {
    before_1960: 1.3,
    '1960_1979': 1.2,
    '1980_1999': 1.1,
    '2000_2009': 1.0,
    after_2010: 0.9,
  },

  HOT_WATER_FACTOR: {
    low: 0.9, // 1-2 persons
    medium: 1.0, // 3-4 persons
    high: 1.15, // 5+ persons
  },
};

/**
 * Calculate building age factor based on construction year
 */
export function getBuildingAgeFactor(year: number): number {
  if (year < 1960) {
    return CALCULATION_CONSTANTS.BUILDING_AGE_FACTOR.before_1960;
  }
  if (year < 1980) {
    return CALCULATION_CONSTANTS.BUILDING_AGE_FACTOR['1960_1979'];
  }
  if (year < 2000) {
    return CALCULATION_CONSTANTS.BUILDING_AGE_FACTOR['1980_1999'];
  }
  if (year < 2010) {
    return CALCULATION_CONSTANTS.BUILDING_AGE_FACTOR['2000_2009'];
  }
  return CALCULATION_CONSTANTS.BUILDING_AGE_FACTOR.after_2010;
}

/**
 * Calculate hot water usage factor based on number of residents
 */
export function getHotWaterFactor(residents: number): number {
  if (residents <= 2) {
    return CALCULATION_CONSTANTS.HOT_WATER_FACTOR.low;
  }
  if (residents <= 4) {
    return CALCULATION_CONSTANTS.HOT_WATER_FACTOR.medium;
  }
  return CALCULATION_CONSTANTS.HOT_WATER_FACTOR.high;
}

/**
 * Core calculation functions matching the database formulas
 */
export const CALCULATIONS = {
  /**
   * Calculate annual energy need (kWh/year)
   */
  annualEnergyNeed: (params: {
    neliot: number;
    huonekorkeus?: number;
    rakennusvuosi?: number;
    henkilomaara?: number;
  }): number => {
    const {
      neliot,
      huonekorkeus = 2.5,
      rakennusvuosi,
      henkilomaara = 2,
    } = params;

    // Base calculation
    let energyNeed =
      neliot *
      CALCULATION_CONSTANTS.BASE_ENERGY_PER_M2 *
      (huonekorkeus / CALCULATION_CONSTANTS.CEILING_HEIGHT_FACTOR);

    // Apply building age factor if available
    if (rakennusvuosi) {
      energyNeed *= getBuildingAgeFactor(rakennusvuosi);
    }

    // Apply hot water factor
    energyNeed *= getHotWaterFactor(henkilomaara);

    return Math.round(energyNeed);
  },

  /**
   * Calculate heat pump electricity consumption (kWh/year)
   */
  heatPumpConsumption: (annualEnergyNeed: number): number => {
    return Math.round(annualEnergyNeed / CALCULATION_CONSTANTS.HEAT_PUMP_COP);
  },

  /**
   * Calculate heat pump annual cost (€/year)
   */
  heatPumpCostAnnual: (heatPumpConsumption: number): number => {
    return Math.round(
      heatPumpConsumption * CALCULATION_CONSTANTS.ELECTRICITY_PRICE
    );
  },

  /**
   * Calculate current heating cost based on type and consumption
   */
  currentHeatingCost: (params: {
    lammitysmuoto: string;
    consumption: number;
  }): number => {
    const { lammitysmuoto, consumption } = params;

    switch (lammitysmuoto.toLowerCase()) {
      case 'öljylämmitys':
        return Math.round(consumption * CALCULATION_CONSTANTS.OIL_PRICE);

      case 'sähkölämmitys':
      case 'suora sähkölämmitys':
        return Math.round(
          consumption * CALCULATION_CONSTANTS.ELECTRICITY_PRICE
        );

      case 'kaukolämpö':
        return Math.round(
          consumption * CALCULATION_CONSTANTS.DISTRICT_HEATING_PRICE
        );

      default:
        // Default to oil pricing
        return Math.round(consumption * CALCULATION_CONSTANTS.OIL_PRICE);
    }
  },

  /**
   * Calculate annual savings (€/year)
   */
  annualSavings: (currentCost: number, heatPumpCost: number): number => {
    return Math.round(currentCost - heatPumpCost);
  },

  /**
   * Calculate payback period (years)
   */
  paybackPeriod: (annualSavings: number, installationCost?: number): number => {
    const cost =
      installationCost || CALCULATION_CONSTANTS.DEFAULT_INSTALLATION_COST;
    return annualSavings > 0 ? Math.round((cost / annualSavings) * 10) / 10 : 0;
  },

  /**
   * Calculate CO2 reduction (kg CO2/year)
   */
  co2Reduction: (params: {
    lammitysmuoto: string;
    currentConsumption: number;
    heatPumpConsumption: number;
  }): number => {
    const { lammitysmuoto, currentConsumption, heatPumpConsumption } = params;

    let currentCO2 = 0;
    const newCO2 =
      heatPumpConsumption * CALCULATION_CONSTANTS.CO2_PER_KWH_ELECTRICITY;

    switch (lammitysmuoto.toLowerCase()) {
      case 'öljylämmitys':
        currentCO2 =
          currentConsumption * CALCULATION_CONSTANTS.CO2_PER_LITER_OIL;
        break;

      case 'sähkölämmitys':
      case 'suora sähkölämmitys':
        currentCO2 =
          currentConsumption * CALCULATION_CONSTANTS.CO2_PER_KWH_ELECTRICITY;
        break;

      case 'kaukolämpö':
        currentCO2 =
          currentConsumption * CALCULATION_CONSTANTS.CO2_PER_KWH_DISTRICT;
        break;

      default:
        // Default to oil
        currentCO2 =
          currentConsumption * CALCULATION_CONSTANTS.CO2_PER_LITER_OIL;
    }

    return Math.round(currentCO2 - newCO2);
  },

  /**
   * Calculate efficiency improvement percentage
   */
  efficiencyImprovement: (
    currentConsumption: number,
    newConsumption: number
  ): number => {
    if (currentConsumption === 0) {
      return 0;
    }
    return Math.round(
      ((currentConsumption - newConsumption) / currentConsumption) * 100
    );
  },

  /**
   * Calculate return on investment (%)
   */
  returnOnInvestment: (
    tenYearSavings: number,
    installationCost?: number
  ): number => {
    const cost =
      installationCost || CALCULATION_CONSTANTS.DEFAULT_INSTALLATION_COST;
    return Math.round(((tenYearSavings - cost) / cost) * 100);
  },
};

/**
 * Main calculation pipeline that matches PDF requirements
 */
export function calculateAllMetrics(
  formData: Record<string, any>
): Record<string, any> {
  // Extract relevant fields
  const neliot = parseFloat(formData.neliot) || 100;
  const huonekorkeus = parseFloat(formData.huonekorkeus) || 2.5;
  const rakennusvuosi = parseInt(formData.rakennusvuosi) || 1990;
  const henkilomaara = parseInt(formData.henkilomaara) || 2;
  const lammitysmuoto = formData.lammitysmuoto || 'Öljylämmitys';
  const currentConsumption = parseFloat(formData.kokonaismenekki) || 0;

  // Core calculations
  const annualEnergyNeed = CALCULATIONS.annualEnergyNeed({
    neliot,
    huonekorkeus,
    rakennusvuosi,
    henkilomaara,
  });

  const heatPumpConsumption =
    CALCULATIONS.heatPumpConsumption(annualEnergyNeed);
  const heatPumpCostAnnual =
    CALCULATIONS.heatPumpCostAnnual(heatPumpConsumption);

  const currentHeatingCost =
    formData.menekinhintavuosi ||
    CALCULATIONS.currentHeatingCost({
      lammitysmuoto,
      consumption: currentConsumption,
    });

  const annualSavings = CALCULATIONS.annualSavings(
    currentHeatingCost,
    heatPumpCostAnnual
  );
  const fiveYearSavings = annualSavings * 5;
  const tenYearSavings = annualSavings * 10;
  const paybackPeriod = CALCULATIONS.paybackPeriod(annualSavings);

  const co2Reduction = CALCULATIONS.co2Reduction({
    lammitysmuoto,
    currentConsumption,
    heatPumpConsumption,
  });

  const efficiencyImprovement = CALCULATIONS.efficiencyImprovement(
    currentConsumption * CALCULATION_CONSTANTS.KWH_PER_LITER_OIL,
    heatPumpConsumption
  );

  const roi = CALCULATIONS.returnOnInvestment(tenYearSavings);

  return {
    // Energy metrics
    annual_energy_need: annualEnergyNeed,
    heat_pump_consumption: heatPumpConsumption,
    heat_pump_cost_annual: heatPumpCostAnnual,
    current_heating_cost: currentHeatingCost,

    // Savings metrics
    annual_savings: annualSavings,
    five_year_savings: fiveYearSavings,
    ten_year_savings: tenYearSavings,
    monthly_savings: Math.round(annualSavings / 12),

    // Financial metrics
    payback_period: paybackPeriod,
    return_on_investment: roi,

    // Environmental metrics
    co2_reduction: co2Reduction,
    efficiency_improvement: efficiencyImprovement,

    // Input values for reference
    property_size: neliot,
    ceiling_height: huonekorkeus,
    building_year: rakennusvuosi,
    residents: henkilomaara,
    heating_type: lammitysmuoto,
    current_consumption: currentConsumption,
  };
}
