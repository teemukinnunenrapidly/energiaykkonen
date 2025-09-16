import { LeadNormalized } from '../../schemas/lead';
import { LookupContext, StrategyDefinition, StrategyResultBasics } from '../types';

export const OilStrategy: StrategyDefinition = {
  id: 'oil',
  matches: (n: LeadNormalized) => (n.lammitysmuoto || '').toLowerCase().includes('öljy') && !(n.lammitysmuoto || '').toLowerCase().includes('puu'),
  computeBasics: (n: LeadNormalized, lookups: LookupContext): StrategyResultBasics => {
    const liters = n.kokonaismenekki ?? ((n.laskennallinenenergiantarve || 0) / 10);
    const oilPrice = n.oilPrice ?? lookups.oilPrice ?? 1.3;
    const annualCurrentCost = (n.menekinhintavuosi ?? liters * oilPrice) || 0;
    const co2 = (liters || 0) * (lookups.co2.oilPerLiter || 2.66);
    return {
      annualCurrentCost: Math.round(annualCurrentCost),
      currentConsumption: { liters: Math.round(liters || 0) },
      currentCo2Year: Math.round(co2),
      maintenanceYearly: 200,
    };
  },
  pdfRows: [
    { key: 'consumption', label: 'Öljyn kulutus', unit: 'L/vuosi' },
    { key: 'price', label: 'Öljyn hinta', unit: '€/litra' },
    { key: 'maintenance', label: 'Huoltokustannus', unit: '€/vuosi' },
    { key: 'co2', label: 'CO₂-päästöt', unit: 'kg/vuosi' },
  ],
};
