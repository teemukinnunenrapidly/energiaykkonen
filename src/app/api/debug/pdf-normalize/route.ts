import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { normalizeLead } from '@/domain/normalize/normalizeLead';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { normalized, log } = normalizeLead(body || {});
    return NextResponse.json({ ok: true, normalized, log }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error) throw error;
    const raw = data?.form_data || {};
    const { normalized, log } = normalizeLead(raw);
    return NextResponse.json({ ok: true, raw, normalized, log }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
