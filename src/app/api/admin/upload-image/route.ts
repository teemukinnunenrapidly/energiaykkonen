import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Check admin authentication here if needed
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const formData = await _request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Upload to Cloudflare
    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', file);

    const metadata = {
      uploaded_at: new Date().toISOString(),
      original_name: file.name,
    };
    cloudflareFormData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
        body: cloudflareFormData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Cloudflare upload failed:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const data = await response.json();

    if (!data.success) {
      console.error('Cloudflare error:', data.errors);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Return the image ID and URLs
    return NextResponse.json({
      success: true,
      imageId: data.result.id,
      variants: data.result.variants,
      uploadedAt: data.result.uploaded,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
