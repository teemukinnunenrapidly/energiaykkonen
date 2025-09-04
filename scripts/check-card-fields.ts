import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCardFields() {
  try {
    console.log('Fetching card fields from Card Builder...\n');

    // Fetch all card fields
    const { data: fields, error } = await supabase
      .from('card_fields')
      .select('*')
      .order('card_id', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching card fields:', error);
      return;
    }

    if (fields && fields.length > 0) {
      console.log('Card Fields in Database:');
      console.log('========================');

      // Group by card
      const fieldsByCard: Record<string, any[]> = {};
      fields.forEach(field => {
        if (!fieldsByCard[field.card_id]) {
          fieldsByCard[field.card_id] = [];
        }
        fieldsByCard[field.card_id].push(field);
      });

      // Display fields by card
      Object.entries(fieldsByCard).forEach(([cardId, cardFields]) => {
        console.log(`\nCard ID: ${cardId.substring(0, 8)}...`);
        cardFields.forEach(field => {
          console.log(
            `  - field_name: "${field.field_name}" | label: "${field.label}" | type: ${field.field_type}`
          );
        });
      });

      // List all unique field names
      console.log('\n\nAll Unique Field Names:');
      console.log('=======================');
      const uniqueFieldNames = [
        ...new Set(fields.map(f => f.field_name)),
      ].sort();
      uniqueFieldNames.forEach(name => {
        console.log(`  - ${name}`);
      });

      console.log('\nTotal fields:', fields.length);
      console.log('Unique field names:', uniqueFieldNames.length);
    } else {
      console.log('No card fields found in database');
    }

    // Also check the card templates to see which cards exist
    const { data: cards } = await supabase
      .from('card_templates')
      .select('id, name, type')
      .order('display_order');

    if (cards) {
      console.log('\n\nCard Templates:');
      console.log('===============');
      cards.forEach(card => {
        console.log(
          `  - ${card.name} (${card.type}) - ID: ${card.id.substring(0, 8)}...`
        );
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkCardFields();
