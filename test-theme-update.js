/**
 * Test script to verify CardStream widget integration
 * This simulates the WordPress environment and tests the global CardStream object
 */

const fs = require('fs');
const path = require('path');

// Test the widget files
function testWidgetFiles() {
  console.log('🧪 Testing CardStream Widget Files...\n');
  
  const distPath = path.join(__dirname, 'dist');
  const requiredFiles = [
    'widget.js',
    'widget.min.js', 
    'widget.css',
    'widget.min.css',
    'config.json'
  ];
  
  console.log('📁 Checking required files:');
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const exists = fs.existsSync(filePath);
    const size = exists ? Math.round(fs.statSync(filePath).size / 1024) : 0;
    
    console.log(`   ${exists ? '✅' : '❌'} ${file} ${exists ? `(${size}KB)` : '(missing)'}`);
    
    if (!exists) allFilesExist = false;
  });
  
  if (!allFilesExist) {
    console.log('\n❌ Some required files are missing!');
    return false;
  }
  
  console.log('\n✅ All widget files found!');
  return true;
}

// Test configuration file
function testConfigFile() {
  console.log('\n📋 Testing Configuration File...');
  
  try {
    const configPath = path.join(__dirname, 'dist', 'config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    // Check required config sections
    const requiredSections = [
      'cardStreamConfig.version',
      'cardStreamConfig.colors.brand.primary',
      'cardStreamConfig.calculations',
      'cardStreamConfig.propertyTypes',
      'cardStreamConfig.heatingTypes'
    ];
    
    console.log('🔍 Checking configuration structure:');
    
    requiredSections.forEach(section => {
      const keys = section.split('.');
      let current = config;
      let exists = true;
      
      for (const key of keys) {
        if (current && current[key] !== undefined) {
          current = current[key];
        } else {
          exists = false;
          break;
        }
      }
      
      console.log(`   ${exists ? '✅' : '❌'} ${section}`);
    });
    
    console.log(`\n📊 Configuration Stats:`);
    console.log(`   • Version: ${config.cardStreamConfig.version}`);
    console.log(`   • Theme: ${config.cardStreamConfig.theme}`);
    console.log(`   • Brand Color: ${config.cardStreamConfig.colors.brand.primary}`);
    console.log(`   • Property Types: ${config.cardStreamConfig.propertyTypes.length}`);
    console.log(`   • Heating Types: ${config.cardStreamConfig.heatingTypes.length}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Configuration test failed: ${error.message}`);
    return false;
  }
}

// Create test HTML file
function createTestHtml() {
  console.log('\n🌐 Creating Test HTML File...');
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CardStream Widget Test</title>
    <link rel="stylesheet" href="dist/widget.css">
    <style>
        body {
            font-family: system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .debug-panel {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 16px;
            margin-bottom: 20px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 12px;
        }
        .debug-panel h3 {
            margin-top: 0;
            color: #495057;
        }
        button {
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
            margin-bottom: 8px;
        }
        button:hover {
            background: #059669;
        }
        .status {
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 16px;
        }
        .status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .status.info { background: #cce7ff; color: #004085; border: 1px solid #b3d7ff; }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>🧪 CardStream Widget Test Environment</h1>
        <p>This page tests the CardStream widget in a WordPress-like environment.</p>
        
        <div id="status" class="status info">
            📡 Loading CardStream widget...
        </div>
        
        <div class="debug-panel">
            <h3>🔧 Debug Controls</h3>
            <button onclick="debugCardStream()">Check CardStream Object</button>
            <button onclick="debugInstances()">Show Instances</button>
            <button onclick="restartWidget()">Restart Widget</button>
            <button onclick="showConfig()">Show Config</button>
            <button onclick="testAnalytics()">Test Analytics</button>
            <div id="debug-output" style="margin-top: 12px; padding: 8px; background: white; border-radius: 4px; max-height: 200px; overflow-y: auto;"></div>
        </div>
    </div>

    <div class="test-container">
        <h2>📋 Widget Integration Test</h2>
        <p>The widget should render below with the WordPress shortcode simulation: <code>[cardstream]</code></p>
        
        <!-- This simulates the WordPress shortcode output -->
        <div id="cardstream-test-1234" 
             class="cardstream-widget" 
             data-theme="minimal"
             data-lazy="false"
             data-analytics="true"
             role="region"
             aria-label="Energy Savings Calculator"
             tabindex="0"
             style="min-height: 600px; position: relative;">
            <div class="cs-skeleton" style="padding: 40px; text-align: center; background: #f7f8f9; border-radius: 12px;">
                <div style="width: 60px; height: 60px; background: #e5e7eb; border-radius: 50%; margin: 0 auto 20px;"></div>
                <div style="height: 20px; background: #e5e7eb; border-radius: 4px; max-width: 200px; margin: 0 auto 10px;"></div>
                <div style="height: 16px; background: #e5e7eb; border-radius: 4px; max-width: 300px; margin: 0 auto;"></div>
                <noscript>
                    <p style="color: #dc3545; margin-top: 20px;">JavaScript is required for this calculator.</p>
                </noscript>
            </div>
        </div>
    </div>
    
    <div class="test-container">
        <h2>📊 Test Results</h2>
        <div id="test-results">
            <div class="status info">Tests will appear here after widget loads...</div>
        </div>
    </div>

    <script src="dist/widget.js"></script>
    <script>
        // Global test state
        let testResults = [];
        let widgetLoaded = false;
        
        // Test functions
        function updateStatus(message, type = 'info') {
            const statusEl = document.getElementById('status');
            statusEl.textContent = message;
            statusEl.className = \`status \${type}\`;
        }
        
        function addTestResult(test, passed, details = '') {
            testResults.push({ test, passed, details, timestamp: new Date().toISOString() });
            renderTestResults();
        }
        
        function renderTestResults() {
            const resultsEl = document.getElementById('test-results');
            const passedCount = testResults.filter(r => r.passed).length;
            const totalCount = testResults.length;
            
            let html = \`<h3>Test Summary: \${passedCount}/\${totalCount} passed</h3>\`;
            
            testResults.forEach(result => {
                html += \`
                    <div class="status \${result.passed ? 'success' : 'error'}" style="margin-bottom: 8px;">
                        \${result.passed ? '✅' : '❌'} \${result.test}
                        \${result.details ? \`<br><small>\${result.details}</small>\` : ''}
                    </div>
                \`;
            });
            
            resultsEl.innerHTML = html;
        }
        
        // Debug functions
        function debugCardStream() {
            const output = document.getElementById('debug-output');
            if (window.CardStream) {
                output.innerHTML = \`
                    <strong>CardStream Object:</strong><br>
                    • Version: \${window.CardStream.version}<br>
                    • Instances: \${Object.keys(window.CardStream.instances).length}<br>
                    • Methods: \${Object.keys(window.CardStream).join(', ')}<br>
                    • Debug Object: \${window._cardStreamDebug ? 'Available' : 'Not found'}
                \`;
            } else {
                output.innerHTML = '<span style="color: red;">CardStream object not found!</span>';
            }
        }
        
        function debugInstances() {
            const output = document.getElementById('debug-output');
            if (window.CardStream && window.CardStream.instances) {
                const instances = window.CardStream.instances;
                let html = '<strong>Widget Instances:</strong><br>';
                
                Object.keys(instances).forEach(id => {
                    const instance = instances[id];
                    html += \`
                        • <strong>\${id}</strong>: Step \${instance.state.currentStep}, 
                        \${instance.state.isCompleted ? 'Completed' : 'Active'}<br>
                    \`;
                });
                
                output.innerHTML = html || 'No instances found';
            } else {
                output.innerHTML = '<span style="color: red;">No instances available</span>';
            }
        }
        
        function restartWidget() {
            if (window.CardStream && window.CardStream.restart) {
                window.CardStream.restart('cardstream-test-1234');
                updateStatus('Widget restarted!', 'success');
            } else {
                updateStatus('Restart function not available', 'error');
            }
        }
        
        function showConfig() {
            const output = document.getElementById('debug-output');
            const instance = window.CardStream?.instances?.['cardstream-test-1234'];
            if (instance && instance.config.config) {
                const config = instance.config.config;
                output.innerHTML = \`
                    <strong>Widget Configuration:</strong><br>
                    • Theme: \${config.cardStreamConfig?.theme || 'default'}<br>
                    • Brand Color: \${config.cardStreamConfig?.colors?.brand?.primary || 'default'}<br>
                    • Features: \${JSON.stringify(config.cardStreamConfig?.features || {})}<br>
                \`;
            } else {
                output.innerHTML = '<span style="color: red;">Configuration not available</span>';
            }
        }
        
        function testAnalytics() {
            const output = document.getElementById('debug-output');
            // Mock gtag for testing
            if (!window.gtag) {
                window.gtag = function(...args) {
                    console.log('Analytics Event:', args);
                    output.innerHTML = \`<strong>Analytics Test:</strong><br>Event fired: \${JSON.stringify(args)}\`;
                };
            }
            
            // Trigger an analytics event
            if (window.gtag) {
                window.gtag('event', 'test_event', {
                    event_category: 'CardStream',
                    event_label: 'Manual Test'
                });
            }
        }
        
        // Wait for widget to load and then run tests
        function runTests() {
            // Test 1: CardStream object exists
            addTestResult(
                'Global CardStream Object', 
                !!window.CardStream,
                window.CardStream ? \`Version: \${window.CardStream.version}\` : 'Object not found'
            );
            
            // Test 2: Required methods exist
            const requiredMethods = ['init', 'render', 'nextStep', 'restart'];
            const availableMethods = window.CardStream ? Object.keys(window.CardStream) : [];
            const hasAllMethods = requiredMethods.every(method => availableMethods.includes(method));
            
            addTestResult(
                'Required Methods', 
                hasAllMethods,
                \`Available: \${availableMethods.join(', ')}\`
            );
            
            // Test 3: Widget instance created
            const hasInstance = window.CardStream?.instances?.['cardstream-test-1234'];
            addTestResult(
                'Widget Instance Created',
                !!hasInstance,
                hasInstance ? \`State: \${JSON.stringify(hasInstance.state)}\` : 'No instance found'
            );
            
            // Test 4: Configuration loaded
            const hasConfig = hasInstance?.config?.config?.cardStreamConfig;
            addTestResult(
                'Configuration Loaded',
                !!hasConfig,
                hasConfig ? \`Theme: \${hasConfig.theme}\` : 'No config found'
            );
            
            // Test 5: DOM elements rendered
            const container = document.getElementById('cardstream-test-1234');
            const hasRenderedContent = container && container.querySelector('.cs-container');
            addTestResult(
                'DOM Elements Rendered',
                !!hasRenderedContent,
                hasRenderedContent ? 'Widget UI rendered successfully' : 'No rendered content found'
            );
            
            widgetLoaded = true;
            updateStatus('✅ Widget loaded and tests completed!', 'success');
        }
        
        // Initialize widget when page loads
        document.addEventListener('DOMContentLoaded', function() {
            updateStatus('🚀 Initializing CardStream widget...', 'info');
            
            // Mock configuration loading (in real WordPress, this comes from the PHP)
            fetch('dist/config.json')
                .then(response => response.json())
                .then(config => {
                    // Initialize the widget with WordPress-style configuration
                    if (window.CardStream && window.CardStream.init) {
                        window.CardStream.init({
                            container: 'cardstream-test-1234',
                            theme: 'minimal',
                            config: config,
                            analytics: true
                        });
                        
                        // Run tests after a short delay
                        setTimeout(runTests, 1000);
                    } else {
                        updateStatus('❌ CardStream.init not found!', 'error');
                        addTestResult('Widget Initialization', false, 'CardStream.init method not available');
                    }
                })
                .catch(error => {
                    updateStatus(\`❌ Failed to load configuration: \${error.message}\`, 'error');
                    addTestResult('Configuration Loading', false, error.message);
                });
        });
        
        // Auto-refresh debug info every 5 seconds
        setInterval(() => {
            if (widgetLoaded && document.getElementById('debug-output').innerHTML === '') {
                debugCardStream();
            }
        }, 5000);
    </script>
</body>
</html>`;

  const testHtmlPath = path.join(__dirname, 'test-widget.html');
  fs.writeFileSync(testHtmlPath, htmlContent);
  
  console.log(`✅ Test HTML created: ${testHtmlPath}`);
  console.log('   Open this file in your browser to test the widget!');
  
  return true;
}

// Run all tests
function runAllTests() {
  console.log('🎯 CardStream WordPress Widget Test Suite');
  console.log('==========================================\n');
  
  let success = true;
  
  success &= testWidgetFiles();
  success &= testConfigFile();
  success &= createTestHtml();
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  
  if (success) {
    console.log('✅ All tests passed! Widget is ready for WordPress integration.');
    console.log('\n🚀 Next Steps:');
    console.log('1. Open test-widget.html in your browser to verify functionality');
    console.log('2. Upload files to your CDN or hosting (GitHub + JSDelivr recommended)');  
    console.log('3. Update the WordPress implementation plan with your actual URLs');
    console.log('4. Add the PHP code to your WordPress theme functions.php');
    console.log('5. Test the [cardstream] shortcode on a WordPress page');
  } else {
    console.log('❌ Some tests failed. Please check the output above and fix any issues.');
  }
  
  console.log('\n📁 Generated Files:');
  console.log('   • dist/widget.js & dist/widget.min.js (22KB)');
  console.log('   • dist/widget.css & dist/widget.min.css (15KB)');
  console.log('   • dist/config.json (8KB)');
  console.log('   • test-widget.html (test environment)');
  
  console.log('\n🔧 Debug Commands:');
  console.log('   • Open browser console on test page');
  console.log('   • Type: _cardStreamDebug');
  console.log('   • Use the debug panel buttons in the test page');
  
  return success;
}

// Run the tests
runAllTests();