import { LeadNormalized } from '../../schemas/lead';
import { LookupContext, StrategyDefinition, StrategyResultBasics } from '../types';

export const WoodStrategy: StrategyDefinition = {
  id: 'wood',
  matches: (n: LeadNormalized) => (n.lammitysmuoto || '').toLowerCase().includes('puu') && !(n.lammitysmuoto || '').toLowerCase().includes('öljy'),
  computeBasics: (n: LeadNormalized, lookups: LookupContext): StrategyResultBasics => {
    const puumotti = n.kokonaismenekki || 0;
    const annualCurrentCost = n.menekinhintavuosi || 0;
    return {
      annualCurrentCost: Math.round(annualCurrentCost),
      currentConsumption: { puumotti: Math.round(puumotti) },
      currentCo2Year: Math.round((n.laskennallinenenergiantarve || 0) * 0.0),
      maintenanceYearly: 200,
    };
  },
  pdfRows: [
    { key: 'consumption', label: 'Puun menekki', unit: 'puumottia/vuosi' },
    { key: 'price', label: 'Puun hinta', unit: '€/vuosi' },
    { key: 'maintenance', label: 'Huoltokustannus', unit: '€/vuosi' },
    { key: 'co2', label: 'CO₂-päästöt', unit: 'kg/vuosi' },
  ],
};
