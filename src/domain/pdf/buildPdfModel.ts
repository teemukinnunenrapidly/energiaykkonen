import { LeadNormalized } from '../schemas/lead';
import { Metrics, StrategyDefinition } from '../calc/types';

export interface PdfRow {
  label: string;
  value: string;
}

export interface PdfModel {
  current: {
    title: string;
    subtitle: string;
    costs: { year1: string; year5: string; year10: string };
    rows: PdfRow[];
  };
  newSystem: {
    costs: { year1: string; year5: string; year10: string };
    electricityKWh: string;
    co2Year: string;
  };
}

export function buildPdfModel(n: LeadNormalized, metrics: Metrics, strategy: StrategyDefinition): PdfModel {
  const fmt = (num: number, unit = '') => `${num.toLocaleString('fi-FI')} ${unit}`.trim();

  const rows: PdfRow[] = [];
  for (const r of strategy.pdfRows) {
    if (r.key === 'consumption') {
      const c = metrics.current.consumption;
      const val = c.liters ?? c.m3 ?? c.puumotti ?? 0;
      rows.push({ label: r.label, value: fmt(val, r.unit) });
    } else if (r.key === 'price') {
      // display using annual current cost when price row requested
      rows.push({ label: r.label, value: fmt(metrics.current.cost.year1, r.unit) });
    } else if (r.key === 'maintenance') {
      // static example; strategy could carry value in future
      rows.push({ label: r.label, value: fmt(200, r.unit) });
    } else if (r.key === 'co2') {
      rows.push({ label: r.label, value: fmt(metrics.current.co2.year, r.unit) });
    }
  }

  return {
    current: {
      title: 'Nykyinen lämmitysjärjestelmä',
      subtitle: n.lammitysmuoto || '',
      costs: {
        year1: fmt(metrics.current.cost.year1, '€'),
        year5: fmt(metrics.current.cost.year5, '€'),
        year10: fmt(metrics.current.cost.year10, '€'),
      },
      rows,
    },
    newSystem: {
      costs: {
        year1: fmt(metrics.newSystem.cost.year1, '€'),
        year5: fmt(metrics.newSystem.cost.year5, '€'),
        year10: fmt(metrics.newSystem.cost.year10, '€'),
      },
      electricityKWh: fmt(metrics.newSystem.electricityKWh, 'kWh/vuosi'),
      co2Year: fmt(metrics.newSystem.co2Year, 'kg/vuosi'),
    },
  };
}
