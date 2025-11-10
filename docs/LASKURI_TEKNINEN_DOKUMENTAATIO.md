# Energiaykkonen Laskurijärjestelmä - Tekninen Dokumentaatio

## Sisällysluettelo

1. [Yleiskatsaus](#yleiskatsaus)
2. [Arkkitehtuuri](#arkkitehtuuri)
3. [Laskentastrategiat](#laskentastrategiat)
4. [Laskentamoottorit](#laskentamoottorit)
5. [UI-komponentit](#ui-komponentit)
6. [Tietovirta](#tietovirta)
7. [Laskentakaavat ja Vakiot](#laskentakaavat-ja-vakiot)
8. [PDF-generointi](#pdf-generointi)
9. [Tietokantarakenne](#tietokantarakenne)
10. [Turvallisuus](#turvallisuus)

---

## 1. Yleiskatsaus

Energiaykkonen-projektin laskurijärjestelmä on monipuolinen, modulaarinen järjestelmä lämpöpumppujen säästölaskelmien tekemiseen. Järjestelmä tukee eri lämmitysmuotoja (öljy, kaasu, puu, sekalämmitys) ja tarjoaa yksityiskohtaiset laskelmat energiankulutuksesta, kustannuksista, säästöistä ja CO2-päästöistä.

### Keskeiset Ominaisuudet

- **Strategiapohjainen laskenta**: Eri lämmitysmuodoille omat laskentastrategiat
- **Yhtenäinen laskentamoottori**: UnifiedCalculationEngine prosessoi kaikki laskentapyynnöt
- **Dynaaminen kaavajärjestelmä**: Kaavat tallennettu tietokantaan ja muokattavissa admin-paneelista
- **Shortcode-syntaksi**: `[calc:nimi]`, `[lookup:nimi]`, `[field:kenttä]` viittaukset
- **Session-pohjainen välimuisti**: Laskentatulokset tallennetaan sessiokohtaisesti
- **Muokattavat tulokset**: Käyttäjä voi korjata laskettuja arvoja
- **PDF-generointi**: Automaattinen PDF-raporttien luonti

---

## 2. Arkkitehtuuri

### 2.1. Kerrosarkkitehtuuri

```
┌─────────────────────────────────────────────────────┐
│                 UI Layer (React)                    │
│  - CalculationCard.tsx                              │
│  - EditableCalculationResult.tsx                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│            Business Logic Layer                     │
│  - UnifiedCalculationEngine                         │
│  - CalculationService                               │
│  - FormulaService                                   │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Domain Layer                           │
│  - Strategies (Oil, Gas, Wood, OilWoodMixed)       │
│  - Calculation Definitions                          │
│  - Formula Types                                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│               Data Layer                            │
│  - Supabase (formulas, lookups, processed_values)  │
│  - Session Storage                                  │
└─────────────────────────────────────────────────────┘
```

### 2.2. Tiedostorakenne

```
src/
├── domain/calc/
│   ├── CalculationService.ts          # Strategian valinta ja metriikoiden laskenta
│   ├── types.ts                        # Rajapinnat ja tyyppimäärittelyt
│   └── strategies/
│       ├── Oil.ts                      # Öljylämmityksen strategia
│       ├── Gas.ts                      # Kaasulämmityksen strategia
│       ├── Wood.ts                     # Puulämmityksen strategia
│       └── OilWoodMixed.ts            # Sekalämmityksen strategia
│
├── lib/
│   ├── unified-calculation-engine.ts   # Yhtenäinen laskentamoottori
│   ├── calculation-engine.ts           # Session-pohjainen moottori
│   ├── formula-service.ts              # Kaavajen hallinta
│   ├── calculations.ts                 # Peruslaskennat
│   ├── calculation-definitions.ts      # Vakiot ja apufunktiot
│   ├── pdf-calculations.ts             # PDF-laskenta
│   ├── formula-lookup-service.ts       # Lookup-taulukot
│   └── conditional-lookup.ts           # Ehdollinen lookup
│
└── components/card-system/cards/
    ├── CalculationCard.tsx             # Laskentakortti-komponentti
    └── EditableCalculationResult.tsx   # Muokattava tulos-komponentti
```

---

## 3. Laskentastrategiat

### 3.1. Strategiamalli (Strategy Pattern)

Järjestelmä käyttää Strategy-suunnittelumallia eri lämmitysmuotojen laskentaan. Jokainen strategia toteuttaa saman rajapinnan:

```typescript
interface StrategyDefinition {
  id: 'oil' | 'gas' | 'wood' | 'oilwood';
  matches: (normalized: LeadNormalized) => boolean;
  computeBasics: (normalized: LeadNormalized, lookups: LookupContext) => StrategyResultBasics;
  pdfRows: Array<{key: string, label: string, unit: string}>;
}
```

### 3.2. OilStrategy (Öljylämmitys)

**Tiedosto**: `src/domain/calc/strategies/Oil.ts`

**Tunnistus**:
- Lämmitysmuoto sisältää "öljy"
- EI sisällä "puu"

**Laskentalogiikka**:
```typescript
const liters = kokonaismenekki ?? laskennallinenenergiantarve / 10;
const oilPrice = oilPrice ?? lookups.oilPrice ?? 1.3;
const annualCost = menekinhintavuosi ?? liters * oilPrice;
const co2 = liters * (lookups.co2.oilPerLiter || 2.66);
```

**Vakiot**:
- Huoltokustannus: 200 €/vuosi
- CO2-kerroin: 2.66 kg CO2/litra
- Oletushinta: 1.3 €/litra
- Energiasisältö: 10 kWh/litra

**PDF-rivit**:
- Öljyn kulutus (L/vuosi)
- Öljyn hinta (€/litra)
- Huoltokustannus (€/vuosi)
- CO₂-päästöt (kg/vuosi)

### 3.3. GasStrategy (Kaasulämmitys)

**Tiedosto**: `src/domain/calc/strategies/Gas.ts`

**Tunnistus**:
- Lämmitysmuoto sisältää "kaasu"

**Laskentalogiikka**:
```typescript
const m3 = kokonaismenekki || 0;
const pricePerMWh = lookups.gasPricePerMWh || 55;
const annualCost = menekinhintavuosi || 0;
const co2 = laskennallinenenergiantarve * (lookups.co2.gasPerKWh || 0.201);
```

**Vakiot**:
- Huoltokustannus: 300 €/vuosi
- CO2-kerroin: 0.201 kg CO2/kWh
- Oletushinta: 55 €/MWh

**PDF-rivit**:
- Kaasun kulutus (m³/vuosi)
- Kaasun hinta (€/MWh)
- Huoltokustannus (€/vuosi)
- CO₂-päästöt (kg/vuosi)

### 3.4. WoodStrategy (Puulämmitys)

**Tiedosto**: `src/domain/calc/strategies/Wood.ts`

**Tunnistus**:
- Lämmitysmuoto sisältää "puu"
- EI sisällä "öljy"

**Laskentalogiikka**:
```typescript
const puumotti = kokonaismenekki || 0;
const annualCost = menekinhintavuosi || 0;
const co2 = laskennallinenenergiantarve * 0.0; // Neutraali
```

**Vakiot**:
- Huoltokustannus: 200 €/vuosi
- CO2-kerroin: 0 (hiilineutraali)

**PDF-rivit**:
- Puun menekki (puumottia/vuosi)
- Puun hinta (€/vuosi)
- Huoltokustannus (€/vuosi)
- CO₂-päästöt (kg/vuosi)

### 3.5. OilWoodMixedStrategy (Sekalämmitys)

**Tiedosto**: `src/domain/calc/strategies/OilWoodMixed.ts`

**Tunnistus**:
- Lämmitysmuoto sisältää sekä "öljy" että "puu"

**Laskentalogiikka**:
- Käyttää öljystrategian laskentaa pohjana
- Tyypillisesti pienempi kulutus kuin pelkässä öljylämmityksessä
- Sama laskenta kuin OilStrategy

**Vakiot**:
- Samat kuin OilStrategy

---

## 4. Laskentamoottorit

### 4.1. UnifiedCalculationEngine

**Tiedosto**: `src/lib/unified-calculation-engine.ts`

**Tarkoitus**: Yhtenäinen sisäänkäynti kaikille laskentapyynnöille. Tukee kaikkia shortcode-tyyppejä ja tarjoaa välimuistitetun, iteratiivisen riippuvuuksien ratkaisun.

#### Keskeiset Ominaisuudet

**Tuetut Shortcode-tyypit**:
- `[calc:formula-name]` - Kaava-viittaukset
- `[lookup:lookup-name]` - Lookup-taulukkoviittaukset
- `{field-name}` - Lomakekentät

**Prosessointi**:
```typescript
1. Puretaan riippuvuudet sisällöstä
2. Ratkaistaan riippuvuudet iteratiivisesti (ei rekursio)
3. Korvataan arvot sisältöön
4. Arvioidaan matemaattinen lauseke
5. Palautetaan tulos
```

**Välimuisti**:
- Session-kohtainen välimuisti
- TTL: 5 minuuttia (kaavat)
- Riippuvuuksien automaattinen tunnistus

**Turvallisuus**:
- Maksimisyvyys: 10 tasoa
- Eräkoko: 10 riippuvuutta kerralla
- Turvallinen matemaattisten lausekkeiden arviointi
- Tasapainotetut sulkeet validoidaan

#### Esimerkki Käytöstä

```typescript
const engine = new UnifiedCalculationEngine(supabase, sessionId, formData);
const result = await engine.process('[calc:annual-energy-need]');

if (result.success) {
  console.log('Tulos:', result.result);
  console.log('Riippuvuudet:', result.dependencies);
  console.log('Suoritusaika:', result.executionTime, 'ms');
}
```

### 4.2. Session-Based Calculation Engine

**Tiedosto**: `src/lib/calculation-engine.ts`

**Tarkoitus**: Yksinkertaisempi moottori, joka tukee matemaattisia lausekkeita shortcode-viittauksilla.

**Tuettu Syntaksi**:
```typescript
// Peruslaskenta
"100 + 200"  // -> 300

// Shortcode-viittaukset
"[calc:energy-usage] * 0.15"

// Yhdistetty
"([calc:energy-usage] * 0.15 + 100)"

// Lookup-viittaukset
"[lookup:kokonaismenekki] * [lookup:oil-price]"
```

**Session Context**:
```typescript
interface CalculationContext {
  sessionId: string;
  results: Map<string, number>;  // Välimuisti
  formData: Record<string, any>;
}
```

### 4.3. Formula Service

**Tiedosto**: `src/lib/formula-service.ts`

**Tarkoitus**: Kaavajen hallinta, validointi ja suoritus.

#### CRUD-operaatiot

**Kaavajen haku**:
```typescript
const formulas = await getFormulas(forceRefresh?: boolean);
```

**Kaavan luonti**:
```typescript
const formula = await createFormula({
  name: 'Vuotuinen energiantarve',
  formula_text: '[field:neliot] * 100',
  formula_type: 'energy_calculation',
  description: 'Laskee vuotuisen energiantarpeen',
  is_active: true
});
```

**Kaavan päivitys**:
```typescript
const updated = await updateFormula({
  id: 'uuid',
  formula_text: '[field:neliot] * 120'
});
// Automaattinen viittausten päivitys muissa kaavoissa
```

#### Turvallisuus

**Rate Limiting**:
- 30 suoritusta/minuutti per käyttäjä
- Automaattinen esto ylitettäessä

**Validointi**:
- Maksimi 1000 merkkiä
- Maksimi 20 muuttujaa per kaava
- Vaaralliset funktiot estetty (eval, Function, setTimeout, etc.)
- Tasapainotetut sulkeet, hakasulkeet ja aaltosulkeet

**Sallitut Math-funktiot**:
- abs, round, floor, ceil, pow, sqrt, min, max

#### Riippuvuuksien Hallinta

**Syklisten riippuvuuksien tunnistus**:
```typescript
const check = await detectCircularDependencies('formula-name');
if (check.hasCircular) {
  console.error('Syklinen riippuvuus:', check.circularPath);
}
```

**Automaattinen viittausten päivitys**:
- Kun kaavan nimi muuttuu, kaikki viittaukset päivitetään automaattisesti

---

## 5. UI-komponentit

### 5.1. CalculationCard

**Tiedosto**: `src/components/card-system/cards/CalculationCard.tsx`

**Vastuut**:
- Laskelman suorittaminen kun kortti paljastetaan
- Riippuvuuksien seuranta ja uudelleenlaskenta
- Tuloksen näyttäminen ja välimuistitus
- Automaattinen kortin valmistuminen

#### Laskennan Käynnistys

```typescript
useEffect(() => {
  // 1. Tarkista onko kortti paljastettu
  if (!cardState?.isRevealed) return;

  // 2. Tarkista riippuvuuksien muutokset
  if (dependenciesChanged) {
    lastDependencyValuesRef.current = currentDependencyValues;
  }

  // 3. Suorita laskenta
  const engine = new UnifiedCalculationEngine(supabase, sessionId, formData);
  const result = await engine.process(card.config.main_result);

  // 4. Käsittele tulos
  if (result.success) {
    setCalculatedResult(formattedResult);
    updateField(card.config.field_name, numericResult);
  }
}, [formData, cardStates]);
```

#### Konfiguraatio

```typescript
interface CardConfig {
  main_result: string;           // Esim. "[calc:annual-energy-need]"
  field_name: string;             // Esim. "laskennallinenenergiantarve"
  description?: string;
  auto_complete_on_success: boolean;
  enable_edit_mode: boolean;
  edit_prompt?: string;
  show_submit_button?: boolean;
  email_template?: string;
}
```

#### GTM Tracking

```typescript
// Laskenta aloitettu
gtmEvents.calculationStart(cardName);

// Laskenta valmis
gtmEvents.calculationComplete(cardName, {
  card_id: card.id,
  result: formattedResult,
  unit: 'kWh',
  formula: '[calc:annual-energy-need]'
});

// Virhe
gtmEvents.errorOccurred('calculation_failed', errorMessage);
```

### 5.2. EditableCalculationResult

**Tiedosto**: `src/components/card-system/cards/EditableCalculationResult.tsx`

**Vastuut**:
- Lasketun tuloksen näyttäminen
- Käyttäjän tekemien muutosten hallinta
- Alkuperäisen arvon palauttaminen
- Validointi

#### Tilat

**Display Mode** (oletusnäkymä):
- Näyttää lasketun arvon ja yksikön
- "Korjaa lukemaa" -painike
- "Muokattu" -merkki jos arvo on korjattu
- "Palauta alkuperäinen" -painike korjatuille arvoille

**Edit Mode** (muokkaustila):
- Tekstikenttä arvon syöttöön
- Yksikkö näkyy kentän vieressä
- "Tallenna" ja "Peruuta" -painikkeet
- Enter = tallenna, Escape = peruuta
- Validointi: min/max-arvot

#### Numero-muotoilu

```typescript
// Suomalainen numero-muotoilu
const formatNumber = (num: number): string => {
  return num.toLocaleString('fi-FI');
};
// 2706.6 -> "2 706,6"

// Parsinta
const parseFormattedNumber = (input: string): number | null => {
  const normalized = input
    .replace(/\s/g, '')    // Poista välilyönnit
    .replace(',', '.');     // Pilkku -> piste
  return parseFloat(normalized);
};
```

#### Override-mekanismi

Kun käyttäjä muuttaa arvoa:
1. Uusi arvo tallennetaan `formData[field_name]`
2. Arvo merkataan "muokatuksi"
3. Laskenta ei enää korvaa tätä arvoa automaattisesti
4. Käyttäjä voi palauttaa alkuperäisen arvon

---

## 6. Tietovirta

### 6.1. Laskelman Suoritus End-to-End

```
1. Käyttäjä syöttää tiedot lomakkeelle
   ↓
2. FormData päivittyy CardContext:ssa
   ↓
3. CalculationCard detectoi muutoksen
   ↓
4. UnifiedCalculationEngine käynnistyy
   ↓
5. Riippuvuudet tunnistetaan
   [calc:formula] → Formulas-taulu
   [lookup:name] → Enhanced Lookups
   {field} → FormData
   ↓
6. Riippuvuudet ratkaistaan iteratiivisesti
   - Syvyys max 10
   - Eräkoko 10
   - Välimuistitus
   ↓
7. Matemaattinen lauseke arvioidaan
   Function('return ' + expression)
   ↓
8. Tulos muotoillaan
   - Suomalainen numero-muotoilu
   - Yksikön liittäminen
   ↓
9. Tulos tallennetaan
   - formData[field_name]
   - Session cache
   - UI state
   ↓
10. UI päivittyy
    - EditableCalculationResult näyttää tuloksen
    - Kortti merkitään valmiiksi (jos konfiguroitu)
```

### 6.2. Strategian Valinta

```typescript
// src/domain/calc/CalculationService.ts

function pickStrategy(normalized: LeadNormalized): StrategyDefinition {
  // Strategiat tarkistetaan järjestyksessä:
  const STRATEGIES = [
    OilWoodMixedStrategy,  // 1. Sekalämmitys (öljy + puu)
    OilStrategy,           // 2. Öljylämmitys
    GasStrategy,           // 3. Kaasulämmitys
    WoodStrategy,          // 4. Puulämmitys
  ];

  return STRATEGIES.find(s => s.matches(normalized)) || OilStrategy;
}
```

### 6.3. Metriikoiden Laskenta

```typescript
function computeMetrics(normalized: LeadNormalized, lookups: LookupContext): Metrics {
  // 1. Valitse strategia
  const strategy = pickStrategy(normalized);

  // 2. Laske perusarvot strategian mukaan
  const basics = strategy.computeBasics(normalized, lookups);

  // 3. Laske nykyiset kustannukset
  const currentCost = {
    year1: basics.annualCurrentCost,
    year5: basics.annualCurrentCost * 5,
    year10: basics.annualCurrentCost * 10,
  };

  // 4. Laske uuden järjestelmän kulutus
  const newElectricityKWh = Math.round(
    (normalized.laskennallinenenergiantarve || 0) / 3.8  // COP = 3.8
  );

  // 5. Laske uuden järjestelmän kustannukset
  const newCostYear1 = Math.round(
    newElectricityKWh * (lookups.electricityPrice || 0.15)
  );

  // 6. Laske CO2-päästöt
  const newCo2 = Math.round(
    newElectricityKWh * (lookups.co2.electricityPerKWh || 0.181)
  );

  return {
    current: { cost: currentCost, consumption: basics.currentConsumption, co2: ... },
    newSystem: { cost: newCost, electricityKWh: newElectricityKWh, co2Year: newCo2 }
  };
}
```

---

## 7. Laskentakaavat ja Vakiot

### 7.1. Yleiset Vakiot

**Tiedosto**: `src/lib/calculation-definitions.ts`

```typescript
export const CALCULATION_CONSTANTS = {
  // Energia
  BASE_ENERGY_PER_M2: 100,           // kWh/m²/vuosi
  CEILING_HEIGHT_FACTOR: 2.5,        // Viitekattokorkeus (m)
  HEAT_PUMP_COP: 3.3,                // Lämpökerroin

  // Hinnat
  ELECTRICITY_PRICE: 0.12,           // €/kWh
  OIL_PRICE: 1.3,                    // €/litra
  DISTRICT_HEATING_PRICE: 0.09,      // €/kWh

  // Asennuskustannukset
  DEFAULT_INSTALLATION_COST: 15000,  // €
  INSTALLATION_WITH_SUPPORT: 12000,  // € (tuella)

  // CO2-kertoimet
  CO2_PER_LITER_OIL: 2.66,          // kg CO2/litra
  CO2_PER_KWH_ELECTRICITY: 0.181,   // kg CO2/kWh
  CO2_PER_KWH_DISTRICT: 0.188,      // kg CO2/kWh

  // Muunnoskertoimet
  KWH_PER_LITER_OIL: 10,            // kWh/litra
};
```

### 7.2. PDF-Vakiot

**Tiedosto**: `src/lib/pdf-calculation-definitions.ts`

```typescript
export const PDF_CALCULATION_CONSTANTS = {
  HEAT_PUMP_COP: 3.8,                // Korkeampi COP PDF:lle
  ELECTRICITY_PRICE: 0.15,           // €/kWh (päivitetty)
  OIL_PRICE: 1.3,                    // €/litra
  CO2_ELECTRICITY_PER_KWH: 0.181,   // kg CO2/kWh
  CO2_OIL_PER_LITER: 2.66,          // kg CO2/litra
};
```

### 7.3. Peruslaskennat

#### Vuotuinen Energiantarve

```typescript
annualEnergyNeed = neliot × BASE_ENERGY_PER_M2 × (huonekorkeus / CEILING_HEIGHT_FACTOR)
                 × buildingAgeFactor
                 × hotWaterFactor
```

**Rakennusvuoden kerroin**:
- Ennen 1960: 1.3
- 1960-1979: 1.2
- 1980-1999: 1.1
- 2000-2009: 1.0
- 2010 jälkeen: 0.9

**Lämpimän veden kerroin**:
- 1-2 henkilöä: 0.9
- 3-4 henkilöä: 1.0
- 5+ henkilöä: 1.15

#### Lämpöpumpun Kulutus

```typescript
heatPumpConsumption = annualEnergyNeed / HEAT_PUMP_COP
```

#### Lämpöpumpun Vuosikustannus

```typescript
heatPumpCostAnnual = heatPumpConsumption × ELECTRICITY_PRICE
```

#### Vuotuiset Säästöt

```typescript
annualSavings = currentHeatingCost - heatPumpCostAnnual
```

#### Takaisinmaksuaika

```typescript
paybackPeriod = INSTALLATION_COST / annualSavings  // vuosia
```

#### CO2-vähenemä

```typescript
// Öljylämmitys
currentCO2 = oilConsumption × CO2_PER_LITER_OIL

// Lämpöpumppu
newCO2 = heatPumpConsumption × CO2_PER_KWH_ELECTRICITY

// Vähenemä
co2Reduction = currentCO2 - newCO2
```

#### Hyötysuhteen Parannus

```typescript
efficiencyImprovement = ((currentConsumption - newConsumption) / currentConsumption) × 100  // %
```

#### Sijoitetun pääoman tuotto (ROI)

```typescript
returnOnInvestment = ((tenYearSavings - installationCost) / installationCost) × 100  // %
```

---

## 8. PDF-generointi

### 8.1. PDF Calculation Flow

**Tiedosto**: `src/lib/pdf-calculations.ts`

```typescript
async function calculatePDFValues(
  formData: Record<string, any>,
  sessionId?: string
): Promise<CalculationResults>
```

**Prosessi**:

1. **Hae aktiivinen PDF-template**
   ```typescript
   const { data: pdfTemplate } = await supabase
     .from('pdf_templates')
     .select('template_html')
     .eq('is_active', true)
     .single();
   ```

2. **Pura shortcodet templatesta**
   ```typescript
   const shortcodes = extractShortcodesFromTemplate(template_html);
   // Tulos: ['[calc:annual-energy-need]', '[lookup:kokonaismenekki]', ...]
   ```

3. **Luo UnifiedCalculationEngine**
   ```typescript
   const engine = createUnifiedEngine(sessionId || 'pdf-calc', formData);
   ```

4. **Prosessoi jokainen shortcode**
   ```typescript
   for (const shortcode of shortcodes) {
     const result = await engine.process(shortcode);
     results[key] = parseFloat(result.result);
   }
   ```

5. **Lisää standardilaskelmat**
   ```typescript
   const standardMetrics = await calculateStandardMetrics(formData, engine);
   return { ...standardMetrics, ...results };
   ```

### 8.2. PDF-Template Shortcode Format

Template käyttää samoja shortcodeja kuin UI:

```html
<div class="metric">
  <h3>Vuotuinen energiantarve</h3>
  <p class="value">[calc:annual-energy-need] kWh</p>
</div>

<div class="metric">
  <h3>Nykyinen kulutus</h3>
  <p class="value">[lookup:kokonaismenekki] L/vuosi</p>
</div>

<div class="metric">
  <h3>Vuotuiset säästöt</h3>
  <p class="value">[calc:annual-savings] €</p>
</div>
```

### 8.3. Standard Metrics

PDF sisältää aina seuraavat metriikat:

```typescript
interface CalculationResults {
  // Energiametriikat
  annual_energy_need: number;        // kWh/vuosi
  heat_pump_consumption: number;     // kWh/vuosi
  heat_pump_cost_annual: number;     // €/vuosi
  current_heating_cost: number;      // €/vuosi

  // Säästöt
  annual_savings: number;            // €/vuosi
  five_year_savings: number;         // € (5v)
  ten_year_savings: number;          // € (10v)
  monthly_savings: number;           // €/kk

  // Taloudelliset
  payback_period: number;            // vuosia
  return_on_investment: number;      // %

  // Ympäristö
  co2_reduction: number;             // kg CO2/vuosi
  efficiency_improvement: number;    // %
}
```

---

## 9. Tietokantarakenne

### 9.1. formulas (Kaavat)

```sql
CREATE TABLE formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  formula_text TEXT NOT NULL,
  formula_type TEXT,
  description TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Esimerkki**:
```json
{
  "id": "uuid",
  "name": "annual-energy-need",
  "formula_text": "[field:neliot] * 100 * ([field:huonekorkeus] / 2.5)",
  "formula_type": "energy_calculation",
  "description": "Laskee vuotuisen energiantarpeen",
  "is_active": true
}
```

### 9.2. enhanced_lookups (Lookup-taulukot)

```sql
CREATE TABLE enhanced_lookups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.3. enhanced_lookup_rules (Lookup-säännöt)

```sql
CREATE TABLE enhanced_lookup_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_id UUID REFERENCES enhanced_lookups(id),
  priority INTEGER DEFAULT 0,
  condition_logic JSONB,
  action_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Esimerkki condition_logic**:
```json
{
  "operator": "AND",
  "conditions": [
    {
      "field": "lammitysmuoto",
      "operator": "contains",
      "value": "öljy"
    }
  ]
}
```

**Esimerkki action_config**:
```json
{
  "action_type": "formula",
  "formula_text": "[field:laskennallinenenergiantarve] / 10"
}
```

### 9.4. processed_values (Välimuisti)

```sql
CREATE TABLE processed_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  value_id TEXT NOT NULL,
  type TEXT NOT NULL,
  raw TEXT NOT NULL,
  processed TEXT NOT NULL,
  dependencies JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. Turvallisuus

### 10.1. Formula Execution Security

**Rate Limiting**:
```typescript
const MAX_EXECUTIONS_PER_MINUTE = 30;
const RATE_LIMIT_WINDOW = 60 * 1000;  // 1 minuutti

if (userId && !checkRateLimit(userId)) {
  return { success: false, error: 'Rate limit exceeded' };
}
```

**Validointi**:
```typescript
// Maksimipituus
if (formulaText.length > 1000) {
  errors.push('Formula is too long (maximum 1000 characters)');
}

// Vaaralliset funktiot estetty
const dangerousPatterns = [
  /eval\s*\(/i,
  /Function\s*\(/i,
  /setTimeout\s*\(/i,
  /import\s*\(/i,
  /require\s*\(/i,
  /process\s*\./i,
  // ... ja paljon muita
];
```

**Turvallinen Suoritus**:
```typescript
// Vain sallitut Math-funktiot
const safeMath = {
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  pow: Math.pow,
  sqrt: Math.sqrt,
  min: Math.min,
  max: Math.max,
};

const result = new Function('Math', 'return ' + safeFormula)(safeMath);
```

**Timeout Protection**:
```typescript
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Formula execution timeout')), 5000);
});

const result = await Promise.race([executionPromise, timeoutPromise]);
```

### 10.2. Input Validation

**Numero-validointi**:
```typescript
if (!isFinite(numValue) || Math.abs(numValue) > 1e15) {
  return {
    success: false,
    error: 'Variable has an extreme value'
  };
}
```

**Muuttujanimien validointi**:
```typescript
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
  return {
    success: false,
    error: 'Invalid variable name'
  };
}
```

### 10.3. XSS Prevention

**Shortcode-parsinta**:
- Kaikki shortcodet validoidaan ennen suoritusta
- Vain ennalta määritellyt tyypit sallittu
- HTML/Script-tagit estetty

**Output Encoding**:
- Kaikki käyttäjäsyötteet escaped
- React automaattinen XSS-suojaus
- PDF-template: HTML purification

---

## Yhteenveto

Energiaykkonen-laskurijärjestelmä on monipuolinen, turvallinen ja modulaarinen ratkaisu energialaskelmiin. Sen keskeisiä vahvuuksia ovat:

1. **Strategiapohjainen arkkitehtuuri** - Helppo lisätä uusia lämmitysmuotoja
2. **Yhtenäinen laskentamoottori** - Kaikki laskelmat yhden järjestelmän läpi
3. **Dynaaminen kaavajärjestelmä** - Kaavat muokattavissa ilman koodimuutoksia
4. **Session-pohjainen välimuisti** - Nopea suoritus ja riippuvuuksien hallinta
5. **Kattava turvallisuus** - Rate limiting, validointi, turvallinen suoritus
6. **Muokattavat tulokset** - Käyttäjä voi korjata laskelmia
7. **PDF-generointi** - Automaattinen raportointi

Järjestelmä on suunniteltu skaalautuvaksi ja ylläpidettäväksi, ja se tukee laajennuksia ilman merkittäviä arkkitehtuurimuutoksia.
