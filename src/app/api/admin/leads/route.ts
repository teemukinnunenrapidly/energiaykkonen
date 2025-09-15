import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';

// Use service role on the server to bypass RLS safely for admin-only API
function getSupabaseAdmin() {
  // Support multiple common env names to avoid local misconfig friction
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL ||
    '';

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    '';

  if (!url || !serviceKey) {
    if (process.env.NODE_ENV !== 'production') {
      // Supabase admin env vars missing in dev - returning empty leads
      return null;
    }
    throw new Error('Supabase admin env vars missing');
  }
  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  // Check authentication
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // Dev fallback: no envs set locally, return empty list instead of 500
      return NextResponse.json({ leads: [] });
    }
    // Fetch leads from database, ordered by creation date (newest first)
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ leads: leads || [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
