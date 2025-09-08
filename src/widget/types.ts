export interface FormData {
  energyConsumption: string;
  currentHeatingCost: string;
  heatingType: 'oil' | 'electric' | 'district' | 'gas' | 'other';
  postalCode?: string;
  email?: string;
}

export interface CalculationResults {
  annualSavings: number;
  fiveYearSavings: number;
  tenYearSavings: number;
  currentCost: number;
  heatPumpCost: number;
  heatPumpConsumption: number;
  co2Reduction: number;
  cop: number;
  electricityPrice: number;
  paybackTime?: number;
}

export interface WidgetConfig {
  apiUrl?: string;
  cop?: number;
  electricityPrice?: number;
  showCTA?: boolean;
  ctaUrl?: string;
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
}