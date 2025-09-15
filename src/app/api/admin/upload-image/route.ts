import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Check if Cloudflare credentials are configured
    if (
      !process.env.CLOUDFLARE_ACCOUNT_ID ||
      !process.env.CLOUDFLARE_IMAGES_API_TOKEN
    ) {
      return NextResponse.json(
        {
          error:
            'Cloudflare Images not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_API_TOKEN in environment variables.',
        },
        { status: 500 }
      );
    }

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

    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
      },
      body: cloudflareFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Try to parse the error for better messaging
      let errorMessage = 'Upload failed';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message || errorMessage;
        }
      } catch {
        // If parsing fails, use the generic message
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const data = await response.json();

    if (!data.success) {
      const errorMessage = data.errors?.[0]?.message || 'Upload failed';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Return the image ID and URLs
    return NextResponse.json({
      success: true,
      imageId: data.result.id,
      variants: data.result.variants,
      uploadedAt: data.result.uploaded,
    });
    } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
