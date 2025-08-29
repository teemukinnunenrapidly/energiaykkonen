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

async function createLookupTables() {
  try {
    console.log('🚀 Creating lookup tables...');

    // Try to create tables by inserting test data (this will show if tables exist)
    console.log('Testing if tables exist by attempting operations...');

    // Test if formula_lookups table exists
    const { error: testError1 } = await supabase
      .from('formula_lookups')
      .select('id')
      .limit(1);

    if (testError1) {
      console.log(
        '❌ formula_lookups table does not exist:',
        testError1.message
      );
      console.log(
        '📋 The lookup tables need to be created manually in your Supabase dashboard.'
      );
      console.log(
        '📋 Please run the SQL script: scripts/supabase-migrations/20_create_formula_lookups.sql'
      );
      return false;
    } else {
      console.log('✅ formula_lookups table exists');
    }

    // Test if formula_lookup_conditions table exists
    const { error: testError2 } = await supabase
      .from('formula_lookup_conditions')
      .select('id')
      .limit(1);

    if (testError2) {
      console.log(
        '❌ formula_lookup_conditions table does not exist:',
        testError2.message
      );
      console.log(
        '📋 The lookup tables need to be created manually in your Supabase dashboard.'
      );
      console.log(
        '📋 Please run the SQL script: scripts/supabase-migrations/20_create_formula_lookups.sql'
      );
      return false;
    } else {
      console.log('✅ formula_lookup_conditions table exists');
    }

    console.log('🎉 Both lookup tables exist and are accessible!');

    // Verify tables were created
    const { data: lookups, error: lookupsError } = await supabase
      .from('formula_lookups')
      .select('*')
      .limit(1);

    if (lookupsError) {
      console.log(
        '⚠️ Could not verify formula_lookups table:',
        lookupsError.message
      );
    } else {
      console.log('✅ formula_lookups table verified');
    }

    const { data: conditions, error: conditionsError } = await supabase
      .from('formula_lookup_conditions')
      .select('*')
      .limit(1);

    if (conditionsError) {
      console.log(
        '⚠️ Could not verify formula_lookup_conditions table:',
        conditionsError.message
      );
    } else {
      console.log('✅ formula_lookup_conditions table verified');
    }
  } catch (error) {
    console.error('❌ Failed to create lookup tables:', error);
    process.exit(1);
  }
}

createLookupTables();
