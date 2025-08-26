import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth-edge';
import { supabase } from '@/lib/supabase';

// Create or update a form visual mapping
export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_element_id, element_type, visual_object_id } = await request.json();

    if (!form_element_id || !element_type || !visual_object_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if mapping already exists
    const { data: existingMapping } = await supabase
      .from('form_visual_mappings')
      .select('id')
      .eq('form_element_id', form_element_id)
      .eq('element_type', element_type)
      .single();

    let result;
    if (existingMapping) {
      // Update existing mapping
      const { data, error } = await supabase
        .from('form_visual_mappings')
        .update({ visual_object_id })
        .eq('id', existingMapping.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new mapping
      const { data, error } = await supabase
        .from('form_visual_mappings')
        .insert([{ form_element_id, element_type, visual_object_id }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, mapping: result });
  } catch (error) {
    console.error('Error managing form visual mapping:', error);
    return NextResponse.json(
      { error: 'Failed to manage form visual mapping' },
      { status: 500 }
    );
  }
}

// Delete a form visual mapping
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin session
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_element_id, element_type } = await request.json();

    if (!form_element_id || !element_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Delete the mapping
    const { error } = await supabase
      .from('form_visual_mappings')
      .delete()
      .eq('form_element_id', form_element_id)
      .eq('element_type', element_type);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form visual mapping:', error);
    return NextResponse.json(
      { error: 'Failed to delete form visual mapping' },
      { status: 500 }
    );
  }
}

// Get form visual mappings for a specific element
export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const form_element_id = searchParams.get('form_element_id');
    const element_type = searchParams.get('element_type');

    if (!form_element_id || !element_type) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }

    // Get the mapping
    const { data, error } = await supabase
      .from('form_visual_mappings')
      .select(`
        *,
        visual_objects (
          id,
          name,
          title,
          description
        )
      `)
      .eq('form_element_id', form_element_id)
      .eq('element_type', element_type)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      mapping: data || null 
    });
  } catch (error) {
    console.error('Error fetching form visual mapping:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form visual mapping' },
      { status: 500 }
    );
  }
}
