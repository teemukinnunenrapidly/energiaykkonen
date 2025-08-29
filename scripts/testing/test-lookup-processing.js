#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  } catch (error) {
    console.log('Could not load .env.local, using existing env vars');
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

async function testLookupProcessing() {
  try {
    console.log('🧪 Testing lookup processing...');

    // Test both lookup configurations
    const testCases = [
      {
        name: 'kokonaismenekki',
        field: 'valitse',
        value: 'Öljylämmitys',
        expected: '[calc:oljyn-menekki-vuodessa]',
      },
      {
        name: 'menekin-hinta',
        field: 'valitse',
        value: 'Öljylämmitys',
        expected: '[calc:menekin-hinta-oljy]',
      },
    ];

    for (const test of testCases) {
      console.log(`\n🔍 Testing lookup: ${test.name}`);

      // Simulate API call to test lookup resolution
      const response = await fetch(`http://localhost:3004/api/test-condition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookupName: test.name,
          formData: { [test.field]: test.value },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${test.name} result:`, result);

        if (result.success && result.shortcode === test.expected) {
          console.log(`✅ ${test.name} - PASSED`);
        } else {
          console.log(`❌ ${test.name} - FAILED`);
          console.log(`   Expected: ${test.expected}`);
          console.log(`   Got: ${result.shortcode || result.error}`);
        }
      } else {
        console.log(`❌ ${test.name} - API Error:`, response.statusText);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLookupProcessing();
