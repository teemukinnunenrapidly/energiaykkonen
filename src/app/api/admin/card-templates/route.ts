import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';

function getSupabaseAdmin() {
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
    if (process.env.NODE_ENV !== 'production') return null;
    throw new Error('Supabase admin env vars missing');
  }
  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ cards: [] });
    }

    const { data, error } = await supabase
      .from('card_templates')
      .select(`*, card_fields(*)`)
      .order('display_order')
      .order('display_order', { foreignTable: 'card_fields' });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch card templates' },
        { status: 500 }
      );
    }

    const validCards = (data || []).filter(
      (card: any) => !card.id?.startsWith('00000000-0000-0000-0000-')
    );
    return NextResponse.json({ cards: validCards });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


