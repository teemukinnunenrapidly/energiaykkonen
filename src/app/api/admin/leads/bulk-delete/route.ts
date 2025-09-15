import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  // Check authentication
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: missing IDs' },
        { status: 400 }
      );
    }

    // Delete leads from database
    const { error } = await supabase.from('leads').delete().in('id', ids);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
