import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { widgetBundleRateLimiter } from '@/lib/rate-limiter';
import { createClient } from '@supabase/supabase-js';
import { cardStreamConfig } from '@/config/cardstream-config';

/**
 * Widget Bundle API
 * Palauttaa paketoitun widgetin (JS, CSS, config) WordPress-pluginille
 */

// API-avaimet - tuotannossa käytä vain ympäristömuuttujia
const VALID_API_KEYS = [
  process.env.WIDGET_API_KEY,
  process.env.WIDGET_API_KEY_SECONDARY, // Varavain
  // Fallback VAIN kehitysympäristössä
  ...(process.env.NODE_ENV === 'development'
    ? ['e1-widget-key-2025-secure-token']
    : []),
].filter(Boolean); // Poista tyhjät arvot

// Sallitut domainit CORS:lle
const ALLOWED_ORIGINS = [
  process.env.WORDPRESS_DOMAIN,
  process.env.WORDPRESS_STAGING_DOMAIN,
  // Kehitysympäristössä salli localhost
  ...(process.env.NODE_ENV === 'development'
    ? [
        'http://localhost',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1',
      ]
    : []),
].filter(Boolean);

/**
 * Validoi API-avain
 */
function validateApiKey(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const apiKey = authHeader.substring(7);
  return VALID_API_KEYS.includes(apiKey);
}

/**
 * Luo SHA256 checksum datalle
 */
function generateChecksum(data: any): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
}

/**
 * Fetch card data from Supabase
 */
async function fetchCardData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Fetch card templates with correct table names
    console.log('Fetching from public.card_templates...');
    const { data: cards, error: cardsError } = await supabase
      .from('card_templates')
      .select('id, name, title, type, display_order, visual_object_id, config, is_active')
      .eq('is_active', true)
      .order('display_order');

    if (cardsError) {
      console.error('Card templates query error:', cardsError);
      throw cardsError;
    }

    console.log('Found', cards?.length || 0, 'card templates');

    // Fetch card fields separately using card_id relationship
    let cardFields = [];
    if (cards && cards.length > 0) {
      const cardIds = cards.map(card => card.id);
      console.log('Fetching card fields for card IDs:', cardIds);
      
      const { data: fields, error: fieldsError } = await supabase
        .from('card_fields')
        .select('*')
        .in('card_id', cardIds)
        .order('display_order');
      
      if (fieldsError) {
        console.error('Card fields query error:', fieldsError);
        cardFields = [];
      } else {
        cardFields = fields || [];
        console.log('Found', cardFields.length, 'card fields');
        if (cardFields.length > 0) {
          console.log('Sample field data:', JSON.stringify(cardFields[0], null, 2));
        }
      }
    }

    // Fetch visual objects
    console.log('Fetching visual objects...');
    const { data: visuals, error: visualsError } = await supabase
      .from('visual_objects')
      .select('*')
      .eq('is_active', true);

    if (visualsError) {
      console.error('Visual objects query error:', visualsError);
    } else {
      console.log('Found', visuals?.length || 0, 'visual objects');
    }

    // Fetch visual object images
    let visualImages = [];
    if (visuals && visuals.length > 0) {
      const visualIds = visuals.map(visual => visual.id);
      console.log('Fetching images for visual object IDs:', visualIds);
      
      const { data: images, error: imagesError } = await supabase
        .from('visual_object_images')
        .select('*')
        .in('visual_object_id', visualIds)
        .order('display_order');
      
      if (imagesError) {
        console.error('Visual object images query error:', imagesError);
        visualImages = [];
      } else {
        visualImages = images || [];
        console.log('Found', visualImages.length, 'visual object images');
      }
    }

    console.log('Fetched cards:', cards?.length || 0);
    console.log('Fetched card fields:', cardFields?.length || 0);

    return {
      cards: cards || [],
      visuals: visuals || [],
      cardFields: cardFields || [],
      visualImages: visualImages || [],
    };
  } catch (error) {
    console.error('Error fetching card data from Supabase:', error);
    // Return empty data if fetch fails
    return {
      cards: [],
      visuals: [],
      cardFields: [],
      visualImages: [],
    };
  }
}

/**
 * Rakenna widget bundle
 */
async function buildWidgetBundle() {
  const version = `2.2.0-${Date.now()}`;

  try {
    // Fetch card data from Supabase
    const { cards, visuals, cardFields, visualImages } = await fetchCardData();
    // Lue buildatut tiedostot dist-kansiosta
    const distPath = path.join(process.cwd(), 'dist');

    let widgetJs: string;
    let widgetCss: string;

    // Try to use the built widget bundle first
    try {
      widgetJs = await fs.readFile(
        path.join(distPath, 'e1-calculator-widget.min.js'),
        'utf-8'
      );
      widgetCss = await fs.readFile(
        path.join(distPath, 'e1-calculator-widget.min.css'),
        'utf-8'
      );
      
      console.log('Successfully loaded built widget files:', {
        jsSize: widgetJs.length,
        cssSize: widgetCss.length
      });
    } catch (error) {
      // If built files don't exist, use simple fallback widget
      console.warn('Built widget files not found, using fallback widget:', error instanceof Error ? error.message : String(error));
      // Use simple fallback widget that works better with WordPress
      widgetJs = `
    // E1 Calculator Widget v${version}
    (function() {
      'use strict';
      
      // Widget configuration
      let config = {};
      
      // Initialize widget
      function initE1Widget(elementId, options) {
        const container = document.getElementById(elementId);
        if (!container) {
          console.error('E1 Widget: Container not found:', elementId);
          return;
        }
        
        // Apply configuration
        config = window.E1_WIDGET_CONFIG || {};
        
        // Create calculator form
        container.innerHTML = \`
          <div class="e1-widget-container">
            <div class="e1-widget-header">
              <h2>Lämpöpumpun säästölaskuri</h2>
            </div>
            <form class="e1-widget-form" id="e1-calculator-form">
              <div class="e1-form-group">
                <label for="e1-energy">Vuosittainen energiantarve (kWh)</label>
                <input type="number" id="e1-energy" name="energy" required min="0" max="100000">
              </div>
              <div class="e1-form-group">
                <label for="e1-current-cost">Nykyiset lämmityskustannukset (€/vuosi)</label>
                <input type="number" id="e1-current-cost" name="currentCost" required min="0" max="50000">
              </div>
              <button type="submit" class="e1-submit-btn">Laske säästöt</button>
            </form>
            <div class="e1-results" id="e1-results" style="display:none;">
              <h3>Arvioidut säästöt</h3>
              <div class="e1-result-item">
                <span>Vuosisäästö:</span>
                <span id="e1-annual-savings">-</span>
              </div>
              <div class="e1-result-item">
                <span>5 vuoden säästö:</span>
                <span id="e1-five-year-savings">-</span>
              </div>
            </div>
          </div>
        \`;
        
        // Handle form submission
        const form = document.getElementById('e1-calculator-form');
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          calculateSavings();
        });
      }
      
      // Calculate savings
      function calculateSavings() {
        const energy = parseFloat(document.getElementById('e1-energy').value);
        const currentCost = parseFloat(document.getElementById('e1-current-cost').value);
        
        // Simple calculation (COP 3.8, electricity 0.15€/kWh)
        const heatPumpConsumption = energy / 3.8;
        const heatPumpCost = heatPumpConsumption * 0.15;
        const annualSavings = currentCost - heatPumpCost;
        const fiveYearSavings = annualSavings * 5;
        
        // Display results
        document.getElementById('e1-annual-savings').textContent = Math.round(annualSavings) + ' €';
        document.getElementById('e1-five-year-savings').textContent = Math.round(fiveYearSavings) + ' €';
        document.getElementById('e1-results').style.display = 'block';
      }
      
      // Expose widget API
      window.E1Widget = {
        init: initE1Widget,
        version: '${version}',
        config: config
      };
      
      // Auto-init if container exists (but only if not already initialized by WordPress)
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          if (document.getElementById('e1-calculator-widget') && !window.E1Widget._initialized) {
            initE1Widget('e1-calculator-widget', {});
            window.E1Widget._initialized = true;
          }
        });
      } else {
        // DOM already loaded
        if (document.getElementById('e1-calculator-widget') && !window.E1Widget._initialized) {
          initE1Widget('e1-calculator-widget', {});
          window.E1Widget._initialized = true;
        }
      }
    })();
  `;

      // Fallback CSS
      widgetCss = `
    /* E1 Calculator Widget Styles v${version} */
    .e1-widget-container {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .e1-widget-header h2 {
      color: #1f2937;
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    .e1-form-group {
      margin-bottom: 20px;
    }
    
    .e1-form-group label {
      display: block;
      margin-bottom: 8px;
      color: #4b5563;
      font-size: 14px;
      font-weight: 500;
    }
    
    .e1-form-group input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    
    .e1-form-group input:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    
    .e1-submit-btn {
      width: 100%;
      padding: 12px 20px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .e1-submit-btn:hover {
      background: #059669;
    }
    
    .e1-results {
      margin-top: 30px;
      padding: 20px;
      background: #f0fdf4;
      border-radius: 8px;
      border: 1px solid #86efac;
    }
    
    .e1-results h3 {
      margin: 0 0 15px 0;
      color: #14532d;
      font-size: 18px;
    }
    
    .e1-result-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #d1fae5;
    }
    
    .e1-result-item:last-child {
      border-bottom: none;
    }
    
    .e1-result-item span:last-child {
      font-weight: 600;
      color: #059669;
      font-size: 18px;
    }
  `;
    }

    // Transform card data to widget format with proper field relationships
    const transformedCards = cards.map((card: any, index: number) => ({
      id: card.id,
      name: card.name,
      title: card.title,
      type: card.type,
      visual_object_id: card.visual_object_id,
      config: card.config,
      fields: cardFields
        .filter((field: any) => field.card_id === card.id)
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((field: any) => ({
          id: field.id,
          name: field.field_name,
          type: field.field_type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          min: field.min_value,
          max: field.max_value,
          options: field.options ? (typeof field.options === 'string' ? JSON.parse(field.options) : field.options) : field.options,
        })),
    }));

    // Transform visual objects with proper image relationships
    const transformedVisuals = (visuals || []).map((visual: any) => {
      // Find images for this visual object
      const visualObjectImages = visualImages
        .filter((img: any) => img.visual_object_id === visual.id)
        .sort((a: any, b: any) => a.display_order - b.display_order);

      return {
        id: visual.id,
        name: visual.name,
        title: visual.title,
        description: visual.description,
        content: visual.content,
        images: visualObjectImages.map((img: any) => ({
          id: img.id,
          cloudflareImageId: img.cloudflare_image_id,
          variant: img.image_variant
        })),
        image_url: visualObjectImages[0]?.cloudflare_image_id ? 
          `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${visualObjectImages[0].cloudflare_image_id}/${visualObjectImages[0].image_variant || 'public'}` : 
          null,
      };
    });

    // Configuration with real data from Supabase and design tokens
    const config = {
      // Data object containing all widget data
      data: {
        cards: transformedCards,
        visuals: transformedVisuals,
        visualObjects: transformedVisuals.reduce((acc: any, visual: any) => {
          acc[visual.name] = visual;
          return acc;
        }, {}),
      },
      
      // Also include at root level for backward compatibility
      cards: transformedCards,
      visuals: transformedVisuals,
      
      // CardStream design tokens
      cardStreamConfig: cardStreamConfig,
      
      // Calculation settings
      calculations: {
        cop: 3.8,
        electricityPrice: 0.15,
      },
      
      // Widget metadata
      version,
      generated_at: new Date().toISOString(),
    };

    console.log('Final widget bundle config:', {
      cardsCount: transformedCards.length,
      visualsCount: transformedVisuals.length,
      cardSample: transformedCards[0]?.name || 'none',
      version
    });

    return {
      version,
      widget: {
        js: widgetJs,
        css: widgetCss,
      },
      config,
    };
  } catch (error) {
    console.error('Error building widget bundle:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - käytä IP-osoitetta tai API-avainta tunnisteena
    const clientIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;
    const rateLimitId = apiKey || clientIp;

    // Tarkista rate limit
    if (!widgetBundleRateLimiter.isAllowed(rateLimitId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              widgetBundleRateLimiter.getResetTime(rateLimitId)
            ).toISOString(),
            'Retry-After': '60',
          },
        }
      );
    }

    // Tarkista API-avain

    if (!validateApiKey(authHeader)) {
      // Log failed attempts for security monitoring
      console.warn(
        `[Widget Bundle API] Unauthorized access attempt from ${clientIp}`
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Invalid or missing API key.',
        },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="Widget Bundle API"',
          },
        }
      );
    }

    // Rakenna widget bundle
    const bundle = await buildWidgetBundle();

    // Luo checksum
    const checksum = generateChecksum(bundle);

    // Palauta bundle
    const response = {
      success: true,
      version: bundle.version,
      generated_at: new Date().toISOString(),
      widget: bundle.widget,
      config: bundle.config,
      checksum,
    };

    // Määritä CORS origin
    const origin = request.headers.get('origin');
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '')
      ? origin
      : ALLOWED_ORIGINS[0];

    // Rate limit headers
    const remaining = widgetBundleRateLimiter.getRemaining(rateLimitId);
    const resetTime = widgetBundleRateLimiter.getResetTime(rateLimitId);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin || 'null',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'private, max-age=300', // 5 min cache
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (error) {
    console.error('Widget bundle API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate widget bundle',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '')
    ? origin
    : ALLOWED_ORIGINS[0];

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || 'null',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
