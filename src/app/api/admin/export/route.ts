import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getLeadsWithPagination } from '@/lib/admin-data';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin(request);

    // Parse search parameters
    const { searchParams } = new URL(request.url);

    const filters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      savingsMin: searchParams.get('savingsMin')
        ? parseFloat(searchParams.get('savingsMin')!)
        : undefined,
      savingsMax: searchParams.get('savingsMax')
        ? parseFloat(searchParams.get('savingsMax')!)
        : undefined,
      // Get ALL leads, not paginated
      page: 1,
      limit: 10000, // Large limit to get all results
    };

    // Fetch filtered leads
    const leadsData = await getLeadsWithPagination(filters);

    return NextResponse.json({
      success: true,
      leads: leadsData.leads,
      totalCount: leadsData.totalCount,
      message: `Retrieved ${leadsData.leads.length} leads for export`,
    });
  } catch {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Admin access')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch leads for export',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
