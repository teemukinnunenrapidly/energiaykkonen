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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLookupData() {
  try {
    console.log('🔍 Checking current lookup data...');

    // Get all lookups with their conditions
    const { data: lookups, error } = await supabase
      .from('formula_lookups')
      .select(
        `
        *,
        formula_lookup_conditions (*)
      `
      )
      .order('name');

    if (error) {
      console.error('❌ Error fetching lookups:', error);
      return;
    }

    console.log(`\n📋 Found ${lookups.length} lookup tables:\n`);

    for (const lookup of lookups) {
      console.log(`🔹 ${lookup.name} (${lookup.id})`);
      console.log(`   Description: ${lookup.description || 'No description'}`);
      console.log(`   Active: ${lookup.is_active}`);
      console.log(`   Conditions: ${lookup.formula_lookup_conditions.length}`);

      lookup.formula_lookup_conditions
        .sort((a, b) => a.condition_order - b.condition_order)
        .forEach((condition, index) => {
          console.log(
            `   ${index + 1}. ${condition.condition_rule} → ${condition.target_shortcode}`
          );
        });

      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to check lookup data:', error);
  }
}

checkLookupData();
