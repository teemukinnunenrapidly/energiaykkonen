/**
 * Verification script for the leads table structure
 * Use this to verify the table was created correctly with all constraints
 */

import { supabase } from './supabase';

export async function verifyLeadsTableStructure() {
  console.log('🔍 Verifying leads table structure...');

  try {
    // Test 1: Check if table exists and basic structure
    console.log('\n📋 Test 1: Basic table structure');
    const { error: tableError } = await supabase
      .from('leads')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error(
        '❌ Table does not exist or is not accessible:',
        tableError.message
      );
      return false;
    }

    console.log('✅ Leads table exists and is accessible');

    // Test 2: Verify column constraints with test data
    console.log('\n📋 Test 2: Column constraints validation');

    // Test valid data insertion
    const validTestLead = {
      // House Information
      square_meters: 120,
      ceiling_height: 2.5,
      construction_year: '1991-2010',
      floors: 2,

      // Current Heating
      heating_type: 'Electric',
      current_heating_cost: 2500.0,
      current_energy_consumption: 15000,

      // Household
      residents: 4,
      hot_water_usage: 'Normal',

      // Contact Info
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '+358401234567',
      street_address: 'Test Street 1',
      city: 'Helsinki',
      contact_preference: 'Email',
      message: 'Test message',

      // Calculated values
      annual_energy_need: 18720.0,
      heat_pump_consumption: 5616.0,
      heat_pump_cost_annual: 673.92,
      annual_savings: 1826.08,
      five_year_savings: 9130.4,
      ten_year_savings: 18260.8,
      payback_period: 8.22,
      co2_reduction: 3744.0,

      // Metadata
      ip_address: '192.168.1.1',
      user_agent: 'Test Browser',
      source_page: 'https://test.com/calculator',
    };

    const { data: insertData, error: insertError } = await supabase
      .from('leads')
      .insert([validTestLead])
      .select()
      .single();

    if (insertError) {
      console.error(
        '❌ Failed to insert valid test data:',
        insertError.message
      );
      return false;
    }

    console.log('✅ Valid test data inserted successfully');

    // Test 3: Verify constraints are working
    console.log('\n📋 Test 3: Constraint validation');

    const invalidTests = [
      {
        name: 'Invalid square_meters (too low)',
        data: { ...validTestLead, square_meters: 5 },
      },
      {
        name: 'Invalid ceiling_height',
        data: { ...validTestLead, ceiling_height: 4.0 },
      },
      {
        name: 'Invalid construction_year',
        data: { ...validTestLead, construction_year: 'invalid' },
      },
      {
        name: 'Invalid heating_type',
        data: { ...validTestLead, heating_type: 'Nuclear' },
      },
      {
        name: 'Invalid contact_preference',
        data: { ...validTestLead, contact_preference: 'Carrier Pigeon' },
      },
    ];

    let constraintsPassed = 0;

    for (const test of invalidTests) {
      const { error } = await supabase.from('leads').insert([test.data]);

      if (error) {
        console.log(`✅ ${test.name}: Correctly rejected`);
        constraintsPassed++;
      } else {
        console.log(`❌ ${test.name}: Should have been rejected`);
      }
    }

    console.log(
      `\n📊 Constraint tests: ${constraintsPassed}/${invalidTests.length} passed`
    );

    // Test 4: Verify indexes exist
    console.log('\n📋 Test 4: Index verification');
    // Note: This would require admin privileges to query system tables
    console.log(
      'ℹ️ Index verification requires manual check in Supabase dashboard'
    );

    // Test 5: Check automatic timestamp updates
    console.log('\n📋 Test 5: Automatic timestamp updates');

    if (insertData) {
      // Update the test record to check updated_at trigger
      const { data: updateData, error: updateError } = await supabase
        .from('leads')
        .update({ notes: 'Updated for testing' })
        .eq('id', insertData.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update test record:', updateError.message);
      } else if (
        updateData &&
        updateData.updated_at !== updateData.created_at
      ) {
        console.log('✅ Automatic updated_at timestamp working');
      } else {
        console.log('❌ Automatic updated_at timestamp not working');
      }

      // Clean up test data
      await supabase.from('leads').delete().eq('id', insertData.id);

      console.log('🧹 Test data cleaned up');
    }

    console.log('\n🎉 Table structure verification completed!');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
    return false;
  }
}

// For direct execution
if (require.main === module) {
  verifyLeadsTableStructure();
}
