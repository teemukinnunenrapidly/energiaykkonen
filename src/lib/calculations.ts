// Calculation engine for heat pump savings and payback period
export interface CalculationInputs {
  squareMeters: number;
  ceilingHeight: number;
  residents: number;
  currentHeatingCost: number;
  currentHeatingType: string;
}

export interface CalculationResults {
  annualEnergyNeed: number;
  heatPumpConsumption: number;
  heatPumpCostAnnual: number;
  annualSavings: number;
  fiveYearSavings: number;
  tenYearSavings: number;
  paybackPeriod: number;
  co2Reduction: number;
}

// Constants for calculations
const HEAT_LOSS_FACTOR = 17; // W/m² per degree Celsius
const TEMPERATURE_DIFFERENCE = 3.2; // Average temperature difference
const RESIDENT_ENERGY_FACTOR = 1500; // kWh per resident per year
const COP_FACTOR = 0.3; // Coefficient of Performance (30% of traditional heating)
const ELECTRICITY_COST = 0.12; // €/kWh
const INVESTMENT_COST = 15000; // € (assumed average investment)
const CO2_FACTOR = 0.2; // kg CO2 per kWh

export function calculateHeatPumpSavings(
  inputs: CalculationInputs
): CalculationResults {
  const { squareMeters, ceilingHeight, residents, currentHeatingCost } = inputs;

  // Calculate annual energy need
  const buildingEnergyNeed =
    squareMeters * ceilingHeight * HEAT_LOSS_FACTOR * TEMPERATURE_DIFFERENCE;
  const residentEnergyNeed = residents * RESIDENT_ENERGY_FACTOR;
  const annualEnergyNeed = buildingEnergyNeed + residentEnergyNeed;

  // Calculate heat pump consumption and costs
  const heatPumpConsumption = annualEnergyNeed * COP_FACTOR;
  const heatPumpCostAnnual = heatPumpConsumption * ELECTRICITY_COST;

  // Calculate savings
  const annualSavings = currentHeatingCost - heatPumpCostAnnual;
  const fiveYearSavings = annualSavings * 5;
  const tenYearSavings = annualSavings * 10;

  // Calculate payback period
  const paybackPeriod = INVESTMENT_COST / annualSavings;

  // Calculate CO2 reduction
  const co2Reduction = annualEnergyNeed * CO2_FACTOR;

  return {
    annualEnergyNeed,
    heatPumpConsumption,
    heatPumpCostAnnual,
    annualSavings,
    fiveYearSavings,
    tenYearSavings,
    paybackPeriod,
    co2Reduction,
  };
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format numbers
export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}

// Helper function to get heating type label
export function getHeatingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    electric: 'Electric Heating',
    oil: 'Oil Heating',
    gas: 'Gas Heating',
    district: 'District Heating',
    wood: 'Wood Heating',
    other: 'Other',
  };
  return labels[type] || type;
}
