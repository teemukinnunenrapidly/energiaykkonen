/**
 * Main PDF data processor
 * Uses database-driven shortcodes for processing PDF data
 */

import { Lead } from '@/lib/supabase';
import { flattenLeadData } from '@/lib/lead-helpers';
import { normalizeLead } from '@/domain/normalize/normalizeLead';
import { computeMetrics, pickStrategy } from '@/domain/calc/CalculationService';
import { DEFAULT_LOOKUPS } from '@/domain/calc/types';

/**
 * Process lead data into PDF-ready format using hardcoded calculations
 */
export async function processPDFData(lead: Lead): Promise<Record<string, any>> {
  // Use our PDF-specific calculations directly
  const { generatePDFCalculations } = await import(
    '../pdf-calculation-definitions'
  );

  // Generate all PDF calculations from the lead
  const pdfCalculations = generatePDFCalculations(lead);

  // Flatten lead data to access JSONB fields
  const flatLead = flattenLeadData(lead);

  // Build PDF data object with all necessary fields
  const pdfData: Record<string, any> = {
    // All calculated values from PDF calculations
    ...pdfCalculations,

    // Customer information
    customerName:
      flatLead.nimi ||
      `${flatLead.first_name} ${flatLead.last_name}`.trim() ||
      'Asiakas',
    customerAddress: flatLead.osoite || '',
    customerEmail: flatLead.sahkoposti || '',
    customerPhone: flatLead.puhelinnumero || '',
    customerCity: flatLead.paikkakunta || '',

    // Property information
    propertySize: `${flatLead.neliot || 0} m²`,
    buildingYear: flatLead.rakennusvuosi || '',
    buildingArea: flatLead.neliot || 0,
    peopleCount: flatLead.henkilomaara || 2,

    // Current heating system
    currentSystem: flatLead.lammitysmuoto || 'Nykyinen lämmitys',
    // Bring through menekinhintavuosi if available so PDF can compute 1/5/10y
    menekin_hinta_vuosi:
      parseFloat(String(flatLead.menekinhintavuosi || 0).replace(',', '.')) ||
      0,
    // Fuel-specific fields (defaults for oil). Gas/Wood handled in template with conditional UI
    kokonaismenekki: (() => {
      const raw =
        flatLead.kokonaismenekki ??
        flatLead.menekki ??
        flatLead.currentConsumption ??
        flatLead.kokonais_menekki ??
        0;
      const num = parseFloat(String(raw).replace(',', '.'));
      return Number.isNaN(num) ? 0 : num;
    })(),
    gas_price: flatLead.gas_price, // €/kWh if present
    gas_price_mwh: flatLead.gas_price_mwh || 55, // €/MWh default
    gas_consumption_m3:
      Math.round((flatLead.laskennallinenenergiantarve || 0) / 10) || 0,
    oilConsumption: (() => {
      const raw =
        flatLead.kokonaismenekki ??
        flatLead.oil_consumption ??
        flatLead.oil_liters ??
        null;
      if (raw !== null && raw !== undefined) {
        const n = parseFloat(String(raw).replace(/\s/g, '').replace(',', '.'));
        if (!Number.isNaN(n) && n > 0) {
          return Math.round(n);
        }
      }
      const energy = parseFloat(
        String(flatLead.laskennallinenenergiantarve || 0).replace(',', '.')
      );
      return Math.round(energy / 10) || 0;
    })(),
    oilPrice: '1,30',
    currentMaintenance: 200,

    // New system (heat pump) - using calculated values
    electricityConsumption: pdfCalculations.new_electricity_consumption,
    electricityPrice: pdfCalculations.electricity_price,
    newMaintenance10Years: 30,

    // Cost comparisons - using calculated values
    currentYear1Cost: pdfCalculations.current_cost_1year,
    currentYear5Cost: pdfCalculations.current_cost_5years,
    currentYear10Cost: pdfCalculations.current_cost_10years,
    newYear1Cost: pdfCalculations.new_cost_1year,
    newYear5Cost: pdfCalculations.new_cost_5years,
    newYear10Cost: pdfCalculations.new_cost_10years,

    // Savings - using calculated values
    savings1Year: pdfCalculations.savings_1year,
    savings5Year: pdfCalculations.savings_5years,
    savings10Year: pdfCalculations.savings_10years,
    annualSavings: pdfCalculations.annual_savings,
    fiveYearSavings: pdfCalculations.five_year_savings,
    tenYearSavings: pdfCalculations.ten_year_savings,

    // Environmental impact
    currentCO2: pdfCalculations.current_co2_yearly,
    newCO2: pdfCalculations.new_co2_yearly,
    co2Reduction: pdfCalculations.co2_reduction_yearly,

    // Heat pump details
    heat_pump_consumption: pdfCalculations.heat_pump_consumption,
    heat_pump_cost_annual: pdfCalculations.heat_pump_cost_annual,

    // Document metadata
    calculationNumber:
      flatLead.id?.slice(0, 8).toUpperCase() ||
      Date.now().toString(36).toUpperCase(),
    calculationDate: new Date().toLocaleDateString('fi-FI'),

    // Energy calculations
    energyNeed:
      parseFloat(
        String(flatLead.laskennallinenenergiantarve || 0)
          .toString()
          .replace(',', '.')
      ) || 0,
    annual_energy_need: flatLead.laskennallinenenergiantarve || 0,
    total_energy_need: flatLead.laskennallinenenergiantarve || 0,
  };

  // Business rule: upgrade subsidy note to 7 000€ when conditions match
  try {
    const lammitys = String(
      (flatLead.lammitysmuoto || flatLead.current_heating || '') as string
    ).toLowerCase();
    const rawAllText = JSON.stringify(flatLead);
    const allText = rawAllText.toLowerCase();
    const normalizedText = allText
      .replace(/[–—]/g, '-') // normalize dashes
      .replace(/\s+/g, ' ')
      .trim();

    // Legacy text signals (kept for backward compatibility in other rules)
    // intentionally not used
    void (lammitys.includes('öljy') || lammitys.includes('oil'));
    // Detect replacement selection either from structured field
    const changeField = String(
      (flatLead as any).heating_system_change ||
        (flatLead as any).heatingSystemChange ||
        ''
    )
      .toLowerCase()
      .trim();
    const choseReplaceField = changeField === 'replace';
    // Strict field checks for 7000€ rule
    const lammitysField = String(flatLead.lammitysmuoto || '')
      .toLowerCase()
      .trim();
    const isOilOrOilWoodField =
      lammitysField.includes('öljylämmitys') ||
      lammitysField.includes('öljy+puu');
    const supportField = String((flatLead as any).valittutukimuoto || '')
      .toLowerCase()
      .trim();
    const isHouseholdDeductionField =
      supportField === 'normaali kotitalousvähennys' ||
      supportField === 'korotettu kotitalousvähennys';
    const choseHouseholdDeduction =
      allText.includes('kotitalous') &&
      (allText.includes('normaali') || allText.includes('korotettu'));
    const phraseEly = 'ely-keskus tuki';
    const choseEly =
      normalizedText.includes(phraseEly) || supportField === 'ely-keskus tuki';

    const shouldUse7000 =
      choseReplaceField && isOilOrOilWoodField && isHouseholdDeductionField;

    if (shouldUse7000) {
      pdfData.subsidyNoteAmount = 7000;
      pdfData.subsidyNoteText =
        'Maksimaalinen kotitalousvähennys öljylämmityksestä luopuvalle on 7000e.';
    } else if (choseEly) {
      pdfData.subsidyNoteAmount = 4000;
      pdfData.subsidyNoteText =
        '* ELY-keskuksen energiatuki öljylämmityksestä luopumiseen. Tuki on 4 000 € pientaloille. Edellyttää hakemuksen tekemistä ennen töiden aloittamista.';
    } else if (choseHouseholdDeduction) {
      pdfData.subsidyNoteAmount = 3200;
      pdfData.subsidyNoteText = 'Normaali kotitalousvähennys.';
    } else {
      pdfData.subsidyNoteAmount = 0;
      pdfData.subsidyNoteText = '';
    }
  } catch {}

  // Strategy-based overrides (new pipeline)
  try {
    const { normalized } = normalizeLead(flatLead);
    const strategy = pickStrategy(normalized);
    const metrics = computeMetrics(normalized, DEFAULT_LOOKUPS);

    // Costs
    pdfData.currentYear1Cost = metrics.current.cost.year1;
    pdfData.currentYear5Cost = metrics.current.cost.year5;
    pdfData.currentYear10Cost = metrics.current.cost.year10;
    pdfData.newYear1Cost = metrics.newSystem.cost.year1;
    pdfData.newYear5Cost = metrics.newSystem.cost.year5;
    pdfData.newYear10Cost = metrics.newSystem.cost.year10;

    // Savings derived from strategy-based costs (ensure consistency)
    pdfData.savings1Year = pdfData.currentYear1Cost - pdfData.newYear1Cost;
    pdfData.savings5Year = pdfData.currentYear5Cost - pdfData.newYear5Cost;
    pdfData.savings10Year = pdfData.currentYear10Cost - pdfData.newYear10Cost;

    // Emissions and consumption
    pdfData.currentCO2 = metrics.current.co2.year;
    // Per business rule: show new system (VILP) CO₂ as 0 kg/vuosi
    // regardless of grid emission factors
    pdfData.newCO2 = 0;
    pdfData.electricityConsumption = metrics.newSystem.electricityKWh;

    // Expose matched strategy id for debugging/telemetry
    pdfData.strategyId = strategy.id;
  } catch {}

  return pdfData;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use processPDFData(lead) instead
 */
export async function processPDFDataLegacy(
  formData: Record<string, any>,
  calculations?: Record<string, any>
): Promise<Record<string, any>> {
  // Convert old format to Lead format
  const lead: any = {
    id: formData.id || `temp-${Date.now()}`,

    // Form inputs
    neliot: formData.squareMeters || formData.neliot || 0,
    huonekorkeus: parseFloat(
      formData.ceilingHeight || formData.huonekorkeus || 2.5
    ),
    rakennusvuosi: formData.constructionYear || formData.rakennusvuosi || '',
    floors: parseInt(formData.floors) || 1,

    lammitysmuoto: formData.heatingType || formData.lammitysmuoto || '',
    vesikiertoinen: formData.annualHeatingCost || formData.vesikiertoinen || 0,
    current_energy_consumption: formData.currentEnergyConsumption,

    henkilomaara: parseInt(formData.henkilomaara) || 2,
    hot_water_usage:
      formData.hotWaterUsage || formData.hot_water_usage || 'Normal',

    first_name: formData.firstName || formData.first_name || '',
    last_name: formData.lastName || formData.last_name || '',
    sahkoposti: formData.sahkoposti || '',
    puhelinnumero: formData.puhelinnumero || '',
    osoite: formData.streetAddress || formData.osoite,
    paikkakunta: formData.paikkakunta,
    valittutukimuoto: formData.contactPreference || 'Email',
    message: formData.message,

    // Calculated values (merge with calculations parameter)
    annual_energy_need: calculations?.annualEnergyNeed || 0,
    heat_pump_consumption: calculations?.heatPumpConsumption || 0,
    heat_pump_cost_annual: calculations?.heatPumpCostAnnual || 0,
    annual_savings: calculations?.annualSavings || 0,
    five_year_savings: calculations?.fiveYearSavings || 0,
    ten_year_savings: calculations?.tenYearSavings || 0,
    payback_period: calculations?.paybackPeriod || 0,
    co2_reduction: calculations?.co2Reduction || 0,

    // Metadata
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return processPDFData(lead);
}
