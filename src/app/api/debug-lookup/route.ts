import { NextResponse } from 'next/server';
import { getFormulaLookupByName } from '@/lib/formula-lookup-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lookupName = url.searchParams.get('name') || 'Menekki';

    const lookup = await getFormulaLookupByName(lookupName);

    if (!lookup) {
      return NextResponse.json(
        { error: `Lookup table '${lookupName}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lookup,
      conditionsCount: lookup.conditions?.length || 0,
      conditions: lookup.conditions?.map(c => ({
        order: c.condition_order,
        rule: c.condition_rule,
        target: c.target_shortcode,
        active: c.is_active,
      })),
    });
    } catch {
    return NextResponse.json(
      { error: 'Failed to fetch lookup table' },
      { status: 500 }
    );
  }
}
