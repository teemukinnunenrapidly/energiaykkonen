import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1) Fetch active cards with fields in display order
    const { data: cardsRaw, error: cardsError } = await supabase
      .from('card_templates')
      .select(`*, card_fields(*)`)
      .eq('is_active', true)
      .order('display_order');

    if (cardsError) {
      return NextResponse.json(
        { success: false, error: cardsError.message },
        { status: 500 }
      );
    }

    const cards =
      cardsRaw?.filter(
        card => !card.id?.startsWith('00000000-0000-0000-0000-')
      ) || [];

    // 2) Collect visual object IDs referenced in card config and fetch them in one query
    const visualIds = Array.from(
      new Set(
        cards
          .map(c => c?.config?.linked_visual_object_id)
          .filter(Boolean) as string[]
      )
    );

    let visualObjectsById: Record<string, any> = {};
    if (visualIds.length > 0) {
      const { data: visuals } = await supabase
        .from('visual_objects')
        .select('*')
        .in('id', visualIds);
      (visuals || []).forEach(vo => {
        visualObjectsById[vo.id] = vo;
      });
    }

    // 3) Fetch formulas (active)
    const { data: formulas } = await supabase
      .from('formulas')
      .select('id,name,formula_text,unit')
      .eq('is_active', true)
      .order('name');

    // 4) Fetch enhanced lookups and rules (active)
    const { data: lookups } = await supabase
      .from('enhanced_lookups')
      .select('*')
      .eq('is_active', true);

    const { data: rules } = await supabase
      .from('enhanced_lookup_rules')
      .select('*')
      .eq('is_active', true)
      .order('lookup_id, order_index');

    // optional defaults table may not exist; ignore errors
    let defaults: any[] = [];
    try {
      const { data } = await supabase
        .from('enhanced_lookup_defaults')
        .select('*');
      defaults = data || [];
    } catch {}

    // Attach visual objects to cards if present
    const cardsWithVisuals = cards.map(card => {
      const linkedId = card?.config?.linked_visual_object_id;
      if (linkedId && visualObjectsById[linkedId]) {
        return { ...card, visual_objects: visualObjectsById[linkedId] };
      }
      return card;
    });

    return NextResponse.json(
      {
        success: true,
        cards: cardsWithVisuals,
        formulas: formulas || [],
        lookups: lookups || [],
        rules: rules || [],
        defaults,
        visualObjectsById,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


