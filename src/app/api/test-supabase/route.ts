import { NextResponse } from 'next/server';
import { testSupabaseConnection } from '@/lib/test-supabase-connection';

export async function GET() {
  try {
    const isConnected = await testSupabaseConnection();
    
    return NextResponse.json({
      success: isConnected,
      message: isConnected 
        ? 'Supabase connection successful' 
        : 'Supabase connection failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error testing Supabase connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}