import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Get all cards with their fields
    const { data: cards, error: cardsError } = await supabase
      .from('card_templates')
      .select(
        `
        id,
        name,
        card_fields(*)
      `
      )
      .eq('is_active', true)
      .order('display_order');

    if (cardsError) {
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    // Get all field IDs that actually exist in the database
    const { data: existingFields, error: fieldsError } = await supabase
      .from('card_fields')
      .select('id, card_id');

    if (fieldsError) {
      return NextResponse.json(
        { error: 'Failed to fetch fields' },
        { status: 500 }
      );
    }

    const existingFieldIds = new Set(existingFields.map(f => f.id));
    const existingCardIds = new Set(cards.map(c => c.id));

    // Find orphaned fields (fields that reference non-existent cards)
    const orphanedFields = existingFields.filter(
      field => !existingCardIds.has(field.card_id)
    );

    // Find fields that exist in frontend but not in database
    const frontendFields = cards.flatMap(card => card.card_fields || []);
    const missingFields = frontendFields.filter(
      field => !existingFieldIds.has(field.id)
    );
      orphanedFields: orphanedFields.length,
      missingFields: missingFields.length,
    });

    // Clean up orphaned fields
    if (orphanedFields.length > 0) {
      const { error: deleteError } = await supabase
        .from('card_fields')
        .delete()
        .in(
          'id',
          orphanedFields.map(f => f.id)
        );

      if (deleteError) {
      } else {
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      stats: {
        totalCards: cards.length,
        totalExistingFields: existingFields.length,
        totalFrontendFields: frontendFields.length,
        orphanedFieldsDeleted: orphanedFields.length,
        missingFields: missingFields.length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
