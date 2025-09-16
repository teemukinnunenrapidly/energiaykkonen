import { LeadNormalized } from '../schemas/lead';

export interface LookupContext {
  electricityPrice?: number; // €/kWh
  oilPrice?: number; // €/L
  gasPricePerMWh?: number; // €/MWh
  co2: {
    electricityPerKWh: number; // kg/kWh
    oilPerLiter: number; // kg/L
    gasPerKWh?: number; // kg/kWh
  };
}

export interface CurrentCostMetrics {
  year1: number;
  year5: number;
  year10: number;
}

export interface CurrentConsumptionMetrics {
  liters?: number; // oil
  m3?: number; // gas
  puumotti?: number; // wood
}

export interface CurrentCo2Metrics {
  year: number;
}

export interface NewSystemMetrics {
  cost: CurrentCostMetrics;
  electricityKWh: number;
  co2Year: number;
}

export interface Metrics {
  current: {
    cost: CurrentCostMetrics;
    consumption: CurrentConsumptionMetrics;
    co2: CurrentCo2Metrics;
  };
  newSystem: NewSystemMetrics;
}

export interface StrategyResultBasics {
  annualCurrentCost: number; // €/year
  currentConsumption: CurrentConsumptionMetrics;
  currentCo2Year: number;
  maintenanceYearly?: number;
}

export interface StrategyDefinition {
  id: 'oil' | 'gas' | 'wood' | 'oilwood';
  matches: (normalized: LeadNormalized) => boolean;
  computeBasics: (normalized: LeadNormalized, lookups: LookupContext) => StrategyResultBasics;
  pdfRows: Array<{ key: 'consumption' | 'price' | 'maintenance' | 'co2'; label: string; unit: string }>;
}

export const DEFAULT_LOOKUPS: LookupContext = {
  electricityPrice: 0.15,
  oilPrice: 1.3,
  gasPricePerMWh: 55,
  co2: {
    electricityPerKWh: 0.181,
    oilPerLiter: 2.66,
    gasPerKWh: 0.201,
  },
};
