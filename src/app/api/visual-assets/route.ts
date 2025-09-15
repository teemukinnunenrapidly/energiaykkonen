import { NextRequest, NextResponse } from 'next/server';
import {
  getVisualObjects,
  createVisualObject,
} from '@/lib/visual-assets-service';

export async function GET() {
  try {
    const assets = await getVisualObjects();
    return NextResponse.json(assets);
    } catch {
    return NextResponse.json(
      { error: 'Failed to fetch visual assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, display_name } = body;

    if (!name || !display_name) {
      return NextResponse.json(
        {
          error: 'Missing required fields: name, display_name',
        },
        { status: 400 }
      );
    }

    const newAsset = await createVisualObject({
      name,
      title: display_name,
      description: `Visual asset: ${display_name}`,
    });

    return NextResponse.json(newAsset, { status: 201 });
    } catch {
    return NextResponse.json(
      { error: 'Failed to create visual asset' },
      { status: 500 }
    );
  }
}
