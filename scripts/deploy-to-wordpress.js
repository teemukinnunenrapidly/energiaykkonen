#!/usr/bin/env node

/**
 * Deploy widget bundle to WordPress plugin cache directory
 * This script copies the built widget files to the WordPress plugin cache structure
 * and fetches all necessary data from Supabase at build time
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Paths
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PLUGIN_DIR = path.join(__dirname, '..', 'wordpress-plugin', 'e1-calculator-pro');
const CACHE_DIR = path.join(PLUGIN_DIR, 'cache');

// Files to copy
const FILES = {
  'e1-calculator-widget.min.js': 'widget.js',
  'e1-calculator-widget.min.css': 'widget.css'
};

// Supabase configuration
const SUPABASE_URL = 'https://xfqmllsvdxejloecwlaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcW1sbHN2ZHhlamxvZWN3bGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTE1NjAsImV4cCI6MjA3MTYyNzU2MH0.ZE4YOoVjqs4fGQs4gA3CJoQ4nEzfRqK4K2MO_bERGvM';

/**
 * Fetch all data from Supabase at build time
 */
async function fetchDataFromSupabase() {
  console.log('📦 Fetching data from Supabase...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Fetch card templates with fields and visual objects
    const { data: cards, error: cardsError } = await supabase
      .from('card_templates')
      .select(`
        id,
        name,
        title,
        type,
        display_order,
        visual_object_id,
        config,
        reveal_conditions,
        is_active,
        card_fields (
          id,
          field_name,
          field_type,
          label,
          placeholder,
          help_text,
          required,
          validation_rules,
          width,
          options,
          display_order
        )
      `)
      .eq('is_active', true)
      .order('display_order');
    
    if (cardsError) throw cardsError;
    
    // Fetch visual objects with images
    const { data: visualObjects, error: visualError } = await supabase
      .from('visual_objects')
      .select(`
        *,
        visual_object_images (*)
      `)
      .eq('is_active', true);
    
    if (visualError) throw visualError;
    
    // Fetch formulas
    const { data: formulas, error: formulasError } = await supabase
      .from('formulas')
      .select('*')
      .eq('is_active', true);
    
    if (formulasError) throw formulasError;
    
    // Fetch enhanced lookups and their rules
    const { data: enhancedLookups, error: enhancedLookupsError } = await supabase
      .from('enhanced_lookups')
      .select('*')
      .eq('is_active', true);
    
    if (enhancedLookupsError) throw enhancedLookupsError;
    
    // Fetch enhanced lookup rules
    const { data: lookupRules, error: lookupRulesError } = await supabase
      .from('enhanced_lookup_rules')
      .select('*')
      .eq('is_active', true)
      .order('order_index');
    
    if (lookupRulesError) throw lookupRulesError;
    
    // Convert enhanced lookups to widget-compatible format
    const lookupTables = (enhancedLookups || []).map(lookup => {
      const rules = lookupRules.filter(rule => rule.lookup_id === lookup.id);
      
      // For widget compatibility, we need to simplify the rules
      // Convert them to simple condition_field and lookup_values format
      const lookupValues = rules.map(rule => {
        // Extract the condition field from the first condition
        const conditionField = rule.condition_logic?.conditions?.[0]?.field || 'lammitysmuoto';
        const conditionValue = rule.condition_logic?.conditions?.[0]?.value || '';
        
        // Extract the return value from action_config
        let returnValue = '';
        if (rule.action_type === 'formula') {
          returnValue = rule.action_config?.formula_text || '';
        } else if (rule.action_type === 'value') {
          returnValue = rule.action_config?.value || '';
        }
        
        return {
          condition_value: conditionValue,
          return_value: returnValue
        };
      });
      
      return {
        id: lookup.id,
        name: lookup.name,
        title: lookup.title || lookup.name,
        description: lookup.description || '',
        condition_field: rules[0]?.condition_logic?.conditions?.[0]?.field || 'lammitysmuoto',
        lookup_values: lookupValues
      };
    });
    
    // Fetch themes
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true);
    
    if (themesError) throw themesError;
    
    // Create a map of visual objects for easy lookup
    const visualObjectsMap = {};
    visualObjects.forEach(obj => {
      visualObjectsMap[obj.id] = {
        ...obj,
        images: (obj.visual_object_images || []).sort((a, b) => a.display_order - b.display_order)
      };
    });
    
    // Process cards to include visual objects
    const processedCards = cards.map(card => {
      const cardData = {
        ...card,
        card_fields: (card.card_fields || []).sort((a, b) => a.display_order - b.display_order),
        visual_objects: card.visual_object_id ? visualObjectsMap[card.visual_object_id] : null
      };
      return cardData;
    });
    
    console.log(`✅ Fetched ${processedCards.length} cards, ${visualObjects.length} visual objects, ${formulas.length} formulas, ${lookupTables?.length || 0} lookup tables`);
    
    return {
      cards: processedCards,
      visualObjects: visualObjectsMap,
      formulas,
      lookupTables: lookupTables || [],
      themes: themes[0] || null // Use first active theme
    };
  } catch (error) {
    console.error('❌ Error fetching data from Supabase:', error);
    throw error;
  }
}

// Main deployment function
async function deploy() {
  try {
    // Ensure cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log('✅ Created cache directory:', CACHE_DIR);
    }

    // Copy files
    Object.entries(FILES).forEach(([source, target]) => {
      const sourcePath = path.join(DIST_DIR, source);
      const targetPath = path.join(CACHE_DIR, target);
      
      if (!fs.existsSync(sourcePath)) {
        console.error(`❌ Source file not found: ${sourcePath}`);
        console.log('   Run "npm run build:widget" first');
        process.exit(1);
      }
      
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied ${source} → ${target}`);
    });

    // Fetch all data from Supabase
    const supabaseData = await fetchDataFromSupabase();

    // Create config.json with widget configuration AND data
    const configPath = path.join(CACHE_DIR, 'config.json');
    const config = {
      version: '2.0.0',
      name: 'E1Calculator',
      cloudflareAccountHash: 'AkEHl6uYQM8NNRufIXHzFw',
      features: {
        visualSupport: true,
        blurredCards: false,
        animations: true,
        progressiveImageLoading: true,
        offlineMode: true // New: Widget works completely offline!
      },
      // All data is now included in the config
      data: {
        cards: supabaseData.cards,
        visualObjects: supabaseData.visualObjects,
        formulas: supabaseData.formulas,
        lookupTables: supabaseData.lookupTables,
        theme: supabaseData.themes
      },
      // Visual asset configuration
      visualAssets: {
        defaultVariant: 'public',
        variants: ['public', 'thumbnail', 'avatar', 'cover']
      },
      // Build metadata
      buildTime: new Date().toISOString(),
      dataFetchedAt: new Date().toISOString()
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Created config.json with synced data');

    // Create metadata.json for version tracking
    const metadataPath = path.join(CACHE_DIR, 'metadata.json');
    const metadata = {
      version: '2.0.0',
      buildTime: new Date().toISOString(),
      files: Object.values(FILES),
      bundleSize: {
        js: fs.statSync(path.join(DIST_DIR, 'e1-calculator-widget.min.js')).size,
        css: fs.statSync(path.join(DIST_DIR, 'e1-calculator-widget.min.css')).size,
        config: Buffer.byteLength(JSON.stringify(config), 'utf8')
      },
      dataStats: {
        cards: supabaseData.cards.length,
        visualObjects: Object.keys(supabaseData.visualObjects).length,
        formulas: supabaseData.formulas.length,
        lookupTables: supabaseData.lookupTables.length
      }
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log('✅ Created metadata.json');

    // Create .htaccess for Apache servers
    const htaccessPath = path.join(CACHE_DIR, '.htaccess');
    const htaccessContent = `# E1 Calculator Widget Cache
# Allow access to widget files

<FilesMatch "\\.(js|css|json)$">
  <IfModule mod_authz_core.c>
    Require all granted
  </IfModule>
  <IfModule !mod_authz_core.c>
    Order Allow,Deny
    Allow from all
  </IfModule>
</FilesMatch>

# Set proper MIME types
AddType application/javascript .js
AddType text/css .css
AddType application/json .json

# Enable caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType application/javascript "access plus 1 week"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/json "access plus 1 hour"
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/json
</IfModule>
`;

    fs.writeFileSync(htaccessPath, htaccessContent);
    console.log('✅ Created .htaccess');

    console.log('\n✨ Widget deployed successfully to WordPress plugin!');
    console.log(`📁 Cache directory: ${CACHE_DIR}`);
    console.log('📊 Data synced:');
    console.log(`   - ${supabaseData.cards.length} cards`);
    console.log(`   - ${Object.keys(supabaseData.visualObjects).length} visual objects`);
    console.log(`   - ${supabaseData.formulas.length} formulas`);
    console.log('\n🔌 Widget now works completely offline!');
    console.log('\nNext steps:');
    console.log('1. Upload the plugin to WordPress');
    console.log('2. Use shortcode: [e1_calculator]');
    console.log('3. Or with options: [e1_calculator theme="dark" height="600"]');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deploy();