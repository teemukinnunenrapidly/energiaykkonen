import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * API endpoint to provide widget/embed configuration
 * Used by WordPress plugin to sync settings and check for updates
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    
    // Allow CORS for widget requests
    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    };

    // Configuration object that WordPress plugin can sync
    const config = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      calculator: {
        name: 'E1 Calculator - Energiaykkönen',
        description: 'Heat pump savings calculator',
        language: 'fi',
        supportedLanguages: ['fi'],
      },
      features: {
        autoResize: true,
        pdfGeneration: true,
        emailNotifications: true,
        mobileResponsive: true,
        darkMode: false, // Future feature
      },
      embedSettings: {
        minHeight: 400,
        maxHeight: 5000,
        defaultHeight: 600,
        resizeDebounce: 100,
        messageTypes: {
          resize: 'calculator-resize',
          loaded: 'calculator-loaded',
          submitted: 'calculator-submitted',
          error: 'calculator-error',
        },
      },
      styling: {
        primaryColor: '#10b981',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      api: {
        submitEndpoint: '/api/submit-lead',
        configEndpoint: '/api/widget-config',
        healthEndpoint: '/api/health',
      },
      tracking: {
        googleAnalytics: false,
        customEvents: true,
      },
      performance: {
        lazyLoading: true,
        cacheStrategy: 'network-first',
      },
      compatibility: {
        minWordPressVersion: '5.0',
        minPHPVersion: '7.2',
        browsers: {
          chrome: '90+',
          firefox: '88+',
          safari: '14+',
          edge: '90+',
        },
      },
      changelog: [
        {
          version: '1.0.0',
          date: '2025-01-08',
          changes: [
            'Initial release',
            'WordPress plugin support',
            'Auto-resize functionality',
            'PDF generation',
          ],
        },
      ],
      support: {
        email: 'support@energiaykkonen.fi',
        documentation: 'https://energiaykkonen.fi/docs',
      },
    };

    return NextResponse.json(config, { 
      status: 200,
      headers: responseHeaders 
    });

  } catch (error) {
    console.error('Widget config API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch configuration',
        status: 'error' 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}