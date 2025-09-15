import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test the exact same query that Card Builder uses
    const { data, error } = await supabase
      .from('card_templates')
      .select('*, card_fields(*)')
      .order('display_order');

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    // Filter out sample data cards (same logic as Card Builder)
    const validCards =
      data?.filter(card => !card.id.startsWith('00000000-0000-0000-0000-')) ||
      [];

    return NextResponse.json({
      success: true,
      totalCards: data?.length || 0,
      validCards: validCards.length,
      sampleCards: (data?.length || 0) - validCards.length,
      cards: validCards.map(card => ({
        id: card.id,
        name: card.name,
        type: card.type,
        title: card.title,
        display_order: card.display_order,
        is_active: card.is_active,
        fieldCount: card.card_fields?.length || 0,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error,
      },
      { status: 500 }
    );
  }
}
