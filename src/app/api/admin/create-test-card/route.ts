import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Create a test info card
    const { data: infoCard, error: infoError } = await supabase
      .from('card_templates')
      .insert({
        name: 'test_info_card',
        type: 'info',
        title: 'Welcome to Energy Calculator',
        config: {
          content:
            'Tervetuloa Energiaykkösen säästölaskuriin!! Aloita syöttämällä talosi perustiedot alle.',
        },
        reveal_next_conditions: { type: 'immediately' },
        styling: {},
        is_active: true,
        display_order: 1,
      })
      .select()
      .single();

    if (infoError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create info card',
          details: infoError.message,
        },
        { status: 500 }
      );
    }

    // Create a test form card
    const { data: formCard, error: formError } = await supabase
      .from('card_templates')
      .insert({
        name: 'test_form_card',
        type: 'form',
        title: 'House Basic Information',
        config: {},
        reveal_next_conditions: { type: 'required_complete' },
        styling: {},
        is_active: true,
        display_order: 2,
      })
      .select()
      .single();

    if (formError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create form card',
          details: formError.message,
        },
        { status: 500 }
      );
    }

    // Create a test calculation card
    const { data: calcCard, error: calcError } = await supabase
      .from('card_templates')
      .insert({
        name: 'test_calc_card',
        type: 'calculation',
        title: 'Energy Savings Calculation',
        config: {
          formula:
            '[field:square_meters] * 0.15 * [field:heating_type_multiplier]',
        },
        reveal_next_conditions: { type: 'immediately' },
        styling: {},
        is_active: true,
        display_order: 3,
      })
      .select()
      .single();

    if (calcError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create calculation card',
          details: calcError.message,
        },
        { status: 500 }
      );
    }

    // Add some fields to the form card
    const { error: fieldsError } = await supabase.from('card_fields').insert([
      {
        card_id: formCard.id,
        field_name: 'square_meters',
        field_type: 'number',
        label: 'Lämmitettävät asuinneliöt',
        placeholder: 'Enter square meters',
        validation_rules: { min: 1, max: 1000 },
        width: 'full',
        display_order: 1,
        required: true,
        options: [],
      },
      {
        card_id: formCard.id,
        field_name: 'heating_type',
        field_type: 'radio',
        label: 'Valitse lämmitysmuoto',
        placeholder: '',
        validation_rules: {},
        width: 'full',
        display_order: 2,
        required: true,
        options: [
          { value: 'radiator', label: 'Vesikiertoinen patterilämmitys' },
          { value: 'floor', label: 'Vesikiertoinen lattialämmitys' },
        ],
      },
    ]);

    if (fieldsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create fields',
          details: fieldsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test cards created successfully',
      cards: {
        info: infoCard,
        form: formCard,
        calculation: calcCard,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test cards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
