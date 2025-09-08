import { NextRequest, NextResponse } from 'next/server';
import { cardStreamConfig } from '@/config/cardstream-config';

/**
 * Public API endpoint for widget configuration
 * Returns design tokens, feature flags, and API endpoints
 */
export async function GET(request: NextRequest) {
  try {
    // Widget configuration including design tokens and settings
    const config = {
      // API endpoints for the widget to use
      endpoints: {
        cards: '/api/widget/cards',
        visualObjects: '/api/widget/visual-objects',
        formulas: '/api/widget/formulas',
        submitLead: '/api/submit-lead'
      },
      
      // Design tokens from cardstream config
      designTokens: cardStreamConfig,
      
      // Feature flags
      features: {
        progressiveImageLoading: true,
        visualSupport: true,
        animations: true,
        blurredCards: false,
        mobileOptimized: true,
        offlineSupport: false
      },
      
      // Cloudflare configuration (public hash only)
      cloudflare: {
        accountHash: process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH || '',
        imageVariants: ['public', 'thumbnail', 'avatar', 'cover']
      },
      
      // Widget metadata
      version: '3.0.0',
      lastUpdated: new Date().toISOString(),
      
      // Localization
      locale: 'fi',
      translations: {
        loading: 'Ladataan...',
        error: 'Virhe ladattaessa tietoja',
        submit: 'Lähetä',
        calculate: 'Laske',
        reset: 'Tyhjennä',
        required: 'Pakollinen tieto',
        nextCard: 'Seuraava',
        previousCard: 'Edellinen'
      },
      
      // Performance settings
      performance: {
        lazyLoadImages: true,
        cacheStrategy: 'network-first',
        prefetchDelay: 1000,
        debounceInputs: 300
      },
      
      // Validation settings
      validation: {
        showInlineErrors: true,
        validateOnBlur: true,
        validateOnChange: false,
        scrollToError: true
      }
    };

    return NextResponse.json(
      {
        success: true,
        config,
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Widget config API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch configuration',
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