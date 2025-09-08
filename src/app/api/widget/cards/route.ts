import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public API endpoint for widget to fetch card templates
 * No authentication required - returns only public data
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client (server-side only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch active card templates with fields
    const { data: cards, error } = await supabase
      .from('card_templates')
      .select(`
        id,
        name,
        title,
        type,
        display_order,
        visual_object_id,
        config,
        reveal_condition,
        card_fields (
          id,
          name,
          type,
          label,
          placeholder,
          required,
          min_value,
          max_value,
          options,
          display_order,
          config
        ),
        visual_objects (
          id,
          name,
          title,
          description,
          visual_object_images (
            id,
            cloudflare_image_id,
            image_variant,
            display_order
          )
        )
      `)
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching cards:', error);
      throw error;
    }

    // Transform data for widget consumption
    const transformedCards = (cards || []).map(card => ({
      id: card.id,
      name: card.name,
      title: card.title,
      type: card.type,
      displayOrder: card.display_order,
      visualObjectId: card.visual_object_id,
      config: card.config,
      revealCondition: card.reveal_condition,
      fields: (card.card_fields || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((field: any) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          minValue: field.min_value,
          maxValue: field.max_value,
          options: field.options,
          config: field.config
        })),
      visualObject: card.visual_objects ? {
        id: card.visual_objects.id,
        name: card.visual_objects.name,
        title: card.visual_objects.title,
        description: card.visual_objects.description,
        images: (card.visual_objects.visual_object_images || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((img: any) => ({
            id: img.id,
            cloudflareImageId: img.cloudflare_image_id,
            variant: img.image_variant
          }))
      } : null
    }));

    // Return cards with caching headers
    return NextResponse.json(
      {
        success: true,
        cards: transformedCards,
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5 minutes client, 10 minutes CDN
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Widget cards API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cards',
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
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  });
}