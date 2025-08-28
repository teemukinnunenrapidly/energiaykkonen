import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    console.log('API: Starting formulas fetch...');
    console.log('API: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      'API: Supabase Key exists:',
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test database connection first
    const { data: testData, error: testError } = await supabase
      .from('formulas')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('API: Database connection test failed:', testError);
      return NextResponse.json(
        { error: `Database connection failed: ${testError.message}` },
        { status: 500 }
      );
    }

    console.log('API: Database connection successful, fetching formulas...');

    // Fetch all formulas from the database
    const { data: formulas, error } = await supabase
      .from('formulas')
      .select(
        'id, name, description, formula_text, formula_type, variables, is_active, created_at, updated_at, version, tags'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API: Error fetching formulas:', error);
      return NextResponse.json(
        { error: `Failed to fetch formulas: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('API: Successfully fetched formulas:', formulas?.length || 0);
    return NextResponse.json({ formulas: formulas || [] });
  } catch (error) {
    console.error('API: Unexpected error in formulas API:', error);
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
