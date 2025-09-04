import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchLeadsColumns() {
  try {
    console.log('Fetching leads table structure from Supabase...\n');
    
    // Fetch one row to see the actual columns
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching leads:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('Current columns in leads table:');
      console.log('================================');
      columns.sort().forEach(col => {
        const value = data[0][col];
        const type = value === null ? 'null' : typeof value;
        console.log(`  - ${col} (${type})`);
      });
      console.log('\nTotal columns:', columns.length);
    } else {
      // If no data, try to get schema information through a different approach
      console.log('No data in leads table. Attempting to fetch schema...');
      
      // Try to insert and rollback to get column info
      const { error: schemaError } = await supabase
        .from('leads')
        .insert({})
        .select();
      
      if (schemaError) {
        // Parse the error message to extract required fields
        const errorMessage = schemaError.message;
        console.log('\nRequired fields based on error message:');
        console.log(errorMessage);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

fetchLeadsColumns();