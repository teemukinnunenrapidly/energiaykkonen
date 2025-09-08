#!/usr/bin/env node

/**
 * Test script to verify theme updates via the widget-config API
 * Run with: node test-theme-update.js
 */

const http = require('http');

console.log('🎨 Testing Theme Update via Widget Config API');
console.log('============================================\n');

// Make request to widget-config API
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/widget-config',
  method: 'GET',
  headers: {
    Accept: 'application/json',
  },
};

const req = http.request(options, res => {
  let data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const config = JSON.parse(data);

      console.log('✅ Successfully fetched widget configuration:\n');
      console.log('Version:', config.version);
      console.log('Last Updated:', config.lastUpdated);
      console.log('\n📊 Current Theme Settings:');
      console.log(
        '  Primary Color:',
        config.styling?.primaryColor || 'Not set'
      );
      console.log(
        '  Background:',
        config.styling?.backgroundColor || 'Not set'
      );
      console.log(
        '  Border Radius:',
        config.styling?.borderRadius || 'Not set'
      );
      console.log('  Font Family:', config.styling?.fontFamily || 'Not set');

      console.log('\n🔧 Embed Settings:');
      console.log(
        '  Default Height:',
        config.embedSettings?.defaultHeight || 'Not set'
      );
      console.log('  Auto Resize:', config.features?.autoResize || false);

      console.log('\n📋 To test the sync in WordPress:');
      console.log('1. Ensure your dev server is running (npm run dev)');
      console.log('2. Open WordPress admin panel');
      console.log('3. Go to Settings > E1 Calculator');
      console.log('4. Click "Test Connection" to verify API is accessible');
      console.log('5. Click "Sync Changes" to pull latest configuration');
      console.log(
        '6. Check the widget on your WordPress site to see updated styles'
      );

      if (config.changelog && config.changelog.length > 0) {
        console.log('\n📝 Latest Changelog:');
        const latest = config.changelog[0];
        console.log(`  Version ${latest.version} (${latest.date})`);
        latest.changes.forEach(change => {
          console.log(`    - ${change}`);
        });
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', error => {
  console.error('❌ Error connecting to API:', error.message);
  console.log('\n💡 Make sure your development server is running:');
  console.log('   npm run dev');
});

req.end();
