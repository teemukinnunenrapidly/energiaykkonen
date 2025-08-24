/**
 * Test script for Supabase connection
 * Run this to verify your Supabase setup is working correctly
 */

import { supabase } from './supabase';

export async function testSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('_meta').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Test environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.error('❌ Missing environment variables');
      console.log('Make sure you have set:');
      console.log('- NEXT_PUBLIC_SUPABASE_URL');
      console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return false;
    }
    
    console.log('✅ Environment variables are set');
    console.log(`📍 Project URL: ${url}`);
    console.log(`🔑 API Key: ${key.substring(0, 20)}...`);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error testing Supabase:', error);
    return false;
  }
}

// For direct execution in Node.js
if (require.main === module) {
  testSupabaseConnection();
}