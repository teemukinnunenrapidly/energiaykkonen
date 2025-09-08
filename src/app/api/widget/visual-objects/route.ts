import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public API endpoint for widget to fetch visual objects
 * Supports fetching single object by ID or all active objects
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const objectId = searchParams.get('id');
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('visual_objects')
      .select(`
        id,
        name,
        title,
        description,
        content,
        visual_object_images (
          id,
          cloudflare_image_id,
          image_variant,
          display_order,
          alt_text
        )
      `)
      .eq('is_active', true);

    // If specific ID requested, filter by it
    if (objectId) {
      query = query.eq('id', objectId);
    }

    const { data: visualObjects, error } = await query;

    if (error) {
      console.error('Error fetching visual objects:', error);
      throw error;
    }

    // Transform data for widget consumption
    const transformedObjects = (visualObjects || []).map(obj => ({
      id: obj.id,
      name: obj.name,
      title: obj.title,
      description: obj.description,
      content: obj.content,
      images: (obj.visual_object_images || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => ({
          id: img.id,
          cloudflareImageId: img.cloudflare_image_id,
          variant: img.image_variant || 'public',
          altText: img.alt_text
        }))
    }));

    // Return single object if ID was provided, otherwise array
    const responseData = objectId && transformedObjects.length > 0 
      ? transformedObjects[0] 
      : transformedObjects;

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Widget visual objects API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch visual objects',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}