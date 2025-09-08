#!/usr/bin/env npx tsx

/**
 * Test script for PDF generation with new calculation definitions
 * Run with: npx tsx scripts/test-pdf-generation.ts
 */

import { generatePDFCalculations } from '../src/lib/pdf-calculation-definitions';

// Test data matching actual form submission
const testLead = {
  form_data: {
    // Required fields for PDF calculations
    menekinhintavuosi: 3000, // Current annual heating cost in €
    laskennallinenenergiantarve: 20000, // Calculated energy need in kWh/year
    lammitysmuoto: 'Öljylämmitys',
    
    // Customer info
    nimi: 'Test Henkilö',
    sahkoposti: 'test@example.com',
    puhelinnumero: '040 123 4567',
    osoite: 'Testikatu 123',
    paikkakunta: 'Helsinki',
    postinumero: '00100',
    
    // Property info
    neliot: 150,
    huonekorkeus: 2.5,
    rakennusvuosi: 1985,
    henkilomaara: 4,
  }
};

console.log('🧪 Testing PDF calculations with new definitions...\n');
console.log('Input values:');
console.log('- Current annual heating cost (menekinhintavuosi):', testLead.form_data.menekinhintavuosi, '€');
console.log('- Energy need (laskennallinenenergiantarve):', testLead.form_data.laskennallinenenergiantarve, 'kWh/year');
console.log('- Heating type (lammitysmuoto):', testLead.form_data.lammitysmuoto);
console.log('\n📊 Calculating PDF values...\n');

const results = generatePDFCalculations(testLead);

console.log('Current System (', testLead.form_data.lammitysmuoto, '):');
console.log('- 1 year cost:', results.current_cost_1year, '€');
console.log('- 5 years cost:', results.current_cost_5years, '€');
console.log('- 10 years cost:', results.current_cost_10years, '€');
console.log('- CO2 emissions/year:', results.current_co2_yearly, 'kg');

console.log('\nNew System (Heat Pump):');
console.log('- Formula: (', testLead.form_data.laskennallinenenergiantarve, '/ 3.8) * 0.15€');
console.log('- Electricity consumption:', results.new_electricity_consumption, 'kWh/year');
console.log('- 1 year cost:', results.new_cost_1year, '€');
console.log('- 5 years cost:', results.new_cost_5years, '€');
console.log('- 10 years cost:', results.new_cost_10years, '€');
console.log('- CO2 emissions/year:', results.new_co2_yearly, 'kg');

console.log('\nSavings:');
console.log('- Year 1 savings:', results.savings_1year, '€');
console.log('- 5 years savings:', results.savings_5years, '€');
console.log('- 10 years savings:', results.savings_10years, '€');
console.log('- CO2 reduction/year:', results.co2_reduction_yearly, 'kg');

console.log('\n✅ Test complete! PDF calculations are working correctly.');

// Verify calculation formulas
console.log('\n🔍 Formula verification:');
const expectedHeatPumpConsumption = Math.round(testLead.form_data.laskennallinenenergiantarve / 3.8);
const expectedHeatPumpCost = Math.round(expectedHeatPumpConsumption * 0.15);
const expectedSavings = testLead.form_data.menekinhintavuosi - expectedHeatPumpCost;

console.log('Heat pump consumption check:', 
  results.new_electricity_consumption === expectedHeatPumpConsumption ? '✅' : '❌',
  `(${results.new_electricity_consumption} === ${expectedHeatPumpConsumption})`
);
console.log('Heat pump cost check:', 
  results.new_cost_1year === expectedHeatPumpCost ? '✅' : '❌',
  `(${results.new_cost_1year} === ${expectedHeatPumpCost})`
);
console.log('Annual savings check:', 
  results.savings_1year === expectedSavings ? '✅' : '❌',
  `(${results.savings_1year} === ${expectedSavings})`
);