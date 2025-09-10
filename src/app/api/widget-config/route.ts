import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import fs from 'fs/promises';
import path from 'path';

/**
 * Widget Config API Endpoint
 * Fetches dynamic data from Supabase for WordPress plugin synchronization
 * Implements comprehensive configuration with cards, visuals, formulas, and settings
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const origin = headersList.get('origin');
    const userAgent = headersList.get('user-agent') || '';

    console.log('🔧 Widget Config API: Processing request', {
      origin,
      userAgent: userAgent.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    // CORS headers - requirement #5
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'false',
    };

    // Cache control headers - requirement #6
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=1800, s-maxage=3600', // 30min browser, 1hr CDN
      'ETag': `"widget-config-${Date.now()}"`,
      'Last-Modified': new Date().toUTCString(),
    };

    // Combined response headers
    const responseHeaders = {
      ...corsHeaders,
      ...cacheHeaders,
      'Content-Type': 'application/json',
      'X-API-Version': '2.0.0',
    };

    // Parallel data fetching for performance
    const [cardsResult, visualsResult, formulasResult, widgetFilesResult] = await Promise.allSettled([
      fetchCardData(),
      fetchVisualData(), 
      fetchFormulaData(),
      fetchWidgetFiles()
    ]);

    console.log('📊 Data fetch results:', {
      cards: cardsResult.status === 'fulfilled' ? `${cardsResult.value.length} cards` : 'failed',
      visuals: visualsResult.status === 'fulfilled' ? `${visualsResult.value.length} visuals` : 'failed',
      formulas: formulasResult.status === 'fulfilled' ? `${formulasResult.value.length} formulas` : 'failed',
      widgetFiles: widgetFilesResult.status === 'fulfilled' ? 'loaded' : 'failed'
    });

    // Handle partial failures gracefully - requirement #7
    const cards = cardsResult.status === 'fulfilled' ? cardsResult.value : [];
    const visuals = visualsResult.status === 'fulfilled' ? visualsResult.value : [];
    const formulas = formulasResult.status === 'fulfilled' ? formulasResult.value : [];
    const widgetFiles = widgetFilesResult.status === 'fulfilled' ? widgetFilesResult.value : { js: '', css: '' };

    // Get base URL for API endpoints - requirement #4
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://energiaykkonen-calculator.vercel.app';

    // Consolidated configuration object - requirement #8
    const config = {
      // Version management - requirement #9
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
      buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),

      // Widget files for WordPress plugin caching
      widget: {
        js: widgetFiles.js,
        css: widgetFiles.css
      },
      
      // Calculator metadata
      calculator: {
        name: 'E1 Calculator - Energiaykkönen',
        description: 'Heat pump savings calculator with dynamic form cards',
        language: 'fi',
        supportedLanguages: ['fi'],
        cardCount: cards.length,
        visualCount: visuals.length,
        formulaCount: formulas.length,
      },

      // API endpoints - requirement #4
      api: {
        baseUrl,
        submitEndpoint: `${baseUrl}/api/submit-lead`,
        configEndpoint: `${baseUrl}/api/widget-config`,
        healthEndpoint: `${baseUrl}/api/health`,
        formulasEndpoint: `${baseUrl}/api/formulas`,
        visualAssetsEndpoint: `${baseUrl}/api/visual-assets`,
        adminEndpoint: `${baseUrl}/api/admin`,
      },

      // Data object containing all widget data (WordPress plugin compatibility)
      data: {
        cards: cards.map(card => ({
        id: card.id,
        name: card.name,
        title: card.title,
        type: card.type,
        display_order: card.display_order,
        config: card.config || {},
        styling: card.styling || {},
        completion_rules: card.completion_rules || {},
        reveal_timing: card.reveal_timing || {},
        visual_object_id: card.visual_object_id,
        is_active: card.is_active,
        fields: (card.card_fields || []).map((field: any) => ({
          id: field.id,
          field_name: field.field_name,
          field_type: field.field_type,
          label: field.label,
          placeholder: field.placeholder,
          help_text: field.help_text,
          validation_rules: field.validation_rules || {},
          width: field.width,
          display_order: field.display_order,
          options: field.options || [],
          required: field.required,
        })),
        visual_object: card.visual_objects ? {
          id: card.visual_objects.id,
          title: card.visual_objects.title,
          description: card.visual_objects.description,
          type: card.visual_objects.type,
          content_data: card.visual_objects.content_data || {},
        } : null,
      })),

        // Visual objects from Supabase - requirement #2
        visuals: visuals.map(visual => ({
        id: visual.id,
        title: visual.title,
        description: visual.description,
        type: visual.type,
        content_data: visual.content_data || {},
        display_config: visual.display_config || {},
        is_active: visual.is_active,
        created_at: visual.created_at,
        images: (visual.visual_object_images || []).map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          alt_text: img.alt_text,
          display_order: img.display_order,
          image_variant: img.image_variant,
        })),
      })),

        // Formulas from Supabase - requirement #3
        formulas: formulas.map(formula => ({
        id: formula.id,
        name: formula.name,
        description: formula.description,
        formula_code: formula.formula_code,
        input_parameters: formula.input_parameters || {},
        output_format: formula.output_format || {},
        category: formula.category || 'general',
        is_active: formula.is_active,
        created_at: formula.created_at,
        })),
        
        // WordPress plugin compatibility - alias visuals as visualObjects
        visualObjects: visuals.map(visual => ({
        id: visual.id,
        title: visual.title,
        description: visual.description,
        type: visual.type,
        content_data: visual.content_data || {},
        display_config: visual.display_config || {},
        is_active: visual.is_active,
        created_at: visual.created_at,
        images: (visual.visual_object_images || []).map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          alt_text: img.alt_text,
          display_order: img.display_order,
          image_variant: img.image_variant,
        })),
      })),
      },

      // Also include at root level for backward compatibility  
      cards: cards.map(card => ({
        id: card.id,
        name: card.name,
        title: card.title,
        type: card.type,
        display_order: card.display_order,
        config: card.config || {},
        styling: card.styling || {},
        completion_rules: card.completion_rules || {},
        reveal_timing: card.reveal_timing || {},
        visual_object_id: card.visual_object_id,
        is_active: card.is_active,
        fields: (card.card_fields || []).map((field: any) => ({
          id: field.id,
          field_name: field.field_name,
          field_type: field.field_type,
          label: field.label,
          placeholder: field.placeholder,
          help_text: field.help_text,
          validation_rules: field.validation_rules || {},
          width: field.width,
          display_order: field.display_order,
          options: field.options || [],
          required: field.required,
        })),
        visual_object: card.visual_objects ? {
          id: card.visual_objects.id,
          title: card.visual_objects.title,
          description: card.visual_objects.description,
          type: card.visual_objects.type,
          content_data: card.visual_objects.content_data || {},
        } : null,
      })),

      visuals: visuals.map(visual => ({
        id: visual.id,
        title: visual.title,
        description: visual.description,
        type: visual.type,
        content_data: visual.content_data || {},
        display_config: visual.display_config || {},
        is_active: visual.is_active,
        created_at: visual.created_at,
        images: (visual.visual_object_images || []).map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          alt_text: img.alt_text,
          display_order: img.display_order,
          image_variant: img.image_variant,
        })),
      })),

      formulas: formulas.map(formula => ({
        id: formula.id,
        name: formula.name,
        description: formula.description,
        formula_code: formula.formula_code,
        input_parameters: formula.input_parameters || {},
        output_format: formula.output_format || {},
        category: formula.category || 'general',
        is_active: formula.is_active,
        created_at: formula.created_at,
      })),

      // Widget features and settings
      features: {
        autoResize: true,
        pdfGeneration: true,
        emailNotifications: true,
        mobileResponsive: true,
        darkMode: false,
        progressTracking: true,
        cardStreamSystem: true,
        visualSupport: true,
        dynamicCalculations: true,
      },

      // Embed configuration
      embedSettings: {
        minHeight: 400,
        maxHeight: 8000,
        defaultHeight: 700,
        resizeDebounce: 150,
        shadowDomEnabled: true,
        fallbackMode: 'namespace',
        messageTypes: {
          resize: 'e1-calculator-resize',
          loaded: 'e1-calculator-loaded',
          submitted: 'e1-calculator-submitted',
          error: 'e1-calculator-error',
          cardChange: 'e1-calculator-card-change',
        },
      },

      // Theme and styling
      styling: {
        primaryColor: '#10b981',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        cardGap: '24px',
        cardPadding: '32px',
        maxWidth: '800px',
      },

      // Performance settings
      performance: {
        lazyLoading: true,
        cacheStrategy: 'network-first',
        imageOptimization: true,
        bundleSize: 'optimized',
        cdnEnabled: true,
      },

      // WordPress integration
      wordpress: {
        minVersion: '5.0',
        compatibility: 'tested-6.4',
        pluginVersion: '2.0.0',
        requiresAuth: false,
        syncInterval: '1800', // 30 minutes
      },

      // Browser compatibility
      compatibility: {
        browsers: {
          chrome: '90+',
          firefox: '88+',
          safari: '14+',
          edge: '90+',
        },
        features: {
          shadowDOM: true,
          customElements: true,
          es6Modules: true,
          webComponents: true,
        },
      },

      // Security configuration
      security: {
        corsEnabled: true,
        csrfProtection: false, // Widget doesn't need CSRF
        inputSanitization: true,
        rateLimiting: false, // No rate limiting for config
      },

      // Changelog and versioning - requirement #9
      changelog: [
        {
          version: '2.0.0',
          date: '2025-01-10',
          changes: [
            'Dynamic data loading from Supabase',
            'Enhanced card stream system',
            'Visual objects integration',
            'Formula calculation engine',
            'Improved WordPress sync',
            'Better error handling and caching',
          ],
        },
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

      // Support information
      support: {
        email: 'support@energiaykkonen.fi',
        documentation: 'https://energiaykkonen.fi/docs',
        github: 'https://github.com/energiaykkonen/calculator',
        status: 'https://status.energiaykkonen.fi',
      },

      // Data freshness indicators
      dataStatus: {
        cardsLastFetch: new Date().toISOString(),
        visualsLastFetch: new Date().toISOString(),
        formulasLastFetch: new Date().toISOString(),
        errors: [
          ...(cardsResult.status === 'rejected' ? [`Cards: ${cardsResult.reason}`] : []),
          ...(visualsResult.status === 'rejected' ? [`Visuals: ${visualsResult.reason}`] : []),
          ...(formulasResult.status === 'rejected' ? [`Formulas: ${formulasResult.reason}`] : []),
        ],
      },
    };

    console.log('✅ Widget Config API: Configuration built successfully', {
      cards: config.cards.length,
      visuals: config.visuals.length, 
      formulas: config.formulas.length,
      version: config.version,
      errors: config.dataStatus.errors.length
    });

    return NextResponse.json(config, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('❌ Widget Config API: Fatal error:', error);

    // Error response with CORS headers - requirement #7
    return NextResponse.json(
      {
        error: 'Failed to fetch widget configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle OPTIONS request for CORS preflight - requirement #10
export async function OPTIONS(request: NextRequest) {
  console.log('🔧 Widget Config API: CORS preflight request');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS', 
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// Helper functions for data fetching

async function fetchCardData() {
  console.log('📊 Fetching card data from Supabase...');
  
  const { data, error } = await supabase
    .from('card_templates')
    .select(`
      *,
      card_fields(*),
      visual_objects(*)
    `)
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('❌ Error fetching cards:', error);
    throw new Error(`Card data fetch failed: ${error.message}`);
  }

  console.log(`✅ Fetched ${data?.length || 0} active cards`);
  return data || [];
}

async function fetchVisualData() {
  console.log('🖼️ Fetching visual objects from Supabase...');
  
  const { data, error } = await supabase
    .from('visual_objects')
    .select(`
      *,
      visual_object_images(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching visuals:', error);
    throw new Error(`Visual data fetch failed: ${error.message}`);
  }

  console.log(`✅ Fetched ${data?.length || 0} active visual objects`);
  return data || [];
}

async function fetchFormulaData() {
  console.log('🧮 Fetching formulas from Supabase...');
  
  const { data, error } = await supabase
    .from('formulas')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching formulas:', error);
    throw new Error(`Formula data fetch failed: ${error.message}`);
  }

  console.log(`✅ Fetched ${data?.length || 0} active formulas`);
  return data || [];
}

async function fetchWidgetFiles() {
  console.log('📂 Fetching widget files from dist directory...');
  
  try {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Read JavaScript file
    const jsContent = await fs.readFile(
      path.join(distPath, 'e1-calculator-widget.min.js'),
      'utf-8'
    );
    
    // Read CSS file  
    const cssContent = await fs.readFile(
      path.join(distPath, 'e1-calculator-widget.min.css'),
      'utf-8'
    );

    console.log(`✅ Loaded widget files: JS (${jsContent.length} chars), CSS (${cssContent.length} chars)`);
    
    return {
      js: jsContent,
      css: cssContent
    };
    
  } catch (error) {
    console.error('❌ Error loading widget files:', error);
    
    // Return fallback empty widget
    return {
      js: '// Widget files not available',
      css: '/* Widget styles not available */'
    };
  }
}
