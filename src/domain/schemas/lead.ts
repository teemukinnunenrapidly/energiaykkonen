import { z } from 'zod';

export const LeadInputSchema = z.object({
  // Canonical keys we care about (aliases handled by normalizer)
  neliot: z.number().optional(),
  huonekorkeus: z.number().optional(),
  rakennusvuosi: z.union([z.number(), z.string()]).optional(),
  henkilomaara: z.number().optional(),

  lammitysmuoto: z.string().optional(),
  kokonaismenekki: z.union([z.number(), z.string()]).optional(),
  menekinhintavuosi: z.union([z.number(), z.string()]).optional(),
  laskennallinenenergiantarve: z.union([z.number(), z.string()]).optional(),

  // Optional extras
  oilPrice: z.union([z.number(), z.string()]).optional(),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;

export const LeadNormalizedSchema = z.object({
  neliot: z.number().nullable(),
  huonekorkeus: z.number().nullable(),
  rakennusvuosi: z.number().nullable(),
  henkilomaara: z.number().nullable(),

  lammitysmuoto: z.string().nullable(),
  kokonaismenekki: z.number().nullable(),
  menekinhintavuosi: z.number().nullable(),
  laskennallinenenergiantarve: z.number().nullable(),

  oilPrice: z.number().nullable(),
});

export type LeadNormalized = z.infer<typeof LeadNormalizedSchema>;
