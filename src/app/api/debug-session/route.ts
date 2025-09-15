import { NextResponse } from 'next/server';
import { getSessionSummary } from '@/lib/session-data-table';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId parameter required' },
        { status: 400 }
      );
    }

    const sessionData = getSessionSummary(sessionId);

    return NextResponse.json({
      sessionId,
      fields: sessionData.fields,
      calculations: sessionData.calculations,
      fieldCount: Object.keys(sessionData.fields).length,
      calculationCount: Object.keys(sessionData.calculations).length,
      hasEnergyCalculation:
        'Laskennallinen energiantarve (kwh)' in sessionData.calculations,
      energyCalculationValue:
        sessionData.calculations['Laskennallinen energiantarve (kwh)']?.value ||
        null,
    });
    } catch {
    return NextResponse.json(
      { error: 'Failed to fetch session data' },
      { status: 500 }
    );
  }
}
