import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint helps debug if Cloudflare environment variables are properly set

  const config = {
    hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
    hasApiToken: !!process.env.CLOUDFLARE_IMAGES_API_TOKEN,
    hasPublicHash: !!process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH,
    accountIdLength: process.env.CLOUDFLARE_ACCOUNT_ID?.length || 0,
    apiTokenLength: process.env.CLOUDFLARE_IMAGES_API_TOKEN?.length || 0,
    publicHashLength:
      process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  };

  // Test if we can make a simple API call to Cloudflare
  let cloudflareTestResult = 'Not tested';

  if (config.hasAccountId && config.hasApiToken) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/stats`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
          },
        }
      );

      if (response.ok) {
        cloudflareTestResult = 'API connection successful';
      } else {
        const errorText = await response.text();
        let errorMessage = `API returned ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = errorData.errors[0].message;
          }
        } catch {
          // Use default error message
        }
        cloudflareTestResult = `API error: ${errorMessage}`;
      }
    } catch {
      cloudflareTestResult = `Connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  } else {
    cloudflareTestResult = 'Cannot test - missing credentials';
  }

  return NextResponse.json({
    configured:
      config.hasAccountId && config.hasApiToken && config.hasPublicHash,
    config,
    cloudflareTest: cloudflareTestResult,
    message:
      config.hasAccountId && config.hasApiToken && config.hasPublicHash
        ? 'All Cloudflare environment variables are configured'
        : 'Missing Cloudflare environment variables',
  });
}
