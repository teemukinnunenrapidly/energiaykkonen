const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function moveField() {
  const firstCardId = '24190a7b-d1f3-4f9f-b55d-c26394b43b5a'; // Talon tiedot

  // First, find the "Lisätiedot" card and the henkilomaara field
  const { data: cards, error: cardsError } = await supabase
    .from('card_templates')
    .select('id, name, title')
    .or('name.ilike.%lisätied%,title.ilike.%lisätied%');

  console.log('Found Lisätiedot cards:', cards);

  if (!cards || cards.length === 0) {
    // Try to find the field directly
    const { data: fields } = await supabase
      .from('card_fields')
      .select('*, card_templates(name, title)')
      .ilike('field_name', '%henki%');
    
    console.log('Found henkilö fields:', JSON.stringify(fields, null, 2));
    return;
  }

  const lisatiedotCardId = cards[0].id;

  // Find henkilomaara field
  const { data: field, error: fieldError } = await supabase
    .from('card_fields')
    .select('*')
    .eq('card_id', lisatiedotCardId)
    .ilike('field_name', '%henki%')
    .single();

  if (fieldError || !field) {
    console.log('Field not found, searching all fields with henki...');
    const { data: allFields } = await supabase
      .from('card_fields')
      .select('*, card_templates(name, title)')
      .ilike('field_name', '%henki%');
    console.log('All henki fields:', JSON.stringify(allFields, null, 2));
    return;
  }

  console.log('Found field:', field);

  // Move field to first card, change to quantity, set default 3
  const { data: updated, error: updateError } = await supabase
    .from('card_fields')
    .update({
      card_id: firstCardId,
      field_type: 'quantity',
      display_order: 2, // After neliot (0) and huonekorkeus (1)
      validation_rules: { min: 1, max: 10, step: 1, default: 3 }
    })
    .eq('id', field.id)
    .select();

  if (updateError) {
    console.error('Error updating field:', updateError);
    return;
  }

  console.log('Successfully moved field:', updated);
}

moveField();
