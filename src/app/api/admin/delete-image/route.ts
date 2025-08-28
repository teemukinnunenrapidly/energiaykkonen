import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(_request: NextRequest) {
  try {
    // Check admin authentication here if needed
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(_request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudflare
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Cloudflare deletion failed:', error);
      return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }

    const data = await response.json();

    if (!data.success) {
      console.error('Cloudflare error:', data.errors);
      return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
