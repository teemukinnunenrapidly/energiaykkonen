import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifySessionToken } from '@/lib/auth';

// Generate a consistent UUID for admin operations
// This ensures we have a valid UUID format for the created_by field
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const isActive = searchParams.get('is_active');

    // Build the query
    let query = supabase.from('form_schemas').select('*');

    if (name) {
      query = query.eq('name', name);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Add ordering and limit if name is specified (for getActiveFormSchema)
    if (name) {
      query = query.order('version', { ascending: false }).limit(1);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching form schemas:', error);
      return NextResponse.json(
        { error: `Failed to fetch form schemas: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in form-schemas API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, schema_data } = body;

    // Validate required fields
    if (!name || !schema_data) {
      return NextResponse.json(
        { error: 'Name and schema_data are required' },
        { status: 400 }
      );
    }

    // Insert new form schema with proper admin UUID
    const { data, error } = await supabase
      .from('form_schemas')
      .insert({
        name,
        description,
        schema_data,
        created_by: ADMIN_USER_ID, // Use consistent admin UUID
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating form schema:', error);
      return NextResponse.json(
        { error: `Failed to create form schema: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in form-schemas API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for updates' },
        { status: 400 }
      );
    }

    // Update form schema
    const { data, error } = await supabase
      .from('form_schemas')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating form schema:', error);
      return NextResponse.json(
        { error: `Failed to update form schema: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in form-schemas API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
