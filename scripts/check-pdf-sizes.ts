#!/usr/bin/env npx tsx

/**
 * Script to analyze PDF storage usage
 * Run with: npx tsx scripts/check-pdf-sizes.ts
 */

import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { SavingsReportPDF } from '../src/lib/pdf/SavingsReportPDF';

// Test data for PDF generation
const testData = {
  customerName: 'Test User',
  customerEmail: 'test@example.com',
  customerPhone: '040 123 4567',
  customerAddress: 'Testikatu 123',
  customerCity: 'Helsinki',
  buildingArea: 150,
  buildingYear: 1985,
  peopleCount: 4,
  currentSystem: 'Öljylämmitys',
  oilConsumption: 2000,
  oilPrice: '1,30',
  currentMaintenance: 200,
  currentCO2: 5320,
  currentYear1Cost: 3000,
  currentYear5Cost: 15000,
  currentYear10Cost: 30000,
  electricityConsumption: 5789,
  electricityPrice: 0.15,
  newMaintenance10Years: 30,
  newYear1Cost: 868,
  newYear5Cost: 4340,
  newYear10Cost: 8680,
  newCO2: 1048,
  savings1Year: 2132,
  savings5Year: 10660,
  savings10Year: 21320,
  calculationNumber: 'TEST-001',
  calculationDate: new Date().toLocaleDateString('fi-FI'),
};

async function analyzePDFSize() {
  console.log('📊 Analyzing PDF Storage Requirements\n');
  console.log('='.repeat(60));

  // Generate a sample PDF to check size
  const component = React.createElement(SavingsReportPDF, { data: testData });
  const asPdf = pdf(component as any);
  const bufferStream = await asPdf.toBuffer();

  // Convert stream to buffer
  const chunks = [];
  for await (const chunk of bufferStream as any) {
    chunks.push(chunk);
  }
  const pdfBuffer = Buffer.concat(chunks);

  const pdfSizeBytes = pdfBuffer.length;
  const pdfSizeKB = (pdfSizeBytes / 1024).toFixed(2);
  const pdfSizeMB = (pdfSizeBytes / (1024 * 1024)).toFixed(3);

  console.log('📄 Single PDF Size:');
  console.log(`   Bytes: ${pdfSizeBytes.toLocaleString()}`);
  console.log(`   KB: ${pdfSizeKB}`);
  console.log(`   MB: ${pdfSizeMB}`);
  console.log();

  // Calculate storage projections
  console.log('📈 Storage Projections:');
  console.log('-'.repeat(40));

  const scenarios = [
    { leads: 100, period: 'Month' },
    { leads: 1000, period: 'Year' },
    { leads: 5000, period: '5 Years' },
    { leads: 10000, period: '10 Years' },
  ];

  scenarios.forEach(scenario => {
    const totalSizeMB = (
      (pdfSizeBytes * scenario.leads) /
      (1024 * 1024)
    ).toFixed(2);
    const totalSizeGB = (
      (pdfSizeBytes * scenario.leads) /
      (1024 * 1024 * 1024)
    ).toFixed(3);
    console.log(
      `${scenario.leads.toLocaleString()} leads (${scenario.period}):`
    );
    console.log(`   Total: ${totalSizeMB} MB (${totalSizeGB} GB)`);
  });

  console.log();
  console.log('💾 Current Storage Solution:');
  console.log('-'.repeat(40));
  console.log('✅ Supabase Storage (Current)');
  console.log('   - PDFs stored in Supabase Storage bucket');
  console.log('   - NOT in database, only URL reference in JSONB');
  console.log('   - Free tier: 1 GB storage');
  console.log('   - Pro tier: 100 GB storage ($25/month)');
  console.log('   - Additional: $0.021 per GB');

  console.log();
  console.log('🎯 Recommendations:');
  console.log('-'.repeat(40));

  const estimatedMonthlyLeads = 100;
  const monthlyStorageMB = (
    (pdfSizeBytes * estimatedMonthlyLeads) /
    (1024 * 1024)
  ).toFixed(2);
  const yearlyStorageGB = (
    (pdfSizeBytes * estimatedMonthlyLeads * 12) /
    (1024 * 1024 * 1024)
  ).toFixed(3);

  console.log(`With ~${pdfSizeKB} KB per PDF:`);
  console.log(
    `- ${estimatedMonthlyLeads} leads/month = ${monthlyStorageMB} MB/month`
  );
  console.log(`- Annual storage need: ${yearlyStorageGB} GB`);
  console.log();

  if (parseFloat(yearlyStorageGB) < 1) {
    console.log('✅ CURRENT SETUP IS FINE');
    console.log('   Supabase free tier (1 GB) is sufficient for ~1 year');
  } else if (parseFloat(yearlyStorageGB) < 100) {
    console.log('✅ SUPABASE PRO TIER RECOMMENDED');
    console.log('   When you exceed 1 GB, upgrade to Pro ($25/month)');
  } else {
    console.log('⚠️  CONSIDER ALTERNATIVE STORAGE');
    console.log('   For very high volume, consider:');
    console.log('   - AWS S3');
    console.log('   - Cloudflare R2');
    console.log('   - Google Cloud Storage');
  }

  console.log();
  console.log('🔧 Optimization Options:');
  console.log('-'.repeat(40));
  console.log('1. PDF Compression (current PDF is not compressed)');
  console.log('2. Implement PDF expiry (delete after 90 days)');
  console.log('3. Generate PDFs on-demand instead of storing');
  console.log('4. Use external CDN for long-term storage');
}

analyzePDFSize().catch(console.error);
