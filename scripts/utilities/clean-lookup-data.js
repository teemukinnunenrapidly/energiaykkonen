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

async function cleanLookupData() {
  try {
    console.log('🧹 Cleaning up hardcoded lookup data...');

    // Remove all existing lookup conditions (but keep the lookup tables)
    console.log('Removing all conditions...');
    const { error: deleteConditionsError } = await supabase
      .from('formula_lookup_conditions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all conditions

    if (deleteConditionsError) {
      console.error('❌ Error deleting conditions:', deleteConditionsError);
      return;
    }

    console.log('✅ Deleted all existing conditions');

    // Also remove the lookup tables themselves since they were hardcoded
    console.log('Removing hardcoded lookup tables...');
    const { error: deleteLookupError } = await supabase
      .from('formula_lookups')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all lookups

    if (deleteLookupError) {
      console.error('❌ Error deleting lookups:', deleteLookupError);
      return;
    }

    console.log('✅ Deleted all hardcoded lookup tables');

    // Verify cleanup
    const { data: remainingLookups, error: checkError } = await supabase
      .from('formula_lookups')
      .select('*');

    if (checkError) {
      console.error('❌ Error checking remaining data:', checkError);
      return;
    }

    console.log(
      `\n✅ Cleanup complete! Remaining lookups: ${remainingLookups?.length || 0}`
    );
    console.log(
      '📋 The lookup tables are now ready for you to configure through the admin interface.'
    );
    console.log(
      '📋 You can create your lookup tables with the exact conditions you need.'
    );
  } catch (error) {
    console.error('❌ Failed to clean lookup data:', error);
  }
}

cleanLookupData();
