import { NextRequest, NextResponse } from 'next/server';
import {
  getVisualAssets,
  createVisualAsset,
} from '@/lib/visual-assets-service';

export async function GET() {
  try {
    const assets = await getVisualAssets();
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching visual assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visual assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      display_name,
      type,
      category,
      url,
      thumbnail_url,
      file_size,
      width,
      height,
      tags,
      used_in,
    } = body;

    if (!name || !display_name || !type || !category || !url || !file_size) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, display_name, type, category, url, file_size',
        },
        { status: 400 }
      );
    }

    const newAsset = await createVisualAsset({
      name,
      display_name,
      type,
      category,
      url,
      thumbnail_url,
      file_size,
      width,
      height,
      tags: tags || [],
      used_in: used_in || [],
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error('Error creating visual asset:', error);
    return NextResponse.json(
      { error: 'Failed to create visual asset' },
      { status: 500 }
    );
  }
}
