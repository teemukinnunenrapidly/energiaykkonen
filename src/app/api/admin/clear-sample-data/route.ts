import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(_request: NextRequest) {
  try {
    // Delete sample visual objects (those with UUID 00000000-0000-0000-0000-00000000000x)
    const { error: deleteObjectsError } = await supabase
      .from('visual_objects')
      .delete()
      .in('id', [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
      ]);

    if (deleteObjectsError) {
      console.error('Error deleting sample objects:', deleteObjectsError);
      return NextResponse.json(
        { error: 'Failed to delete sample objects' },
        { status: 500 }
      );
    }

    // Delete sample visual object images
    const { error: deleteImagesError } = await supabase
      .from('visual_object_images')
      .delete()
      .in('cloudflare_image_id', [
        'sample-heating-1',
        'sample-heating-2',
        'sample-windows-1',
        'sample-windows-2',
        'sample-house-1',
        'sample-house-2',
        'sample-house-3',
      ]);

    if (deleteImagesError) {
      console.error('Error deleting sample images:', deleteImagesError);
      // Don't return error here as objects were deleted
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing sample data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
