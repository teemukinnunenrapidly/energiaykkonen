import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifySessionToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const sessionCookie = request.cookies.get('admin-session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - No session cookie' },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(sessionCookie);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session or insufficient privileges' },
        { status: 401 }
      );
    }

    // Fetch the active form schema
    const { data: formSchemas, error } = await supabase
      .from('form_schemas')
      .select('*')
      .eq('name', 'Energy Calculator Form')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch form schema from database' },
        { status: 500 }
      );
    }

    if (!formSchemas || formSchemas.length === 0) {
      return NextResponse.json(
        { error: 'No active form schema found' },
        { status: 404 }
      );
    }

    const activeSchema = formSchemas[0];
    return NextResponse.json({
      success: true,
      schema: activeSchema.schema_data,
    });

  } catch (error) {
    console.error('Preview form schema error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
