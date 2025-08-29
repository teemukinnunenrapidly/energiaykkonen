import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Complete Supabase connection and table verification
export async function GET() {
  const results = {
    connection: false,
    tables: {} as Record<string, any>,
    errors: [] as string[],
    warnings: [] as string[],
  };

  try {
    // Test 1: Basic connection
    const { error: testError } = await supabase
      .from('leads')
      .select('count')
      .limit(1);

    if (testError) {
      results.errors.push(`Connection test failed: ${testError.message}`);
    } else {
      results.connection = true;
    }

    // Test 2: Check all required tables
    const tablesToCheck = [
      // Core tables
      { name: 'leads', description: 'Customer leads from calculator' },
      { name: 'analytics', description: 'Analytics tracking' },
      { name: 'formulas', description: 'Calculator formulas' },

      // Visual system
      { name: 'visual_objects', description: 'Visual assets/images' },
      {
        name: 'visual_object_images',
        description: 'Images for visual objects',
      },
      { name: 'visual_folders', description: 'Folder organization' },
      { name: 'form_visual_mappings', description: 'Form to visual mappings' },

      // Card system
      { name: 'card_templates', description: 'Card configurations' },
      { name: 'card_fields', description: 'Fields within cards' },
      { name: 'form_streams', description: 'Form stream definitions' },
      { name: 'form_stream_cards', description: 'Cards in streams' },

      // Email system
      { name: 'email_templates', description: 'Email templates' },

      // Other
      { name: 'shortcodes', description: 'Shortcode definitions' },
    ];

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.tables[table.name] = {
            exists: false,
            error: error.message,
            description: table.description,
          };
          results.errors.push(`Table ${table.name}: ${error.message}`);
        } else {
          results.tables[table.name] = {
            exists: true,
            count: count || 0,
            description: table.description,
          };
        }
      } catch (err) {
        results.tables[table.name] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          description: table.description,
        };
        results.errors.push(
          `Table ${table.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    // Test 3: Check specific functionality

    // 3.1 Test Card System
    try {
      const { data: cards, error: cardsError } = await supabase
        .from('card_templates')
        .select('*, card_fields(*)')
        .limit(5);

      if (cardsError) {
        results.warnings.push(
          `Card templates query failed: ${cardsError.message}`
        );
      } else {
        results.tables['card_templates'].sampleData = cards?.length || 0;
      }
    } catch (err) {
      results.warnings.push(
        `Card system test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // 3.2 Test Visual Assets
    try {
      const { data: visuals, error: visualsError } = await supabase
        .from('visual_objects')
        .select('*, images:visual_object_images(*)')
        .limit(5);

      if (visualsError) {
        results.warnings.push(
          `Visual objects query failed: ${visualsError.message}`
        );
      } else {
        results.tables['visual_objects'].sampleData = visuals?.length || 0;
      }
    } catch (err) {
      results.warnings.push(
        `Visual system test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // 3.3 Test Email Templates
    try {
      const { data: emails, error: emailsError } = await supabase
        .from('email_templates')
        .select('*')
        .limit(5);

      if (emailsError) {
        results.warnings.push(
          `Email templates query failed: ${emailsError.message}`
        );
      } else {
        results.tables['email_templates'].sampleData = emails?.length || 0;
      }
    } catch (err) {
      results.warnings.push(
        `Email system test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // 3.4 Test Formulas
    try {
      const { data: formulas, error: formulasError } = await supabase
        .from('formulas')
        .select('*')
        .limit(5);

      if (formulasError) {
        results.warnings.push(
          `Formulas query failed: ${formulasError.message}`
        );
      } else {
        results.tables['formulas'].sampleData = formulas?.length || 0;
      }
    } catch (err) {
      results.warnings.push(
        `Formula system test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // Test 4: Check RLS policies
    try {
      // Try to insert a test lead (should work with anon key)
      const testLead = {
        square_meters: 100,
        ceiling_height: 2.5,
        construction_year: '1970-1990',
        floors: 1,
        heating_type: 'Oil',
        current_heating_cost: 2000,
        residents: 3,
        hot_water_usage: 'Normal',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '+358401234567',
        contact_preference: 'Email',
        annual_energy_need: 15000,
        heat_pump_consumption: 5000,
        heat_pump_cost_annual: 1000,
        annual_savings: 1000,
        five_year_savings: 5000,
        ten_year_savings: 10000,
        payback_period: 5,
        co2_reduction: 3000,
        status: 'new' as const,
      };

      const { error: insertError } = await supabase
        .from('leads')
        .insert([testLead]);

      if (insertError) {
        results.warnings.push(
          `RLS test - Lead insert failed: ${insertError.message}`
        );
      } else {
        // Clean up test data
        await supabase.from('leads').delete().eq('email', 'test@example.com');
      }
    } catch (err) {
      results.warnings.push(
        `RLS test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // Generate summary
    const summary = {
      connection: results.connection ? '✅ Connected' : '❌ Not connected',
      tablesFound: Object.values(results.tables).filter((t: any) => t.exists)
        .length,
      tablesExpected: tablesToCheck.length,
      errors: results.errors.length,
      warnings: results.warnings.length,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      summary,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to run tests',
        message: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    );
  }
}
