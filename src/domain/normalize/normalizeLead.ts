import { LeadInput, LeadInputSchema, LeadNormalized, LeadNormalizedSchema } from '../schemas/lead';
import { parseFiNumber } from '../utils/numberFi';

// Map legacy/alias keys to canonical keys
const aliasMap: Record<string, keyof LeadInput> = {
  menekin_hinta_vuosi: 'menekinhintavuosi',
  current_yearly_cost: 'menekinhintavuosi',
  current_cost_1year: 'menekinhintavuosi',
  kokonais_menekki: 'kokonaismenekki',
  oil_liters: 'kokonaismenekki',
  oil_consumption: 'kokonaismenekki',
};

export function normalizeLead(input: Record<string, any>): { normalized: LeadNormalized; log: string[] } {
  const log: string[] = [];

  // Start with a shallow copy and map aliases
  const canonical: any = { ...input };
  for (const [alias, canonicalKey] of Object.entries(aliasMap)) {
    if (canonical[alias] !== undefined && canonical[canonicalKey] === undefined) {
      canonical[canonicalKey] = canonical[alias];
      log.push(`alias:${alias} -> ${canonicalKey}`);
    }
  }

  // Validate rough shape (non‑throwing)
  const parsed = LeadInputSchema.safeParse(canonical);
  const data = parsed.success ? parsed.data : ({} as LeadInput);

  const normalized: LeadNormalized = {
    neliot: data.neliot ?? null,
    huonekorkeus: data.huonekorkeus ?? null,
    rakennusvuosi: data.rakennusvuosi ? parseInt(String(data.rakennusvuosi)) : null,
    henkilomaara: data.henkilomaara ?? null,

    lammitysmuoto: data.lammitysmuoto ?? null,
    kokonaismenekki: data.kokonaismenekki !== undefined ? parseFiNumber(data.kokonaismenekki) : null,
    menekinhintavuosi: data.menekinhintavuosi !== undefined ? parseFiNumber(data.menekinhintavuosi) : null,
    laskennallinenenergiantarve:
      data.laskennallinenenergiantarve !== undefined
        ? parseFiNumber(data.laskennallinenenergiantarve)
        : null,

    oilPrice: data.oilPrice !== undefined ? parseFiNumber(data.oilPrice) : 1.3,
  };

  // Final schema check (non‑throw)
  const final = LeadNormalizedSchema.safeParse(normalized);
  if (!final.success) {
    log.push('normalized:validation_failed');
  }

  return { normalized, log };
}
