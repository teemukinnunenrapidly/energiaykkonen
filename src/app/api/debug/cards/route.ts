import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Check total cards
    const { data: allCards, error: allCardsError } = await supabase
      .from('card_templates')
      .select('id, name, title, type, is_active, display_order');

    if (allCardsError) {
      throw allCardsError;
    }

    // Check active cards
    const { data: activeCards, error: activeCardsError } = await supabase
      .from('card_templates')
      .select('id, name, title, type, is_active, display_order')
      .eq('is_active', true);

    if (activeCardsError) {
      throw activeCardsError;
    }

    // Check visual objects
    const { data: visuals, error: visualsError } = await supabase
      .from('visual_objects')
      .select('id, name, title, is_active');

    if (visualsError) {
      throw visualsError;
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalCards: allCards?.length || 0,
        activeCards: activeCards?.length || 0,
        totalVisuals: visuals?.length || 0,
        activeVisuals: visuals?.filter(v => v.is_active).length || 0,
      },
      cards: {
        all: allCards || [],
        active: activeCards || [],
      },
      visuals: visuals || [],
    });
  } catch (error) {
    console.error('Debug cards error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
