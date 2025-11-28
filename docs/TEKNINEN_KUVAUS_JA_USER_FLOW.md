### Energiaykkönen – E1‑laskurin tekninen kuvaus ja käyttäjäpolku

Tämä dokumentti tiivistää projektin arkkitehtuurin, keskeiset tekniset osat sekä end‑to‑end käyttäjäpolun siitä, miten lomaketiedot etenevät käyttöliittymästä taustapalveluun, miten laskelmat tehdään, PDF luodaan ja sähköpostit lähetetään.

## Arkkitehtuuri pähkinänkuoressa

- **Sovelluskehys**: Next.js (App Router), TypeScript, React
- **UI‑kerros**: Korttipohjainen “Card System” (lomakekortit, laskentakortit, infokortit)
- **Tietovarasto**: Supabase (Postgres + Storage)
- **PDF**: `@react-pdf/renderer` + oma komponentti `SavingsReportPDF`
- **Sähköposti**: Resend‑integraatio (asiakas + myynti)
- **Analytiikka**: Google Tag Manager (GTM) tapahtumat
- **Virhe- ja suorituskykyseuranta**: Sentry
- **Hallintapaneeli**: `/admin` (reittisuojaus middlewarella, CSRF)

## Koodirakenne (korkean tason)

- Frontend (App Router, sivut ja UI)
  - Kotisivu ja korttivirta: `src/app/page.tsx`, `src/components/card-system/*`
  - Korttien tilan hallinta ja submit: `src/components/card-system/CardContext.tsx`
- API‑reitit (Next.js Route Handlers)
  - Liidien lähetys: `src/app/api/submit-lead/route.ts`
  - PDF‑generointi (dev/test): `src/app/api/generate-pdf/route.ts`
  - Admin‑reitit: `src/app/api/admin/*`
- Liiketoimintalogiikka ja palvelut
  - Laskennat: `src/lib/calculation-definitions.ts`, `src/lib/pdf-calculation-definitions.ts`, `src/lib/pdf-calculations.ts`, `src/lib/unified-calculation-engine.ts`
  - PDF‑dataprosessori: `src/lib/pdf/pdf-data-processor.ts`
  - Sähköpostit: `src/lib/email-service.ts`
  - Supabase‑asiakas ja tyypit: `src/lib/supabase.ts`, `src/lib/supabase` (tyypit)
- Infrastruktuuri ja valvonta
  - Sentry init: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`
  - Middleware (admin‑suojaus, CSRF): `middleware.ts`
  - GTM‑konfigurointi ja tapahtumat: `src/config/gtm.ts`

## Keskeiset komponentit

- **Card System (UI)**
  - Kortit (lomake, laskenta, info) renderöidään `CardRenderer`in kautta, virtaus `CardStream`issa.
  - Tilan ja lähetysten hallinta `CardContext`issa: kenttäpäivitykset, paljastuslogiikka, submit.
  - Koodi: [CardSystemContainer](mdc:src/components/card-system/CardSystemContainer.tsx), [CardStream](mdc:src/components/card-system/CardStream.tsx), [CardRenderer](mdc:src/components/card-system/CardRenderer.tsx), [FormCard](mdc:src/components/card-system/cards/FormCard.tsx), [CardContext](mdc:src/components/card-system/CardContext.tsx)

- **Supabase**
  - Selainpään anon‑asiakas: [supabase.ts](mdc:src/lib/supabase.ts)
  - Tietomalli liideille: `leads` (kiinteät sarakkeet + JSONB), PDF‑templatet, (mahd. formulas/lookups).
  - Bucket PDF: `lead-pdfs` (polku `<leadId>/saastolaskelma-<numero>.pdf`).

- **PDF‑generointi**
  - Data muotoillaan `processPDFData(lead)` → `SavingsReportPDF` → bufferiksi ja Storageen.
  - Koodi: [pdf-data-processor.ts](mdc:src/lib/pdf/pdf-data-processor.ts), [SavingsReportPDF.tsx](mdc:src/lib/pdf/SavingsReportPDF.tsx)

- **Sähköposti (Resend)**
  - Asiakasviesti (PDF liitteenä) ja myynti‑ilmoitus (teksti + sama liite).
  - Koodi: [email-service.ts](mdc:src/lib/email-service.ts)

- **Analytiikka (GTM)**
  - Konsenttitietoinen eventtikerros (form start/submit, calc, pdf, email, errors).
  - Koodi: [gtm.ts](mdc:src/config/gtm.ts)

- **Sentry**
  - Server ja edge‑init + `onRequestError`, jäljitettävyys ja virheraportointi.
  - Koodi: [sentry.server.config.ts](mdc:sentry.server.config.ts), [sentry.edge.config.ts](mdc:sentry.edge.config.ts), [instrumentation.ts](mdc:src/instrumentation.ts)

- **Admin**
  - `/admin` suojataan middlewarella: cookie‑pohjainen JWT + CSRF admin‑API‑kutsuille.
  - Koodi: [middleware.ts](mdc:middleware.ts), [admin/login](mdc:src/app/admin/login/page.tsx), [api/admin/auth](mdc:src/app/api/admin/auth/route.ts)

## Käyttäjäpolku (end‑to‑end)

1. **Saapuminen sivulle**
   - Käyttäjä avaa etusivun (`/`, [page.tsx](mdc:src/app/page.tsx)), jossa renderöidään Card System.

2. **Korttien täyttö**
   - Käyttäjä täyttää kenttiä; `CardContext.updateField` normalisoi arvot, päivittää tilan ja voi päivittää täydentymistilaa Supabasen kautta korttikohtaisesti.
   - Näkyvyys- ja paljastuslogiikka ohjaa, mitkä kortit näkyvät seuraavaksi.

3. **Lähetys**
   - `FormCard` kutsuu `submitData`a → `POST /api/submit-lead` lomakedatalla + `sessionId` ([CardContext.tsx](mdc:src/components/card-system/CardContext.tsx)).
   - GTM‑eventit: `calc_form_start`, `calc_form_submit`.

4. **Palvelin käsittelee liidin**
   - API‑reitillä ([submit-lead/route.ts](mdc:src/app/api/submit-lead/route.ts)):
     - Rate‑limit + turvallisuusotsakkeet
     - Lomakedatasta suodatetaan “lasketut” kentät pois tallennusta varten
     - Lasketaan PDF‑arvot: `calculatePDFValues(formData, sessionId)`
     - Luodaan `leadData` (kiinteät sarakkeet + JSONB `form_data` + `calculation_results`)
     - Insert `leads` tauluun (Supabase Admin‑client)
     - Generoidaan PDF: `processPDFData(insertedLead)` → `SavingsReportPDF` → buffer
     - Tallennus Storageen polkuun `<leadId>/saastolaskelma-<numero>.pdf`, URL talteen
     - Lähetetään sähköpostit: `sendLeadEmails(lead, baseUrl?, pdfAttachment?)`
     - Palautetaan JSON (status, `leadId`, `pdfUrl`, sähköpostien tila)

5. **Vastaus ja UI**
   - `FormCard` näyttää onnistumisviestin ja mahdollisen PDF‑latauslinkin.
   - GTM‑eventit mahdollisia myös PDF:lle ja sähköposteille (jos käytössä).

## Backend‑prosessin yksityiskohdat (submit‑lead)

- **Reitti**: `/api/submit-lead` → [src/app/api/submit-lead/route.ts](mdc:src/app/api/submit-lead/route.ts)
- **Vaiheet**:
  - IP/UA, CORS, rate‑limit
  - Kenttäsuodatus (poista lasketut avaimet `form_data`sta)
  - PDF‑arvojen laskenta: [pdf-calculations.ts](mdc:src/lib/pdf-calculations.ts)
    - Shortcode‑pohjaiset arvot (template), fallback “oletuslaskelmat”
    - Yhdistetty laskentamoottori: [unified-calculation-engine.ts](mdc:src/lib/unified-calculation-engine.ts)
  - Tallennus `leads`iin: kiinteät sarakkeet + JSONB `form_data` ja `calculation_results`
  - PDF‑generointi ja Storage‑upload: [pdf-data-processor.ts](mdc:src/lib/pdf/pdf-data-processor.ts)
  - Sähköpostit: [email-service.ts](mdc:src/lib/email-service.ts)

## Laskenta

- **PDF‑spesifit laskennat**: [pdf-calculation-definitions.ts](mdc:src/lib/pdf-calculation-definitions.ts)
- **Yleiset kaavat**: [calculation-definitions.ts](mdc:src/lib/calculation-definitions.ts)
- **Shortcode‑prosessi** ja fallback‑logiikka: [pdf-calculations.ts](mdc:src/lib/pdf-calculations.ts)
- **Dokumentaatiota**: [CALCULATION_FLOW.md](mdc:docs/CALCULATION_FLOW.md), [CALCULATION_DEFINITIONS.md](mdc:docs/CALCULATION_DEFINITIONS.md)

## PDF‑generointi

- **Dataprosessointi**: `processPDFData(lead)` kokoaa kaikki PDF:n tarvitsemat kentät, laskee arvot ja mapittaa ne templatelle.
- **Renderöinti**: `SavingsReportPDF` renderöi dokumentin; `@react-pdf/renderer` tuottaa PDF‑bufferin.
- **Tallennus**: Supabase Storage, bucket `lead-pdfs`, tiedostonimi `<leadId>/saastolaskelma-<calculationNumber>.pdf`.
- **API (testi/dev)**: [api/generate-pdf](mdc:src/app/api/generate-pdf/route.ts)

## Sähköpostit

- **Asiakkaalle**: “tulosviesti” (+ PDF liitteenä, jos generointi onnistui)
- **Myynnille**: tekstimuotoinen ilmoitus (samat keskeiset kentät, PDF voidaan liittää)
- **Koodi**: [email-service.ts](mdc:src/lib/email-service.ts)

## Analytiikka (GTM)

- Tapahtumat: `calc_form_start`, `calc_form_submit`, `calc_calculation_*`, `calc_pdf_generated`, `calc_email_sent`, `calc_error_occurred`.
- Koodi: [gtm.ts](mdc:src/config/gtm.ts)

## Virheenkäsittely ja turvallisuus

- **Sentry**: Server + Edge init, `onRequestError` hook ([instrumentation.ts](mdc:src/instrumentation.ts))
- **Rate‑limit**: Liidien lähetysreitillä
- **CORS**: Sallitut otsakkeet vastauksissa
- **Admin‑suojaus**: Middleware tarkistaa cookie‑pohjaisen JWT‑sessionin ja roolin. Admin‑API‑kutsuissa CSRF (double‑submit cookie).
  - Koodi: [middleware.ts](mdc:middleware.ts), [api/admin/auth](mdc:src/app/api/admin/auth/route.ts)

## Ympäristömuuttujat ja asetukset

- Supabase URL ja anon‑avain tarvitaan selaimeen
- Resend API‑avain (server‑puoli)
- Admin‑salasana (server‑puoli)
- Dokumentaatio: [ENVIRONMENT_SETUP.md](mdc:docs/setup/ENVIRONMENT_SETUP.md), [SUPABASE_SETUP_GUIDE.md](mdc:docs/setup/SUPABASE_SETUP_GUIDE.md)

## Liittyvät dokumentit

- [AI_ONBOARDING.md – Runtime Flow](mdc:docs/AI_ONBOARDING.md)
- [LEAD_SUBMISSION_FLOW_FI.md](mdc:docs/guides/LEAD_SUBMISSION_FLOW_FI.md)
- [CALCULATION_FLOW.md](mdc:docs/CALCULATION_FLOW.md)
- [CALCULATION_DEFINITIONS.md](mdc:docs/CALCULATION_DEFINITIONS.md)
- [SUPABASE_TABLE_SETUP.md](mdc:docs/setup/SUPABASE_TABLE_SETUP.md)
- [PDF_STORAGE_ANALYSIS.md](mdc:docs/PDF_STORAGE_ANALYSIS.md)

## API‑reitit (poimintoja)

- `POST /api/submit-lead` – liidin tallennus, laskenta, PDF, sähköpostit
- `POST /api/generate-pdf` – PDF‑generointi (dev/test)
- Admin: `/api/admin/*` (reitit liideille, PDF‑asetuksille, lookupeille, migraatioille, ym.)

## Testaus ja työkalut

- PDF‑testit: `scripts/test-pdf-generation.ts`
- Supabase‑yhteyden testit: `src/app/api/test-supabase/route.ts`, `src/lib/test-supabase-connection.ts`
- Kuormitus ja validoinnit (scripts/testing/_): `scripts/testing/_`

---

Jos haluat tarkentaa käyttäjäpolkua tietyillä kentillä tai korttijärjestyksellä (esim. mikä kortti paljastuu milläkin ehdolla), lähdekohdaksi kannattaa avata `CardContext`in paljastuslogiikka sekä korttimäärittelyt, ja peilata niitä nykyiseen sisältöön Supabasessa.
