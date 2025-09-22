import { LeadNormalized } from '../../schemas/lead';
import {
  LookupContext,
  StrategyDefinition,
  StrategyResultBasics,
} from '../types';

export const GasStrategy: StrategyDefinition = {
  id: 'gas',
  matches: (n: LeadNormalized) =>
    (n.lammitysmuoto || '').toLowerCase().includes('kaasu'),
  computeBasics: (
    n: LeadNormalized,
    lookups: LookupContext
  ): StrategyResultBasics => {
    const m3 = n.kokonaismenekki || 0;
    const pricePerMWh = lookups.gasPricePerMWh || 55;
    // For simplicity: assume input cost already in menekinhintavuosi if provided
    const annualCurrentCost = n.menekinhintavuosi || 0;
    const co2 =
      (n.laskennallinenenergiantarve || 0) * (lookups.co2.gasPerKWh || 0.201);
    return {
      annualCurrentCost: Math.round(annualCurrentCost),
      currentConsumption: { m3: Math.round(m3) },
      currentCo2Year: Math.round(co2),
      maintenanceYearly: 300,
    };
  },
  pdfRows: [
    { key: 'consumption', label: 'Kaasun kulutus', unit: 'm³/vuosi' },
    { key: 'price', label: 'Kaasun hinta', unit: '€/MWh' },
    { key: 'maintenance', label: 'Huoltokustannus', unit: '€/vuosi' },
    { key: 'co2', label: 'CO₂-päästöt', unit: 'kg/vuosi' },
  ],
};
