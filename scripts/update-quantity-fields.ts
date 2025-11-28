import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from the project
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateFields() {
  // First, find the card with name/title containing "Talon tiedot"
  const { data: cards, error: cardError } = await supabase
    .from('card_templates')
    .select('id, name, title')
    .or('name.ilike.%talon%,title.ilike.%talon%');

  if (cardError) {
    console.error('Error finding card:', cardError);
    process.exit(1);
  }

  console.log('Found cards:', cards);

  if (!cards || cards.length === 0) {
    console.log('No cards found with "Talon" in name/title');
    process.exit(1);
  }

  const cardId = cards[0].id;
  console.log('Using card ID:', cardId);

  // Find number fields in this card
  const { data: fields, error: fieldsError } = await supabase
    .from('card_fields')
    .select('id, field_name, field_type, label')
    .eq('card_id', cardId)
    .eq('field_type', 'number');

  if (fieldsError) {
    console.error('Error finding fields:', fieldsError);
    process.exit(1);
  }

  console.log('Found number fields:', fields);

  if (!fields || fields.length === 0) {
    console.log('No number fields found in this card');
    process.exit(0);
  }

  // Update field types to 'quantity'
  const { data: updated, error: updateError } = await supabase
    .from('card_fields')
    .update({ field_type: 'quantity' })
    .eq('card_id', cardId)
    .eq('field_type', 'number')
    .select();

  if (updateError) {
    console.error('Error updating fields:', updateError);
    process.exit(1);
  }

  console.log('Updated fields:', updated);
  console.log(
    'Successfully updated',
    updated?.length || 0,
    'fields to quantity type'
  );
}

updateFields();
