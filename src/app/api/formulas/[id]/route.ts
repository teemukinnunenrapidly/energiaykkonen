import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Formula ID is required' },
        { status: 400 }
      );
    }

    // Fetch the formula from the database
    const { data: formula, error } = await supabase
      .from('formulas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch formula' },
        { status: 500 }
      );
    }

    if (!formula) {
      return NextResponse.json({ error: 'Formula not found' }, { status: 404 });
    }

    return NextResponse.json({ formula });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
