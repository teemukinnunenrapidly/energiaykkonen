import { NextResponse } from 'next/server';
import { verifyLeadsTableStructure } from '@/lib/verify-table-structure';

export async function GET() {
  try {
    console.log('Starting table structure verification...');

    const isValid = await verifyLeadsTableStructure();

    return NextResponse.json({
      success: isValid,
      message: isValid
        ? 'Leads table structure verified successfully'
        : 'Table structure verification failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error verifying table structure:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error verifying table structure',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
