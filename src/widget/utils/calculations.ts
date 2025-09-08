import type { FormData, CalculationResults } from '../types';

const DEFAULT_COP = 3.8;
const DEFAULT_ELECTRICITY_PRICE = 0.15; // €/kWh
const CO2_FACTOR = 0.2; // kg CO2/kWh säästö
const INSTALLATION_COST = 15000; // Arvioitu asennushinta

export function calculateSavings(formData: FormData): CalculationResults {
  // Hae config tai käytä oletuksia
  const config = (window as any).E1_WIDGET_CONFIG || {};
  const cop = config.cop || DEFAULT_COP;
  const electricityPrice = config.electricityPrice || DEFAULT_ELECTRICITY_PRICE;
  
  // Muunna string-arvot numeroiksi
  const energyConsumption = parseFloat(formData.energyConsumption) || 0;
  const currentHeatingCost = parseFloat(formData.currentHeatingCost) || 0;
  
  // Laske lämpöpumpun kulutus ja kustannukset
  const heatPumpConsumption = energyConsumption / cop;
  const heatPumpCost = heatPumpConsumption * electricityPrice;
  
  // Laske säästöt
  const annualSavings = Math.max(0, currentHeatingCost - heatPumpCost);
  const fiveYearSavings = annualSavings * 5;
  const tenYearSavings = annualSavings * 10;
  
  // Laske CO2-vähennys (arvio)
  const co2Reduction = energyConsumption * CO2_FACTOR;
  
  // Laske takaisinmaksuaika jos säästöjä syntyy
  let paybackTime: number | undefined;
  if (annualSavings > 0) {
    paybackTime = Math.round((INSTALLATION_COST / annualSavings) * 10) / 10;
  }
  
  return {
    annualSavings: Math.round(annualSavings),
    fiveYearSavings: Math.round(fiveYearSavings),
    tenYearSavings: Math.round(tenYearSavings),
    currentCost: Math.round(currentHeatingCost),
    heatPumpCost: Math.round(heatPumpCost),
    heatPumpConsumption: Math.round(heatPumpConsumption),
    co2Reduction: Math.round(co2Reduction),
    cop,
    electricityPrice,
    paybackTime,
  };
}