import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    // Get all cards without any filters
    const { data: allCards, error: allError } = await supabase
      .from('card_templates')
      .select('*')
      .order('display_order');

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }

    // Get active cards only
    const { data: activeCards, error: activeError } = await supabase
      .from('card_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 500 });
    }

    // Get cards with card_fields
    const { data: cardsWithFields, error: fieldsError } = await supabase
      .from('card_templates')
      .select('*, card_fields(*)')
      .eq('is_active', true)
      .order('display_order');

    if (fieldsError) {
      return NextResponse.json({ error: fieldsError.message }, { status: 500 });
    }

    return NextResponse.json({
      allCards: allCards || [],
      activeCards: activeCards || [],
      cardsWithFields: cardsWithFields || [],
      counts: {
        total: allCards?.length || 0,
        active: activeCards?.length || 0,
        withFields: cardsWithFields?.length || 0,
      },
    });
  } catch (error) {
    console.error('Debug cards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
