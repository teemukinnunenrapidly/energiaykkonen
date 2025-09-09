### Leadien lähetys, tallennus, PDF ja laskentalogiikka (E1-calculator)

- **Ydinpolku**: Frontend lähettää POST-pyynnön reitille `/api/submit-lead`. Palvelin tallentaa leadin Supabaseen, generoi PDF:n, tallentaa sen Storageen ja lähettää sähköpostit.

### 1) Lead submit -polku

- **Endpoint**: `/api/submit-lead` (Next.js Route Handler)
- **Validointi**: tarkistaa mm. `neliot` ja `sahkoposti`. Käytössä IP- ja UA-loki sekä rate limit.
- **Laskenta**: alustavat arvot `calculateHeatPumpSavings()` lisäksi PDF-spesifit arvot `calculatePDFValues()`.
- **Tallennus**: kirjoitus tauluun `leads` (Supabase) seuraavasti:
  - Kiinteät sarakkeet: `nimi`, `sahkoposti`, `puhelinnumero`, `paikkakunta`, `osoite`, `status` (= 'new')
  - JSONB: `form_data` (kaikki lomakekentät + metat), `calculation_results` (PDF:ää varten)
- **PDF**: generoidaan `SavingsReportPDF`-komponentilla; tallennus Storageen buckettiin `lead-pdfs` polulla `<leadId>/saastolaskelma-<numero>.pdf`, URL talletetaan takaisin `form_data`-objektiin (`pdf_url`, `pdf_generated_at`).
- **Sähköpostit**: lähetetään `sendLeadEmails()`; asiakas saa PDF:n liitteenä, myynti HTML‑viestin.

Viitteet koodiin:
```1:20:src/app/api/submit-lead/route.ts
import { supabase } from '@/lib/supabase';
import { calculateHeatPumpSavings } from '@/lib/calculations';
import { sendLeadEmails } from '@/lib/email-service';
import { pdf } from '@react-pdf/renderer';
import { SavingsReportPDF } from '@/lib/pdf/SavingsReportPDF';
import { processPDFData } from '@/lib/pdf/pdf-data-processor';
import { calculatePDFValues } from '@/lib/pdf-calculations';
```

### 2) Mitä tallennetaan Supabaseen

- **Taulu**: `leads`
  - Kiinteät sarakkeet: `id`, `created_at`, `updated_at`, `nimi`, `sahkoposti`, `puhelinnumero`, `paikkakunta`, `osoite`, `status`, (valinnainen) `notes`
  - **JSONB**: `form_data` (dynaamiset kentät), `calculation_results` (PDF-laskennat submission-hetkellä)
  - Seurantakenttiä: `ip_address`, `user_agent`, `source_page` (usein osana `form_data`-metaa)

Tyypitykset ja apurit:
```70:103:src/lib/supabase.ts
export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  nimi: string;
  sahkoposti: string;
  puhelinnumero: string;
  paikkakunta?: string;
  osoite?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  notes?: string;
  form_data?: LeadFormData;
  pdf_url?: string;
  calculation_results?: CalculationResults;
  ip_address?: string;
  user_agent?: string;
  source_page?: string;
}
```

- JSONB-rakenteen käsittely (flattenointi yms.): `src/lib/lead-helpers.ts`

Migraatiotuki `calculation_results`-kentälle:
```1:15:scripts/add-calculation-results-column.sql
ALTER TABLE leads ADD COLUMN calculation_results jsonb DEFAULT '{}'::jsonb;
```

### 3) PDF:n generointi ja tallennus

- **Datan valmistelu**: `processPDFData(lead)` yhdistää leadin (myös JSONB) ja PDF‑spesifit laskennat `generatePDFCalculations` → rakentaa `pdfData`‑olion (asiakastiedot, kustannusvertailu, säästöt, CO₂ yms.).
- **Renderöinti**: `SavingsReportPDF` (React, `@react-pdf/renderer`) tuottaa A4‑PDF:n.
- **Talletus**: upload Storageen buckettiin `lead-pdfs`; haetaan public URL ja päivitetään `form_data.pdf_url`.

Viitteet koodiin:
```171:248:src/app/api/submit-lead/route.ts
const pdfData = await processPDFData(insertedLead);
const component = React.createElement(SavingsReportPDF, { data: pdfData });
// upload supabase.storage.from('lead-pdfs').upload(...)
```
```10:31:src/lib/pdf/SavingsReportPDF.tsx
export const SavingsReportPDF: React.FC<{ data: PDFData }>
```
```13:96:src/lib/pdf/pdf-data-processor.ts
export async function processPDFData(lead: Lead)
```

Lisäkonfiguraatioita (mapping/formatointi): `src/config/pdf-field-mappings.ts`

### 4) Laskentalogiikka

- **Submit-vaiheen peruslaskenta**: `calculateHeatPumpSavings()` laskee nopean arvion (vuosi-energian tarve, VILP‑kulutus, kustannukset, säästöt, takaisinmaksuaika, CO₂).
- **PDF-laskelmat**: `calculatePDFValues(formData, sessionId?)`
  - Hakee aktiivisen PDF‑templaatin (`pdf_templates.template_html`), parsii shortcodet (`[calc:...]`, `[lookup:...]`, `[form:...]`).
  - Käyttää `UnifiedCalculationEngine`‑moottoria ratkaisemaan riippuvuudet, laskemaan kaavat ja hakemaan lookup‑arvot.
  - Yhdistää aina mukana olevat “standard metrics” (kuten `annual_energy_need`, `annual_savings`, `payback_period`, `co2_reduction`).
- **Unified Calculation Engine**: yhteinen moottori lyhytkoodeille ja kaavoille
  - Kestävällä tavalla parsii riippuvuudet: `{field}`, `[calc:name]`, `[lookup:name]`.
  - Hakee kaavat taulusta `formulas` (vain `is_active=true`).
  - Tukee myös enhanced lookup -sääntöjä tauluista `enhanced_lookups` ja `enhanced_lookup_rules`.

Viitteet koodiin:
```30:66:src/lib/calculations.ts
export function calculateHeatPumpSavings(inputs)
```
```37:116:src/lib/pdf-calculations.ts
export async function calculatePDFValues(formData, sessionId?)
```
```1:30:src/lib/unified-calculation-engine.ts
export class UnifiedCalculationEngine { ... }
```

### 5) Tietokantarakenne (yhteenveto)

- `leads` (päätaso)
  - Kiinteät: `id`, `created_at`, `updated_at`, `nimi`, `sahkoposti`, `puhelinnumero`, `paikkakunta`, `osoite`, `status`, `notes`
  - JSONB: `form_data` (dynaamiset kentät + metat), `calculation_results` (PDF-laskelmien tallenne)
  - Indeksit/politiikat: ks. `docs/setup/SUPABASE_TABLE_SETUP.md` ja `docs/setup/ENVIRONMENT_SETUP_COMPLETE.md`
- PDF Storage: bucket `lead-pdfs`, polku `<leadId>/saastolaskelma-<numero>.pdf`
- Kaavat ja lookups:
  - `formulas` (kaavatextit, `is_active`)
  - `enhanced_lookups` + `enhanced_lookup_rules` (ehdolliset haut/konversiot)

### 6) Datan kulku tiivistetysti

1. Frontend → POST `/api/submit-lead` lomakedata (+ sessionId)
2. API: validointi, metan lisäys (`ip`, `ua`, `source_page`), PDF‑laskennat `calculatePDFValues()`
3. Supabase: insert `leads` (kiinteät + `form_data` + `calculation_results`)
4. PDF: `processPDFData()` → `SavingsReportPDF` → Storage upload → `form_data.pdf_url` päivitys
5. Sähköposti: `sendLeadEmails()` (asiakas + myynti)
6. Response: `201`, mukana laskelmien yhteenveto ja mail-tila

### 7) Testaus ja lisämateriaali

- PDF-testaus: `scripts/test-pdf-generation.ts`
- Lähetysintegraatiot: `public/widget-test/*`, `public/wordpress-*.html`
- Supabase-ohjeet: `docs/setup/SUPABASE_TABLE_SETUP.md`, `docs/development/SUPABASE_TEST_REPORT.md`
