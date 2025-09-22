import { LeadNormalized } from '../schemas/lead';
import {
  DEFAULT_LOOKUPS,
  LookupContext,
  Metrics,
  StrategyDefinition,
} from './types';
import { OilStrategy } from './strategies/Oil';
import { GasStrategy } from './strategies/Gas';
import { WoodStrategy } from './strategies/Wood';
import { OilWoodMixedStrategy } from './strategies/OilWoodMixed';

const STRATEGIES: StrategyDefinition[] = [
  OilWoodMixedStrategy,
  OilStrategy,
  GasStrategy,
  WoodStrategy,
];

export function pickStrategy(n: LeadNormalized): StrategyDefinition {
  return STRATEGIES.find(s => s.matches(n)) || OilStrategy;
}

export function computeMetrics(
  n: LeadNormalized,
  lookups: LookupContext = DEFAULT_LOOKUPS
): Metrics {
  const strategy = pickStrategy(n);
  const basics = strategy.computeBasics(n, lookups);

  const currentCost = {
    year1: basics.annualCurrentCost,
    year5: Math.round(basics.annualCurrentCost * 5),
    year10: Math.round(basics.annualCurrentCost * 10),
  };

  const newElectricityKWh = Math.round(
    (n.laskennallinenenergiantarve || 0) / 3.8
  );
  const newCostYear1 = Math.round(
    newElectricityKWh * (lookups.electricityPrice || 0.15)
  );
  const newCost = {
    year1: newCostYear1,
    year5: Math.round(newCostYear1 * 5),
    year10: Math.round(newCostYear1 * 10),
  };

  const newCo2 = Math.round(
    newElectricityKWh * (lookups.co2.electricityPerKWh || 0.181)
  );

  return {
    current: {
      cost: currentCost,
      consumption: basics.currentConsumption,
      co2: { year: basics.currentCo2Year },
    },
    newSystem: {
      cost: newCost,
      electricityKWh: newElectricityKWh,
      co2Year: newCo2,
    },
  };
}
