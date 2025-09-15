import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log(
      'API: Supabase Key exists:',
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test database connection first
    const { error: testError } = await supabase
      .from('formulas')
      .select('count')
      .limit(1);

    if (testError) {
      return NextResponse.json(
        { error: `Database connection failed: ${testError.message}` },
        { status: 500 }
      );
    }

    // Fetch all formulas from the database
    const { data: formulas, error } = await supabase
      .from('formulas')
      .select(
        'id, name, description, formula_text, formula_type, variables, is_active, created_at, updated_at, version, tags'
      )
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch formulas: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ formulas: formulas || [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
