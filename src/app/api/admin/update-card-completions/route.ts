import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Starting card completion rules update...');

    // Update all form cards to have proper completion rules
    const { data: formCards, error: fetchError } = await supabase
      .from('card_templates')
      .select('id, name, type, config, completion_rules')
      .eq('type', 'form');

    if (fetchError) {
      console.error('Failed to fetch form cards:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch form cards',
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    console.log(`Found ${formCards?.length || 0} form cards to update`);

    const updates: any[] = [];

    for (const card of formCards || []) {
      // Check if card already has completion rules
      if (card.completion_rules) {
        console.log(
          `Card "${card.name}" already has completion rules:`,
          card.completion_rules
        );
        continue;
      }

      // Determine the appropriate completion rule based on config
      let completionRule = null;

      // Check if the config mentions all fields or required fields
      const configStr = JSON.stringify(card.config || {});

      if (
        configStr.includes('all fields') ||
        configStr.includes('all_fields')
      ) {
        completionRule = {
          form_completion: {
            type: 'all_fields',
          },
        };
      } else if (
        configStr.includes('required fields') ||
        configStr.includes('required_fields')
      ) {
        completionRule = {
          form_completion: {
            type: 'required_fields',
          },
        };
      } else {
        // Default to all_fields for form cards
        completionRule = {
          form_completion: {
            type: 'all_fields',
          },
        };
      }

      console.log(
        `Updating card "${card.name}" with completion rule:`,
        completionRule
      );

      const { error: updateError } = await supabase
        .from('card_templates')
        .update({
          completion_rules: completionRule,
          updated_at: new Date().toISOString(),
        })
        .eq('id', card.id);

      if (updateError) {
        console.error(`Failed to update card "${card.name}":`, updateError);
      } else {
        updates.push({
          id: card.id,
          name: card.name,
          rule: completionRule,
        });
      }
    }

    // Also ensure calculation cards have proper completion rules
    const { data: calcCards, error: calcFetchError } = await supabase
      .from('card_templates')
      .select('id, name, type, completion_rules')
      .eq('type', 'calculation');

    if (!calcFetchError && calcCards) {
      for (const card of calcCards) {
        if (!card.completion_rules) {
          const completionRule = {
            calculation_completion: {
              type: 'on_success',
            },
          };

          const { error: updateError } = await supabase
            .from('card_templates')
            .update({
              completion_rules: completionRule,
              updated_at: new Date().toISOString(),
            })
            .eq('id', card.id);

          if (!updateError) {
            updates.push({
              id: card.id,
              name: card.name,
              rule: completionRule,
            });
          }
        }
      }
    }

    console.log(`Successfully updated ${updates.length} cards`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} cards with completion rules`,
      updates,
    });
  } catch (error) {
    console.error('Error updating card completions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update card completions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
