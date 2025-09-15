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
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error testing Supabase connection',
        error: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
