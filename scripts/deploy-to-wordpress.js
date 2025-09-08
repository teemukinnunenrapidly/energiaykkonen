#!/usr/bin/env node

/**
 * Deploy widget bundle to WordPress plugin cache directory
 * This script copies the built widget files to the WordPress plugin cache structure
 */

const fs = require('fs');
const path = require('path');

// Paths
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PLUGIN_DIR = path.join(__dirname, '..', 'wordpress-plugin', 'e1-calculator-pro');
const CACHE_DIR = path.join(PLUGIN_DIR, 'cache');

// Files to copy
const FILES = {
  'e1-calculator-widget.min.js': 'widget.js',
  'e1-calculator-widget.min.css': 'widget.css'
};

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

// Create config.json with widget configuration
const configPath = path.join(CACHE_DIR, 'config.json');
const config = {
  version: '1.0.0',
  name: 'E1Calculator',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  features: {
    visualSupport: true,
    blurredCards: false,
    animations: true
  }
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ Created config.json');

// Create metadata.json for version tracking
const metadataPath = path.join(CACHE_DIR, 'metadata.json');
const metadata = {
  version: '1.0.0',
  buildTime: new Date().toISOString(),
  files: Object.values(FILES),
  bundleSize: {
    js: fs.statSync(path.join(DIST_DIR, 'e1-calculator-widget.min.js')).size,
    css: fs.statSync(path.join(DIST_DIR, 'e1-calculator-widget.min.css')).size
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
console.log('\nNext steps:');
console.log('1. Upload the plugin to WordPress');
console.log('2. Use shortcode: [e1_calculator]');
console.log('3. Or with options: [e1_calculator theme="dark" height="600"]');