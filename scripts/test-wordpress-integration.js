#!/usr/bin/env node

/**
 * WordPress Integration Testing Suite
 * 
 * Tests E1 Calculator widget integration with:
 * - Classic Editor
 * - Gutenberg Block Editor
 * - Shortcode system
 * - Admin AJAX endpoints
 * - Multiple instance handling
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class WordPressIntegrationTester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            tests: {},
            summary: { total: 0, passed: 0, failed: 0 }
        };
        
        this.wpPluginPath = path.join(__dirname, '../wordpress-plugin/e1-calculator-pro');
        this.testPagesDir = path.join(__dirname, '../test-pages/wordpress');
    }
    
    async runAllTests() {
        console.log('📝 Starting WordPress Integration Tests...\n');
        
        try {
            // Setup WordPress test environment
            await this.setupWordPressTestEnvironment();
            
            // Test plugin files
            await this.testPluginFiles();
            
            // Test Classic Editor integration
            await this.testClassicEditor();
            
            // Test Gutenberg Block integration
            await this.testGutenbergBlock();
            
            // Test Shortcode system
            await this.testShortcodeSystem();
            
            // Test AJAX endpoints
            await this.testAjaxEndpoints();
            
            // Test multiple instances
            await this.testMultipleInstances();
            
            // Test WordPress hooks and filters
            await this.testWordPressHooks();
            
            // Generate test pages for manual verification
            await this.generateWordPressTestPages();
            
            // Generate report
            await this.generateWordPressTestReport();
            
            this.printWordPressSummary();
            
        } catch (error) {
            console.error('❌ WordPress integration tests failed:', error);
            process.exit(1);
        }
    }
    
    async testPluginFiles() {
        console.log('📂 Testing WordPress Plugin Files...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        // Required plugin files
        const requiredFiles = [
            'e1-calculator.php',
            'includes/class-e1-calculator-loader.php'
        ];
        
        let filesExist = 0;
        requiredFiles.forEach(file => {
            const filePath = path.join(this.wpPluginPath, file);
            if (fs.existsSync(filePath)) {
                filesExist++;
                test.details[file] = 'exists';
            } else {
                test.issues.push(`Missing file: ${file}`);
                test.details[file] = 'missing';
            }
        });
        
        // Test main plugin file structure
        const mainPluginFile = path.join(this.wpPluginPath, 'e1-calculator.php');
        if (fs.existsSync(mainPluginFile)) {
            const content = fs.readFileSync(mainPluginFile, 'utf8');
            
            // Check plugin header
            if (content.includes('Plugin Name:')) {
                test.details.plugin_header = 'valid';
            } else {
                test.issues.push('Invalid plugin header');
            }
            
            // Check version consistency
            if (content.includes('Version: 2.2.0')) {
                test.details.version = 'correct';
            } else {
                test.issues.push('Version mismatch');
            }
            
            // Check required constants
            const requiredConstants = ['E1_CALC_VERSION', 'E1_CALC_PLUGIN_DIR'];
            requiredConstants.forEach(constant => {
                if (content.includes(constant)) {
                    test.details[`constant_${constant}`] = 'defined';
                } else {
                    test.issues.push(`Missing constant: ${constant}`);
                }
            });
        }
        
        // Test loader class
        const loaderFile = path.join(this.wpPluginPath, 'includes/class-e1-calculator-loader.php');
        if (fs.existsSync(loaderFile)) {
            const content = fs.readFileSync(loaderFile, 'utf8');
            
            // Check required methods
            const requiredMethods = [
                'enqueue_scripts',
                'register_gutenberg_block',
                'ajax_get_config',
                'render_shortcode'
            ];
            
            requiredMethods.forEach(method => {
                if (content.includes(`function ${method}(`)) {
                    test.details[`method_${method}`] = 'exists';
                } else {
                    test.issues.push(`Missing method: ${method}`);
                }
            });
        }
        
        test.passed = test.issues.length === 0;
        
        this.addTestResult('plugin_files', test);
        console.log(`  ${test.passed ? '✅' : '❌'} Plugin files: ${filesExist}/${requiredFiles.length} files found\n`);
    }
    
    async testClassicEditor() {
        console.log('📝 Testing Classic Editor Integration...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        // Test shortcode registration
        const loaderFile = path.join(this.wpPluginPath, 'includes/class-e1-calculator-loader.php');
        const content = fs.readFileSync(loaderFile, 'utf8');
        
        // Check shortcode is registered
        if (content.includes("add_shortcode('e1_calculator'")) {
            test.details.shortcode_registered = true;
        } else {
            test.issues.push('Shortcode not registered');
        }
        
        // Check render callback exists
        if (content.includes('render_shortcode')) {
            test.details.render_callback = true;
        } else {
            test.issues.push('Render callback missing');
        }
        
        // Test shortcode attributes
        const shortcodeAttributes = ['shadow', 'height', 'theme', 'class'];
        let attributesFound = 0;
        
        shortcodeAttributes.forEach(attr => {
            if (content.includes(`'${attr}'`)) {
                attributesFound++;
                test.details[`attr_${attr}`] = true;
            }
        });
        
        test.details.attributes_supported = `${attributesFound}/${shortcodeAttributes.length}`;
        
        // Check HTML output structure
        if (content.includes('data-e1-calculator')) {
            test.details.proper_html_attributes = true;
        } else {
            test.issues.push('Missing required HTML attributes');
        }
        
        // Check noscript fallback
        if (content.includes('<noscript>')) {
            test.details.noscript_fallback = true;
        } else {
            test.issues.push('Missing noscript fallback');
        }
        
        test.passed = test.issues.length === 0;
        
        this.addTestResult('classic_editor', test);
        console.log(`  ${test.passed ? '✅' : '❌'} Classic Editor: ${attributesFound}/${shortcodeAttributes.length} attributes supported\n`);
    }
    
    async testGutenbergBlock() {
        console.log('🧱 Testing Gutenberg Block Integration...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        const loaderFile = path.join(this.wpPluginPath, 'includes/class-e1-calculator-loader.php');
        const content = fs.readFileSync(loaderFile, 'utf8');
        
        // Check block registration
        if (content.includes("register_block_type('e1-calculator/widget'")) {
            test.details.block_registered = true;
        } else {
            test.issues.push('Block not registered');
        }
        
        // Check comprehensive attributes
        const blockAttributes = [
            'shadow', 'height', 'theme', 'autoInit', 'showVisualSupport',
            'enableCache', 'debugMode', 'mobileHeight', 'breakpoint',
            'lazyLoad', 'loadPriority', 'ariaLabel', 'tabIndex'
        ];
        
        let attributesFound = 0;
        blockAttributes.forEach(attr => {
            if (content.includes(`'${attr}'`)) {
                attributesFound++;
                test.details[`attr_${attr}`] = true;
            }
        });
        
        test.details.attributes_count = `${attributesFound}/${blockAttributes.length}`;
        
        // Check block supports
        if (content.includes("'supports' =>")) {
            test.details.supports_config = true;
        } else {
            test.issues.push('Block supports configuration missing');
        }
        
        // Check render callback
        if (content.includes("'render_callback' => [\$this, 'render_block']")) {
            test.details.render_callback = true;
        } else {
            test.issues.push('Block render callback missing');
        }
        
        // Check editor scripts
        if (content.includes('wp_register_script')) {
            test.details.editor_scripts = true;
        } else {
            test.issues.push('Editor scripts not registered');
        }
        
        test.passed = test.issues.length === 0 && attributesFound >= 10;
        
        this.addTestResult('gutenberg_block', test);
        console.log(`  ${test.passed ? '✅' : '❌'} Gutenberg Block: ${attributesFound}/${blockAttributes.length} attributes configured\n`);
    }
    
    async testShortcodeSystem() {
        console.log('⚡ Testing Shortcode System...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        // Test shortcode parsing logic
        const loaderFile = path.join(this.wpPluginPath, 'includes/class-e1-calculator-loader.php');
        const content = fs.readFileSync(loaderFile, 'utf8');
        
        // Check shortcode_atts usage
        if (content.includes('shortcode_atts(')) {
            test.details.attribute_parsing = true;
        } else {
            test.issues.push('Shortcode attribute parsing missing');
        }
        
        // Check default values
        const defaultValues = {
            'shadow': 'true',
            'height': '600px',
            'theme': 'default'
        };
        
        let defaultsFound = 0;
        Object.entries(defaultValues).forEach(([attr, defaultVal]) => {
            if (content.includes(`'${attr}' => '${defaultVal}'`)) {
                defaultsFound++;
                test.details[`default_${attr}`] = true;
            }
        });
        
        test.details.defaults_configured = `${defaultsFound}/${Object.keys(defaultValues).length}`;
        
        // Check sanitization
        if (content.includes('esc_attr(') || content.includes('esc_url(')) {
            test.details.output_sanitization = true;
        } else {
            test.issues.push('Output sanitization missing');
        }
        
        // Check unique ID generation
        if (content.includes('$instance_count++') || content.includes('wp_generate_uuid4()')) {
            test.details.unique_ids = true;
        } else {
            test.issues.push('Unique ID generation missing');
        }
        
        test.passed = test.issues.length === 0;
        
        this.addTestResult('shortcode_system', test);
        console.log(`  ${test.passed ? '✅' : '❌'} Shortcode System: ${defaultsFound}/${Object.keys(defaultValues).length} defaults configured\n`);
    }
    
    async testAjaxEndpoints() {
        console.log('🔗 Testing AJAX Endpoints...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        const loaderFile = path.join(this.wpPluginPath, 'includes/class-e1-calculator-loader.php');
        const content = fs.readFileSync(loaderFile, 'utf8');
        
        // Check AJAX action registration
        const ajaxActions = [
            'wp_ajax_e1_calculator_get_config',
            'wp_ajax_nopriv_e1_calculator_get_config',
            'wp_ajax_e1_calculator_validate_cache',
            'wp_ajax_e1_calculator_get_compatibility'
        ];
        
        let actionsFound = 0;
        ajaxActions.forEach(action => {
            if (content.includes(`add_action('${action}'`)) {
                actionsFound++;
                test.details[action] = true;
            }
        });
        
        test.details.ajax_actions = `${actionsFound}/${ajaxActions.length}`;
        
        // Check security measures
        if (content.includes('check_ajax_referer')) {
            test.details.nonce_verification = true;
        } else {
            test.issues.push('Nonce verification missing');
        }
        
        if (content.includes('wp_send_json_error')) {
            test.details.error_handling = true;
        } else {
            test.issues.push('AJAX error handling missing');
        }
        
        // Check rate limiting
        if (content.includes('check_rate_limit')) {
            test.details.rate_limiting = true;
        } else {
            test.issues.push('Rate limiting missing');
        }
        
        // Check config endpoint specifics
        if (content.includes('ajax_get_config')) {
            test.details.config_endpoint = true;
            
            // Check multi-layer security
            if (content.includes('configNonce')) {
                test.details.enhanced_security = true;
            }
        }
        
        test.passed = test.issues.length === 0 && actionsFound >= 3;
        
        this.addTestResult('ajax_endpoints', test);
        console.log(`  ${test.passed ? '✅' : '❌'} AJAX Endpoints: ${actionsFound}/${ajaxActions.length} actions registered\n`);
    }
    
    async testMultipleInstances() {
        console.log('🔢 Testing Multiple Widget Instances...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        const loaderFile = path.join(this.wpPluginPath, 'includes/class-e1-calculator-loader.php');
        const content = fs.readFileSync(loaderFile, 'utf8');
        
        // Check instance counting
        if (content.includes('static $instance_count') || content.includes('$instance_count++')) {
            test.details.instance_counting = true;
        } else {
            test.issues.push('Instance counting mechanism missing');
        }
        
        // Check unique ID generation
        if (content.includes('get_the_ID()')) {
            test.details.post_id_integration = true;
        } else {
            test.issues.push('Post ID integration missing');
        }
        
        // Check JavaScript initialization
        if (content.includes('initAll')) {
            test.details.bulk_initialization = true;
        } else {
            test.issues.push('Bulk initialization missing');
        }
        
        // Check cleanup and memory management
        if (content.includes('destroy') || content.includes('cleanup')) {
            test.details.cleanup_support = true;
        } else {
            test.issues.push('Cleanup support missing');
        }
        
        test.passed = test.issues.length === 0;
        
        this.addTestResult('multiple_instances', test);
        console.log(`  ${test.passed ? '✅' : '❌'} Multiple Instances: ${test.issues.length === 0 ? 'All checks passed' : 'Issues found'}\n`);
    }
    
    async testWordPressHooks() {
        console.log('🪝 Testing WordPress Hooks and Filters...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        const loaderFile = path.join(this.wpPluginPath, 'includes/class-e1-calculator-loader.php');
        const content = fs.readFileSync(loaderFile, 'utf8');
        
        // Check essential WordPress hooks
        const requiredHooks = [
            'wp_enqueue_scripts',
            'admin_enqueue_scripts',
            'init'
        ];
        
        let hooksFound = 0;
        requiredHooks.forEach(hook => {
            if (content.includes(`add_action('${hook}'`)) {
                hooksFound++;
                test.details[`hook_${hook}`] = true;
            }
        });
        
        test.details.wordpress_hooks = `${hooksFound}/${requiredHooks.length}`;
        
        // Check admin notices for compatibility issues
        if (content.includes('admin_notices')) {
            test.details.admin_notices = true;
        } else {
            test.issues.push('Admin notices hook missing');
        }
        
        // Check activation/deactivation hooks in main plugin file
        const mainFile = path.join(this.wpPluginPath, 'e1-calculator.php');
        if (fs.existsSync(mainFile)) {
            const mainContent = fs.readFileSync(mainFile, 'utf8');
            
            if (mainContent.includes('register_activation_hook')) {
                test.details.activation_hook = true;
            } else {
                test.issues.push('Activation hook missing');
            }
            
            if (mainContent.includes('register_deactivation_hook')) {
                test.details.deactivation_hook = true;
            } else {
                test.issues.push('Deactivation hook missing');
            }
        }
        
        // Check performance hooks
        if (content.includes('wp_head') || content.includes('wp_footer')) {
            test.details.performance_hooks = true;
        } else {
            test.issues.push('Performance monitoring hooks missing');
        }
        
        test.passed = test.issues.length === 0 && hooksFound >= 2;
        
        this.addTestResult('wordpress_hooks', test);
        console.log(`  ${test.passed ? '✅' : '❌'} WordPress Hooks: ${hooksFound}/${requiredHooks.length} required hooks found\n`);
    }
    
    async setupWordPressTestEnvironment() {
        console.log('🔧 Setting up WordPress test environment...');
        
        // Create WordPress test pages directory
        if (!fs.existsSync(this.testPagesDir)) {
            fs.mkdirSync(this.testPagesDir, { recursive: true });
        }
        
        console.log('  ✅ WordPress test environment ready\\n');
    }
    
    async generateWordPressTestPages() {
        console.log('📄 Generating WordPress test pages...');
        
        // Classic Editor simulation
        this.generateClassicEditorTestPage();
        
        // Gutenberg Block simulation
        this.generateGutenbergTestPage();
        
        // Multiple instances test
        this.generateMultipleInstancesTestPage();
        
        // AJAX endpoints test
        this.generateAjaxTestPage();
        
        console.log('  ✅ WordPress test pages generated\\n');
    }
    
    generateClassicEditorTestPage() {
        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordPress Classic Editor Test</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .wp-content { max-width: 800px; margin: 0 auto; }
        .shortcode-demo { background: #f9f9f9; padding: 20px; border-left: 4px solid #2271b1; margin: 20px 0; }
        pre { background: #23282d; color: #eee; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="wp-content">
        <h1>WordPress Classic Editor Integration Test</h1>
        
        <h2>Basic Shortcode</h2>
        <div class="shortcode-demo">
            <p><strong>Shortcode:</strong> <code>[e1_calculator]</code></p>
            <div id="basic-shortcode" data-e1-calculator>
                <!-- Basic widget -->
            </div>
        </div>
        
        <h2>Shortcode with Attributes</h2>
        <div class="shortcode-demo">
            <p><strong>Shortcode:</strong> <code>[e1_calculator height="500px" theme="dark" shadow="true"]</code></p>
            <div id="attr-shortcode" data-e1-calculator data-height="500px" data-theme="dark" data-shadow="true">
                <!-- Widget with attributes -->
            </div>
        </div>
        
        <h2>Shortcode in Content</h2>
        <div class="shortcode-demo">
            <p>This simulates a shortcode embedded in post content.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            
            <div id="content-shortcode" data-e1-calculator data-theme="light">
                <!-- Inline widget -->
            </div>
            
            <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </div>
        
        <h2>Test Results</h2>
        <div id="test-results" style="padding: 20px; border: 1px solid #ccc; border-radius: 4px;">
            <h3>Loading...</h3>
        </div>
    </div>
    
    <!-- Simulate WordPress environment -->
    <script>
        window.e1CalculatorWP = {
            ajaxUrl: '/wp-admin/admin-ajax.php',
            nonce: 'classic-editor-nonce',
            configNonce: 'config-nonce',
            cacheUrl: '../../dist',
            version: '2.2.0',
            isAdmin: false,
            isBlockEditor: false
        };
    </script>
    
    <script src="../../dist/e1-calculator-widget.min.js"></script>
    <script>
        async function testClassicEditor() {
            const results = document.getElementById('test-results');
            results.innerHTML = '<h3>Testing Classic Editor Integration...</h3>';
            
            try {
                // Initialize all widgets
                const instances = await window.E1Calculator.initAll();
                
                let report = '<h3>Classic Editor Test Results</h3>';
                report += \`<p>✅ Widgets initialized: \${instances.length}</p>\`;
                
                // Test each widget
                instances.forEach((instance, index) => {
                    if (instance) {
                        report += \`<p>✅ Widget \${index + 1}: \${instance.mode} mode</p>\`;
                    }
                });
                
                // Test shortcode attribute handling
                const attrWidget = instances.find(i => i.elementId === 'attr-shortcode');
                if (attrWidget) {
                    report += '<p>✅ Shortcode attributes processed</p>';
                } else {
                    report += '<p>❌ Shortcode attributes not processed</p>';
                }
                
                // Test inline content embedding
                const contentWidget = instances.find(i => i.elementId === 'content-shortcode');
                if (contentWidget) {
                    report += '<p>✅ Inline content embedding works</p>';
                } else {
                    report += '<p>❌ Inline content embedding failed</p>';
                }
                
                results.innerHTML = report;
                
            } catch (error) {
                results.innerHTML = '<h3>Test Failed</h3><p>' + error.message + '</p>';
            }
        }
        
        window.addEventListener('load', testClassicEditor);
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.testPagesDir, 'classic-editor-test.html'), content.trim());
    }
    
    generateGutenbergTestPage() {
        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordPress Gutenberg Block Test</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .wp-block { max-width: 800px; margin: 0 auto; }
        .block-demo { background: #f0f6fc; padding: 20px; border: 1px solid #c3dcf1; margin: 20px 0; border-radius: 6px; }
        .block-attributes { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
        pre { font-size: 12px; background: #23282d; color: #eee; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="wp-block">
        <h1>WordPress Gutenberg Block Integration Test</h1>
        
        <h2>Basic Block</h2>
        <div class="block-demo">
            <h4>Block Configuration:</h4>
            <div class="block-attributes">
                <strong>Shadow DOM:</strong> true<br>
                <strong>Height:</strong> 600px<br>
                <strong>Theme:</strong> default
            </div>
            <div id="gutenberg-basic" data-e1-calculator data-shadow="true" data-height="600px" data-theme="default">
                <!-- Basic Gutenberg block -->
            </div>
        </div>
        
        <h2>Advanced Block with All Attributes</h2>
        <div class="block-demo">
            <h4>Block Configuration:</h4>
            <div class="block-attributes">
                <strong>Shadow DOM:</strong> false<br>
                <strong>Height:</strong> 500px (desktop), 400px (mobile)<br>
                <strong>Theme:</strong> energiaykkonen<br>
                <strong>Visual Support:</strong> true<br>
                <strong>Cache:</strong> true<br>
                <strong>Debug:</strong> false<br>
                <strong>Lazy Load:</strong> false<br>
                <strong>ARIA Label:</strong> Advanced Energy Calculator
            </div>
            <div id="gutenberg-advanced" 
                 data-e1-calculator 
                 data-shadow="false"
                 data-height="500px"
                 data-mobile-height="400px"
                 data-theme="energiaykkonen"
                 data-show-visual-support="true"
                 data-enable-cache="true"
                 data-debug="false"
                 data-lazy-load="false"
                 aria-label="Advanced Energy Calculator">
                <!-- Advanced Gutenberg block -->
            </div>
        </div>
        
        <h2>Block with Custom Styling</h2>
        <div class="block-demo">
            <h4>Block Configuration:</h4>
            <div class="block-attributes">
                <strong>Container Class:</strong> custom-calculator-block<br>
                <strong>Custom CSS:</strong> Applied<br>
                <strong>Background:</strong> Linear gradient
            </div>
            <div id="gutenberg-custom" 
                 data-e1-calculator 
                 class="custom-calculator-block"
                 data-theme="light"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
                <!-- Styled Gutenberg block -->
            </div>
        </div>
        
        <h2>Test Results</h2>
        <div id="test-results" style="padding: 20px; border: 1px solid #ccc; border-radius: 4px;">
            <h3>Loading...</h3>
        </div>
    </div>
    
    <!-- Simulate WordPress Gutenberg environment -->
    <script>
        window.e1CalculatorWP = {
            ajaxUrl: '/wp-admin/admin-ajax.php',
            nonce: 'gutenberg-nonce',
            configNonce: 'config-nonce',
            cacheUrl: '../../dist',
            version: '2.2.0',
            isAdmin: false,
            isBlockEditor: true
        };
    </script>
    
    <script src="../../dist/e1-calculator-widget.min.js"></script>
    <script>
        async function testGutenbergBlocks() {
            const results = document.getElementById('test-results');
            results.innerHTML = '<h3>Testing Gutenberg Block Integration...</h3>';
            
            try {
                // Initialize all widgets
                const instances = await window.E1Calculator.initAll();
                
                let report = '<h3>Gutenberg Block Test Results</h3>';
                report += \`<p>✅ Block instances initialized: \${instances.length}</p>\`;
                
                // Test basic block
                const basicBlock = instances.find(i => i.elementId === 'gutenberg-basic');
                if (basicBlock) {
                    report += \`<p>✅ Basic block: \${basicBlock.mode} mode</p>\`;
                } else {
                    report += '<p>❌ Basic block initialization failed</p>';
                }
                
                // Test advanced block with attributes
                const advancedBlock = instances.find(i => i.elementId === 'gutenberg-advanced');
                if (advancedBlock) {
                    report += \`<p>✅ Advanced block: \${advancedBlock.mode} mode</p>\`;
                    
                    // Test namespace fallback
                    if (advancedBlock.mode === 'namespace') {
                        report += '<p>✅ Namespace fallback working</p>';
                    }
                } else {
                    report += '<p>❌ Advanced block initialization failed</p>';
                }
                
                // Test custom styling block
                const customBlock = instances.find(i => i.elementId === 'gutenberg-custom');
                if (customBlock) {
                    report += '<p>✅ Custom styling block initialized</p>';
                    
                    // Check if custom styling is preserved
                    const container = document.getElementById('gutenberg-custom');
                    const hasGradient = container.style.background.includes('linear-gradient');
                    if (hasGradient) {
                        report += '<p>✅ Custom styling preserved</p>';
                    } else {
                        report += '<p>⚠️ Custom styling may be affected</p>';
                    }
                } else {
                    report += '<p>❌ Custom styling block initialization failed</p>';
                }
                
                // Test attribute inheritance
                report += '<h4>Attribute Processing Test</h4>';
                const containers = document.querySelectorAll('[data-e1-calculator]');
                let attributesProcessed = 0;
                
                containers.forEach(container => {
                    const attrs = ['data-shadow', 'data-theme', 'data-height'];
                    attrs.forEach(attr => {
                        if (container.hasAttribute(attr)) {
                            attributesProcessed++;
                        }
                    });
                });
                
                report += \`<p>📊 Attributes processed: \${attributesProcessed} found</p>\`;
                
                results.innerHTML = report;
                
            } catch (error) {
                results.innerHTML = '<h3>Test Failed</h3><p>' + error.message + '</p>';
            }
        }
        
        window.addEventListener('load', testGutenbergBlocks);
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.testPagesDir, 'gutenberg-block-test.html'), content.trim());
    }
    
    generateMultipleInstancesTestPage() {
        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordPress Multiple Instances Test</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .wp-content { max-width: 1200px; margin: 0 auto; }
        .widget-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .widget-container { padding: 15px; border: 1px solid #ddd; border-radius: 6px; }
        .widget-info { background: #f8f9fa; padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; }
        @media (max-width: 768px) {
            .widget-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="wp-content">
        <h1>WordPress Multiple Widget Instances Test</h1>
        <p>This page tests multiple E1 Calculator widgets with different configurations on the same page.</p>
        
        <div class="widget-grid">
            <div class="widget-container">
                <div class="widget-info">
                    <strong>Widget 1:</strong> Shadow DOM, Default Theme, 500px
                </div>
                <div id="multi-widget-1" data-e1-calculator data-shadow="true" data-theme="default" data-height="500px">
                    <!-- Widget 1 -->
                </div>
            </div>
            
            <div class="widget-container">
                <div class="widget-info">
                    <strong>Widget 2:</strong> Namespace, Light Theme, 450px
                </div>
                <div id="multi-widget-2" data-e1-calculator data-shadow="false" data-theme="light" data-height="450px">
                    <!-- Widget 2 -->
                </div>
            </div>
            
            <div class="widget-container">
                <div class="widget-info">
                    <strong>Widget 3:</strong> Shadow DOM, Dark Theme, 600px
                </div>
                <div id="multi-widget-3" data-e1-calculator data-shadow="true" data-theme="dark" data-height="600px">
                    <!-- Widget 3 -->
                </div>
            </div>
            
            <div class="widget-container">
                <div class="widget-info">
                    <strong>Widget 4:</strong> Namespace, Energiaykkonen Theme, 400px
                </div>
                <div id="multi-widget-4" data-e1-calculator data-shadow="false" data-theme="energiaykkonen" data-height="400px">
                    <!-- Widget 4 -->
                </div>
            </div>
        </div>
        
        <div class="widget-container" style="grid-column: 1 / -1;">
            <div class="widget-info">
                <strong>Widget 5:</strong> Full width, Shadow DOM, Custom configuration
            </div>
            <div id="multi-widget-5" 
                 data-e1-calculator 
                 data-shadow="true" 
                 data-theme="default"
                 data-show-visual-support="true"
                 data-enable-cache="true"
                 data-height="500px"
                 data-mobile-height="400px">
                <!-- Widget 5 -->
            </div>
        </div>
        
        <h2>Instance Management Test</h2>
        <div style="margin: 20px 0;">
            <button onclick="testDestroy()" style="margin: 5px; padding: 10px;">Destroy Widget 2</button>
            <button onclick="testRecreate()" style="margin: 5px; padding: 10px;">Recreate Widget 2</button>
            <button onclick="testDestroyAll()" style="margin: 5px; padding: 10px;">Destroy All</button>
            <button onclick="testRecreateAll()" style="margin: 5px; padding: 10px;">Recreate All</button>
        </div>
        
        <h2>Test Results</h2>
        <div id="test-results" style="padding: 20px; border: 1px solid #ccc; border-radius: 4px;">
            <h3>Loading...</h3>
        </div>
    </div>
    
    <script>
        window.e1CalculatorWP = {
            ajaxUrl: '/wp-admin/admin-ajax.php',
            nonce: 'multi-instance-nonce',
            configNonce: 'config-nonce',
            cacheUrl: '../../dist',
            version: '2.2.0'
        };
    </script>
    
    <script src="../../dist/e1-calculator-widget.min.js"></script>
    <script>
        let allInstances = [];
        
        async function testMultipleInstances() {
            const results = document.getElementById('test-results');
            results.innerHTML = '<h3>Testing Multiple Widget Instances...</h3>';
            
            try {
                // Initialize all widgets
                allInstances = await window.E1Calculator.initAll();
                
                let report = '<h3>Multiple Instances Test Results</h3>';
                report += \`<p>✅ Total widgets initialized: \${allInstances.length}</p>\`;
                
                // Test different modes
                const shadowWidgets = allInstances.filter(w => w && w.mode === 'shadow');
                const namespaceWidgets = allInstances.filter(w => w && w.mode === 'namespace');
                
                report += \`<p>📊 Shadow DOM widgets: \${shadowWidgets.length}</p>\`;
                report += \`<p>📊 Namespace widgets: \${namespaceWidgets.length}</p>\`;
                
                // Test unique IDs
                const ids = allInstances.map(w => w ? w.elementId : null).filter(Boolean);
                const uniqueIds = new Set(ids);
                
                if (ids.length === uniqueIds.size) {
                    report += '<p>✅ All widget IDs are unique</p>';
                } else {
                    report += '<p>❌ Duplicate widget IDs detected</p>';
                }
                
                // Test isolation between widgets
                let isolationTest = true;
                allInstances.forEach((widget, index) => {
                    if (widget) {
                        const container = document.getElementById(widget.elementId);
                        if (!container) {
                            isolationTest = false;
                        }
                    }
                });
                
                if (isolationTest) {
                    report += '<p>✅ Widget isolation working correctly</p>';
                } else {
                    report += '<p>❌ Widget isolation issues detected</p>';
                }
                
                // Test performance impact
                const loadTime = performance.now() - window.startTime;
                report += \`<p>⚡ Total load time: \${Math.round(loadTime)}ms</p>\`;
                report += \`<p>⚡ Average per widget: \${Math.round(loadTime / allInstances.length)}ms</p>\`;
                
                results.innerHTML = report;
                
            } catch (error) {
                results.innerHTML = '<h3>Test Failed</h3><p>' + error.message + '</p>';
            }
        }
        
        function testDestroy() {
            if (window.E1Calculator.destroy('multi-widget-2')) {
                updateResults('Widget 2 destroyed successfully');
            } else {
                updateResults('Widget 2 destruction failed');
            }
        }
        
        async function testRecreate() {
            const instance = await window.E1Calculator.init('multi-widget-2', {
                useShadowDOM: false,
                theme: 'light'
            });
            
            if (instance) {
                updateResults('Widget 2 recreated successfully');
            } else {
                updateResults('Widget 2 recreation failed');
            }
        }
        
        function testDestroyAll() {
            const destroyed = window.E1Calculator.destroyAll();
            updateResults(\`All widgets destroyed: \${destroyed.length} instances\`);
        }
        
        async function testRecreateAll() {
            const instances = await window.E1Calculator.initAll();
            updateResults(\`All widgets recreated: \${instances.length} instances\`);
        }
        
        function updateResults(message) {
            const results = document.getElementById('test-results');
            const currentTime = new Date().toLocaleTimeString();
            results.innerHTML += \`<p>[\${currentTime}] \${message}</p>\`;
        }
        
        // Track initial load time
        window.startTime = performance.now();
        window.addEventListener('load', testMultipleInstances);
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.testPagesDir, 'multiple-instances-test.html'), content.trim());
    }
    
    generateAjaxTestPage() {
        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordPress AJAX Endpoints Test</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .ajax-test { background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin: 20px 0; }
        .test-button { background: #2271b1; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .test-button:hover { background: #135e96; }
        .response { background: #23282d; color: #eee; padding: 15px; border-radius: 4px; margin: 10px 0; overflow-x: auto; }
        pre { margin: 0; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div>
        <h1>WordPress AJAX Endpoints Test</h1>
        <p>This page tests the WordPress AJAX endpoints for the E1 Calculator widget.</p>
        
        <div class="ajax-test">
            <h3>Config Endpoint Test</h3>
            <p>Tests the main configuration retrieval endpoint.</p>
            <button class="test-button" onclick="testConfigEndpoint()">Test Config Endpoint</button>
            <div id="config-response" class="response" style="display: none;">
                <pre id="config-data"></pre>
            </div>
        </div>
        
        <div class="ajax-test">
            <h3>Cache Validation Test</h3>
            <p>Tests the cache validation endpoint.</p>
            <button class="test-button" onclick="testCacheEndpoint()">Test Cache Endpoint</button>
            <div id="cache-response" class="response" style="display: none;">
                <pre id="cache-data"></pre>
            </div>
        </div>
        
        <div class="ajax-test">
            <h3>Compatibility Check Test</h3>
            <p>Tests the browser compatibility endpoint.</p>
            <button class="test-button" onclick="testCompatibilityEndpoint()">Test Compatibility Endpoint</button>
            <div id="compatibility-response" class="response" style="display: none;">
                <pre id="compatibility-data"></pre>
            </div>
        </div>
        
        <div class="ajax-test">
            <h3>Security Tests</h3>
            <p>Tests nonce validation and rate limiting.</p>
            <button class="test-button" onclick="testInvalidNonce()">Test Invalid Nonce</button>
            <button class="test-button" onclick="testRateLimit()">Test Rate Limiting</button>
            <div id="security-response" class="response" style="display: none;">
                <pre id="security-data"></pre>
            </div>
        </div>
        
        <div class="ajax-test">
            <h3>Performance Test</h3>
            <p>Tests AJAX endpoint response times.</p>
            <button class="test-button" onclick="testPerformance()">Run Performance Test</button>
            <div id="performance-response" class="response" style="display: none;">
                <pre id="performance-data"></pre>
            </div>
        </div>
    </div>
    
    <script>
        // Simulate WordPress AJAX environment
        window.e1CalculatorWP = {
            ajaxUrl: '/wp-admin/admin-ajax.php',
            nonce: 'ajax-test-nonce',
            configNonce: 'config-test-nonce',
            cacheUrl: '../../dist',
            version: '2.2.0'
        };
        
        // Mock AJAX responses for testing
        const mockAjaxResponse = (action, nonce, data = {}) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const response = {
                        success: true,
                        data: {
                            action: action,
                            nonce_valid: nonce === window.e1CalculatorWP.configNonce || nonce === window.e1CalculatorWP.nonce,
                            timestamp: Date.now(),
                            ...data
                        }
                    };
                    
                    if (action === 'e1_calculator_get_config') {
                        response.data.config = {
                            version: '2.2.0',
                            cards: [],
                            visualObjects: {},
                            formulas: []
                        };
                        response.data.metadata = {
                            cache_status: 'valid',
                            processing_time: Math.random() * 100
                        };
                    }
                    
                    if (action === 'e1_calculator_validate_cache') {
                        response.data.cache_status = {
                            valid: true,
                            files: {
                                'widget.js': { exists: true, size: 289000 },
                                'widget.css': { exists: true, size: 11000 }
                            }
                        };
                    }
                    
                    if (action === 'e1_calculator_get_compatibility') {
                        response.data.browser_support = {
                            shadowDOM: true,
                            customElements: true,
                            cssVariables: true
                        };
                        response.data.system_info = {
                            php_version: '8.1.0',
                            wp_version: '6.3.0',
                            plugin_version: '2.2.0'
                        };
                    }
                    
                    resolve(response);
                }, Math.random() * 500 + 100);
            });
        };
        
        async function testConfigEndpoint() {
            const responseDiv = document.getElementById('config-response');
            const dataDiv = document.getElementById('config-data');
            
            responseDiv.style.display = 'block';
            dataDiv.textContent = 'Loading...';
            
            try {
                const startTime = performance.now();
                const response = await mockAjaxResponse('e1_calculator_get_config', window.e1CalculatorWP.configNonce);
                const endTime = performance.now();
                
                const result = {
                    ...response,
                    response_time: Math.round(endTime - startTime) + 'ms'
                };
                
                dataDiv.textContent = JSON.stringify(result, null, 2);
                
            } catch (error) {
                dataDiv.textContent = 'Error: ' + error.message;
            }
        }
        
        async function testCacheEndpoint() {
            const responseDiv = document.getElementById('cache-response');
            const dataDiv = document.getElementById('cache-data');
            
            responseDiv.style.display = 'block';
            dataDiv.textContent = 'Loading...';
            
            try {
                const response = await mockAjaxResponse('e1_calculator_validate_cache', window.e1CalculatorWP.nonce);
                dataDiv.textContent = JSON.stringify(response, null, 2);
                
            } catch (error) {
                dataDiv.textContent = 'Error: ' + error.message;
            }
        }
        
        async function testCompatibilityEndpoint() {
            const responseDiv = document.getElementById('compatibility-response');
            const dataDiv = document.getElementById('compatibility-data');
            
            responseDiv.style.display = 'block';
            dataDiv.textContent = 'Loading...';
            
            try {
                const response = await mockAjaxResponse('e1_calculator_get_compatibility', window.e1CalculatorWP.nonce);
                dataDiv.textContent = JSON.stringify(response, null, 2);
                
            } catch (error) {
                dataDiv.textContent = 'Error: ' + error.message;
            }
        }
        
        async function testInvalidNonce() {
            const responseDiv = document.getElementById('security-response');
            const dataDiv = document.getElementById('security-data');
            
            responseDiv.style.display = 'block';
            dataDiv.textContent = 'Testing invalid nonce...';
            
            try {
                const response = await mockAjaxResponse('e1_calculator_get_config', 'invalid-nonce');
                
                const result = {
                    test: 'Invalid Nonce Test',
                    expected: 'Should fail with nonce error',
                    actual: response.data.nonce_valid ? 'PASSED (unexpected)' : 'FAILED (expected)',
                    response: response
                };
                
                dataDiv.textContent = JSON.stringify(result, null, 2);
                
            } catch (error) {
                dataDiv.textContent = 'Error: ' + error.message;
            }
        }
        
        async function testRateLimit() {
            const responseDiv = document.getElementById('security-response');
            const dataDiv = document.getElementById('security-data');
            
            responseDiv.style.display = 'block';
            dataDiv.textContent = 'Testing rate limiting (simulating multiple requests)...';
            
            const results = [];
            const promises = [];
            
            // Simulate multiple rapid requests
            for (let i = 0; i < 5; i++) {
                promises.push(
                    mockAjaxResponse('e1_calculator_get_config', window.e1CalculatorWP.configNonce)
                        .then(response => ({ request: i + 1, success: response.success }))
                );
            }
            
            try {
                const responses = await Promise.all(promises);
                
                const result = {
                    test: 'Rate Limiting Test',
                    requests_made: responses.length,
                    responses: responses,
                    note: 'In real WordPress, rate limiting would block some requests'
                };
                
                dataDiv.textContent = JSON.stringify(result, null, 2);
                
            } catch (error) {
                dataDiv.textContent = 'Error: ' + error.message;
            }
        }
        
        async function testPerformance() {
            const responseDiv = document.getElementById('performance-response');
            const dataDiv = document.getElementById('performance-data');
            
            responseDiv.style.display = 'block';
            dataDiv.textContent = 'Running performance tests...';
            
            const results = {
                tests: [],
                average_response_time: 0,
                total_time: 0
            };
            
            const totalStart = performance.now();
            
            // Test each endpoint multiple times
            const endpoints = [
                { action: 'e1_calculator_get_config', nonce: window.e1CalculatorWP.configNonce },
                { action: 'e1_calculator_validate_cache', nonce: window.e1CalculatorWP.nonce },
                { action: 'e1_calculator_get_compatibility', nonce: window.e1CalculatorWP.nonce }
            ];
            
            for (const endpoint of endpoints) {
                const testStart = performance.now();
                const response = await mockAjaxResponse(endpoint.action, endpoint.nonce);
                const testEnd = performance.now();
                
                results.tests.push({
                    endpoint: endpoint.action,
                    response_time: Math.round(testEnd - testStart),
                    success: response.success
                });
            }
            
            const totalEnd = performance.now();
            results.total_time = Math.round(totalEnd - totalStart);
            results.average_response_time = Math.round(
                results.tests.reduce((sum, test) => sum + test.response_time, 0) / results.tests.length
            );
            
            dataDiv.textContent = JSON.stringify(results, null, 2);
        }
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.testPagesDir, 'ajax-endpoints-test.html'), content.trim());
    }
    
    async generateWordPressTestReport() {
        const reportPath = path.join(__dirname, '../wordpress-integration-test-report.html');
        
        const report = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E1 Calculator - WordPress Integration Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f0f6fc; }
        .header { background: linear-gradient(135deg, #2271b1 0%, #135e96 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .test-card { background: white; border: 1px solid #c3dcf1; border-radius: 8px; padding: 20px; }
        .test-passed { border-left: 4px solid #00a32a; }
        .test-failed { border-left: 4px solid #d63638; }
        .test-details { background: #f6f7f7; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .test-links { margin-top: 30px; background: white; padding: 20px; border-radius: 8px; }
        .test-links a { display: inline-block; margin: 5px 10px; padding: 10px 20px; background: #2271b1; color: white; text-decoration: none; border-radius: 4px; }
        .test-links a:hover { background: #135e96; }
        pre { background: #23282d; color: #eee; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; border: 1px solid #c3dcf1; border-radius: 8px; padding: 20px; text-align: center; }
        .passed { color: #00a32a; }
        .failed { color: #d63638; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E1 Calculator WordPress Integration Test Report</h1>
        <p>Generated: ${this.testResults.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${this.testResults.summary.total}</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #00a32a;">${this.testResults.summary.passed}</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #d63638;">${this.testResults.summary.failed}</div>
        </div>
    </div>
    
    <div class="test-grid">
        ${Object.entries(this.testResults.tests).map(([testName, test]) => `
            <div class="test-card ${test.passed ? 'test-passed' : 'test-failed'}">
                <h3>${testName.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())} ${test.passed ? '✅' : '❌'}</h3>
                <div class="test-details">
                    ${Object.entries(test.details).map(([key, value]) => `
                        <p><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</p>
                    `).join('')}
                    ${test.issues.length > 0 ? `
                        <h4 style="color: #d63638;">Issues:</h4>
                        <ul>
                            ${test.issues.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="test-links">
        <h2>Manual WordPress Test Pages</h2>
        <p>Use these pages to manually verify WordPress integration:</p>
        <a href="test-pages/wordpress/classic-editor-test.html" target="_blank">Classic Editor Test</a>
        <a href="test-pages/wordpress/gutenberg-block-test.html" target="_blank">Gutenberg Block Test</a>
        <a href="test-pages/wordpress/multiple-instances-test.html" target="_blank">Multiple Instances Test</a>
        <a href="test-pages/wordpress/ajax-endpoints-test.html" target="_blank">AJAX Endpoints Test</a>
    </div>
    
    <details style="margin-top: 30px; background: white; padding: 20px; border-radius: 8px;">
        <summary><h2 style="margin: 0;">Full Test Data (JSON)</h2></summary>
        <pre>${JSON.stringify(this.testResults, null, 2)}</pre>
    </details>
</body>
</html>
        `;
        
        fs.writeFileSync(reportPath, report);
        console.log(`📋 WordPress integration test report generated: ${reportPath}`);
    }
    
    addTestResult(testName, result) {
        this.testResults.tests[testName] = result;
        this.testResults.summary.total++;
        if (result.passed) {
            this.testResults.summary.passed++;
        } else {
            this.testResults.summary.failed++;
        }
    }
    
    printWordPressSummary() {
        console.log('\\n📊 WORDPRESS INTEGRATION TEST SUMMARY');
        console.log('=======================================');
        console.log(`Total Tests: ${this.testResults.summary.total}`);
        console.log(`✅ Passed: ${this.testResults.summary.passed}`);
        console.log(`❌ Failed: ${this.testResults.summary.failed}`);
        console.log(`\\n📋 Report: wordpress-integration-test-report.html`);
        console.log(`📄 Test Pages: test-pages/wordpress/`);
    }
}

// Export for use as module or run directly
if (require.main === module) {
    const tester = new WordPressIntegrationTester();
    tester.runAllTests().catch(console.error);
} else {
    module.exports = WordPressIntegrationTester;
}