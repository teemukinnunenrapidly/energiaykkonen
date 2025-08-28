import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(_request: NextRequest) {
  try {
    // Fix the display_order conflicts by updating test cards to have unique values
    const updates = [
      {
        id: '70ce3842-8f17-4699-9cc8-f8b911c7eac6', // test_info_card
        display_order: 4,
      },
      {
        id: '266257c6-bd13-42c4-ba6e-e154acf22fe3', // test_form_card
        display_order: 5,
      },
      {
        id: 'f988c840-e828-40a8-a036-733f9efc3746', // test_calc_card
        display_order: 6,
      },
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('card_templates')
        .update({ display_order: update.display_order })
        .eq('id', update.id);

      if (error) {
        console.error(`Failed to update ${update.id}:`, error);
      } else {
        console.log(
          `Updated card ${update.id} to display_order ${update.display_order}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test cards display_order values fixed',
      updates,
    });
  } catch (error) {
    console.error('Fix test cards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
