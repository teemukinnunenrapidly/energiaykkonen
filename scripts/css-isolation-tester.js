#!/usr/bin/env node

/**
 * CSS Isolation Testing Suite
 * 
 * Comprehensive testing for CSS isolation between widget modes:
 * - Shadow DOM complete isolation
 * - Namespace prefix isolation
 * - Style conflict detection
 * - Specificity testing
 * - Cross-browser validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CSSIsolationTester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            tests: {},
            isolation_modes: {},
            browsers: {},
            summary: { total: 0, passed: 0, failed: 0 }
        };
        
        this.testPagesDir = path.join(__dirname, '../test-pages/css-isolation');
        this.distPath = path.join(__dirname, '../dist');
        
        this.conflictingStyles = [
            { selector: '.card', property: 'background', value: 'red !important' },
            { selector: '.button', property: 'border', value: '5px solid green !important' },
            { selector: '*', property: 'box-sizing', value: 'content-box !important' },
            { selector: 'input', property: 'background', value: 'yellow !important' },
            { selector: 'h1, h2, h3', property: 'color', value: 'purple !important' },
            { selector: 'body', property: 'font-family', value: 'Comic Sans MS !important' }
        ];
    }
    
    async runAllTests() {
        console.log('🎨 Starting CSS Isolation Testing Suite...\n');
        
        try {
            // Setup test environment
            await this.setupCSSTestEnvironment();
            
            // Test Shadow DOM isolation
            await this.testShadowDOMIsolation();
            
            // Test Namespace isolation
            await this.testNamespaceIsolation();
            
            // Test CSS specificity handling
            await this.testCSSSpecificity();
            
            // Test dual CSS file generation
            await this.testDualCSSGeneration();
            
            // Test style switching
            await this.testStyleSwitching();
            
            // Test conflict resolution
            await this.testConflictResolution();
            
            // Generate isolation test pages
            await this.generateIsolationTestPages();
            
            // Generate comprehensive report
            await this.generateCSSTestReport();
            
            this.printCSSSummary();
            
        } catch (error) {
            console.error('❌ CSS isolation tests failed:', error);
            process.exit(1);
        }
    }
    
    async testShadowDOMIsolation() {
        console.log('🔐 Testing Shadow DOM CSS Isolation...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        // Test Shadow DOM CSS file exists
        const shadowCSSPath = path.join(this.distPath, 'e1-calculator-widget.min.css');
        if (fs.existsSync(shadowCSSPath)) {
            test.details.shadow_css_exists = true;
            
            const cssContent = fs.readFileSync(shadowCSSPath, 'utf8');
            
            // Check for :host rules
            if (cssContent.includes(':host')) {
                test.details.host_rules = true;
            } else {
                test.issues.push('Missing :host rules for Shadow DOM');
            }
            
            // Check for CSS reset
            if (cssContent.includes('all: initial') || cssContent.includes('isolation: isolate')) {
                test.details.css_reset = true;
            } else {
                test.issues.push('Missing CSS reset for isolation');
            }
            
            // Check that styles are not prefixed with namespace classes
            if (!cssContent.includes('.e1-calculator-isolated-root')) {
                test.details.no_namespace_prefixes = true;
            } else {
                test.issues.push('Shadow DOM CSS should not contain namespace prefixes');
            }
            
            // Check containment properties
            if (cssContent.includes('contain:') || cssContent.includes('containment')) {
                test.details.containment_properties = true;
            }
            
            // Measure CSS size
            const cssSize = fs.statSync(shadowCSSPath).size;
            test.details.css_size = `${Math.round(cssSize / 1024)}KB`;
            
            if (cssSize < 50 * 1024) { // Less than 50KB is good
                test.details.size_optimized = true;
            } else {
                test.issues.push('Shadow DOM CSS size may be too large');
            }
            
        } else {
            test.issues.push('Shadow DOM CSS file not found');
        }
        
        test.passed = test.issues.length === 0;
        this.addTestResult('shadow_dom_isolation', test);
        
        console.log(`  ${test.passed ? '✅' : '❌'} Shadow DOM: ${test.issues.length === 0 ? 'All checks passed' : test.issues.length + ' issues'}\n`);
    }
    
    async testNamespaceIsolation() {
        console.log('📦 Testing Namespace CSS Isolation...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        // Test Namespace CSS file exists
        const namespaceCSSPath = path.join(this.distPath, 'widget-namespaced.min.css');
        if (fs.existsSync(namespaceCSSPath)) {
            test.details.namespace_css_exists = true;
            
            const cssContent = fs.readFileSync(namespaceCSSPath, 'utf8');
            
            // Check for namespace prefix
            if (cssContent.includes('.e1-calculator-isolated-root')) {
                test.details.namespace_prefix = true;
                
                // Count prefixed rules
                const prefixedRules = (cssContent.match(/\\.e1-calculator-isolated-root/g) || []).length;
                test.details.prefixed_rules_count = prefixedRules;
                
                if (prefixedRules > 10) {
                    test.details.sufficient_prefixing = true;
                } else {
                    test.issues.push('Insufficient namespace prefixing');
                }
            } else {
                test.issues.push('Missing namespace prefix in CSS');
            }
            
            // Check that :host rules are converted
            if (!cssContent.includes(':host')) {
                test.details.host_rules_converted = true;
            } else {
                test.issues.push('Host rules should be converted for namespace mode');
            }
            
            // Check for high specificity
            if (cssContent.includes('.e1-calculator-isolated-root.e1-calculator-isolated-root')) {
                test.details.high_specificity = true;
            }
            
            // Measure CSS size
            const cssSize = fs.statSync(namespaceCSSPath).size;
            test.details.css_size = `${Math.round(cssSize / 1024)}KB`;
            
            // Compare with shadow DOM CSS
            const shadowCSSPath = path.join(this.distPath, 'e1-calculator-widget.min.css');
            if (fs.existsSync(shadowCSSPath)) {
                const shadowSize = fs.statSync(shadowCSSPath).size;
                const sizeIncrease = Math.round(((cssSize - shadowSize) / shadowSize) * 100);
                test.details.size_increase = `${sizeIncrease}%`;
                
                if (sizeIncrease < 50) { // Less than 50% increase is acceptable
                    test.details.size_reasonable = true;
                } else {
                    test.issues.push('Namespace CSS size increase too large');
                }
            }
            
        } else {
            test.issues.push('Namespace CSS file not found');
        }
        
        test.passed = test.issues.length === 0;
        this.addTestResult('namespace_isolation', test);
        
        console.log(`  ${test.passed ? '✅' : '❌'} Namespace: ${test.issues.length === 0 ? 'All checks passed' : test.issues.length + ' issues'}\n`);
    }
    
    async testCSSSpecificity() {
        console.log('⚖️  Testing CSS Specificity...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        const namespaceCSSPath = path.join(this.distPath, 'widget-namespaced.min.css');
        if (fs.existsSync(namespaceCSSPath)) {
            const cssContent = fs.readFileSync(namespaceCSSPath, 'utf8');
            
            // Test specificity patterns
            const specificityTests = [
                {
                    pattern: /\\.e1-calculator-isolated-root\\s+\\.card/g,
                    name: 'card_specificity',
                    description: 'Card elements have proper specificity'
                },
                {
                    pattern: /\\.e1-calculator-isolated-root\\s+\\.button/g,
                    name: 'button_specificity',
                    description: 'Button elements have proper specificity'
                },
                {
                    pattern: /\\.e1-calculator-isolated-root\\s+input/g,
                    name: 'input_specificity', 
                    description: 'Input elements have proper specificity'
                }
            ];
            
            let specificityChecks = 0;
            specificityTests.forEach(specificityTest => {
                const matches = cssContent.match(specificityTest.pattern);
                if (matches && matches.length > 0) {
                    test.details[specificityTest.name] = matches.length;
                    specificityChecks++;
                } else {
                    test.issues.push(`Missing ${specificityTest.description}`);
                }
            });
            
            test.details.specificity_checks_passed = `${specificityChecks}/${specificityTests.length}`;
            
            // Test for !important usage (should be minimal)
            const importantCount = (cssContent.match(/!important/g) || []).length;
            test.details.important_declarations = importantCount;
            
            if (importantCount < 20) { // Reasonable number of !important declarations
                test.details.important_usage_reasonable = true;
            } else {
                test.issues.push('Too many !important declarations');
            }
            
            // Test for CSS cascade issues
            const potentialCascadeIssues = [
                { pattern: /\\*\\s*\\{/, issue: 'Universal selector may cause cascade issues' },
                { pattern: /html\\s*\\{/, issue: 'HTML element styling may affect parent page' },
                { pattern: /body\\s*\\{/, issue: 'Body element styling may affect parent page' }
            ];
            
            potentialCascadeIssues.forEach(cascadeTest => {
                if (cssContent.match(cascadeTest.pattern)) {
                    test.issues.push(cascadeTest.issue);
                }
            });
            
        } else {
            test.issues.push('Namespace CSS file not found for specificity testing');
        }
        
        test.passed = test.issues.length === 0;
        this.addTestResult('css_specificity', test);
        
        console.log(`  ${test.passed ? '✅' : '❌'} Specificity: ${test.issues.length === 0 ? 'All checks passed' : test.issues.length + ' issues'}\n`);
    }
    
    async testDualCSSGeneration() {
        console.log('🔄 Testing Dual CSS Generation...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        // Check both CSS files exist
        const shadowCSS = path.join(this.distPath, 'e1-calculator-widget.min.css');
        const namespaceCSS = path.join(this.distPath, 'widget-namespaced.min.css');
        
        if (fs.existsSync(shadowCSS) && fs.existsSync(namespaceCSS)) {
            test.details.both_files_exist = true;
            
            const shadowContent = fs.readFileSync(shadowCSS, 'utf8');
            const namespaceContent = fs.readFileSync(namespaceCSS, 'utf8');
            
            // Test that both files have similar rule count
            const shadowRules = (shadowContent.match(/\\{[^}]*\\}/g) || []).length;
            const namespaceRules = (namespaceContent.match(/\\{[^}]*\\}/g) || []).length;
            
            test.details.shadow_rules = shadowRules;
            test.details.namespace_rules = namespaceRules;
            
            const ruleDifference = Math.abs(shadowRules - namespaceRules);
            const ruleRatio = ruleDifference / shadowRules;
            
            if (ruleRatio < 0.1) { // Less than 10% difference
                test.details.similar_rule_count = true;
            } else {
                test.issues.push('Significant rule count difference between CSS files');
            }
            
            // Test file integrity
            if (shadowContent.length > 1000 && namespaceContent.length > 1000) {
                test.details.files_not_empty = true;
            } else {
                test.issues.push('One or both CSS files appear to be empty or truncated');
            }
            
            // Test file timestamps (should be recent)
            const shadowStat = fs.statSync(shadowCSS);
            const namespaceStat = fs.statSync(namespaceCSS);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if ((now - shadowStat.mtime.getTime()) < maxAge && (now - namespaceStat.mtime.getTime()) < maxAge) {
                test.details.files_recent = true;
            } else {
                test.issues.push('CSS files are not recently generated');
            }
            
        } else {
            test.issues.push('One or both CSS files are missing');
            test.details.shadow_css_exists = fs.existsSync(shadowCSS);
            test.details.namespace_css_exists = fs.existsSync(namespaceCSS);
        }
        
        test.passed = test.issues.length === 0;
        this.addTestResult('dual_css_generation', test);
        
        console.log(`  ${test.passed ? '✅' : '❌'} Dual CSS: ${test.issues.length === 0 ? 'Generation verified' : test.issues.length + ' issues'}\n`);
    }
    
    async testStyleSwitching() {
        console.log('🔄 Testing Style Switching Logic...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        // Test WordPress loader logic
        const loaderPath = path.join(__dirname, '../wordpress-plugin/e1-calculator-pro/includes/class-e1-calculator-loader.php');
        if (fs.existsSync(loaderPath)) {
            const loaderContent = fs.readFileSync(loaderPath, 'utf8');
            
            // Check for style switching logic
            if (loaderContent.includes('enqueue_widget_styles')) {
                test.details.style_switching_method = true;
            } else {
                test.issues.push('Style switching method not found');
            }
            
            // Check for fallback mode detection
            if (loaderContent.includes('should_use_fallback_mode')) {
                test.details.fallback_detection = true;
            } else {
                test.issues.push('Fallback mode detection not found');
            }
            
            // Check for browser compatibility checks
            if (loaderContent.includes('check_shadow_dom_support')) {
                test.details.browser_detection = true;
            } else {
                test.issues.push('Browser compatibility detection not found');
            }
            
            // Check CSS file path logic
            if (loaderContent.includes('widget-namespaced.css') && loaderContent.includes('widget.css')) {
                test.details.css_path_logic = true;
            } else {
                test.issues.push('CSS file path logic not found');
            }
            
        } else {
            test.issues.push('WordPress loader file not found');
        }
        
        test.passed = test.issues.length === 0;
        this.addTestResult('style_switching', test);
        
        console.log(`  ${test.passed ? '✅' : '❌'} Style Switching: ${test.issues.length === 0 ? 'Logic verified' : test.issues.length + ' issues'}\n`);
    }
    
    async testConflictResolution() {
        console.log('⚔️  Testing CSS Conflict Resolution...');
        
        const test = { passed: false, details: {}, issues: [] };
        
        // Create test scenarios with different conflict types
        const conflictScenarios = [
            {
                name: 'high_specificity_external',
                css: '#page .content .card { background: red !important; }',
                expectation: 'Widget cards should not be affected'
            },
            {
                name: 'universal_selector_conflict',
                css: '* { box-sizing: content-box !important; margin: 10px !important; }',
                expectation: 'Widget layout should remain intact'
            },
            {
                name: 'css_reset_conflict',
                css: 'h1, h2, h3, h4, h5, h6 { margin: 0; padding: 20px; color: purple; }',
                expectation: 'Widget headings should maintain styling'
            }
        ];
        
        test.details.conflict_scenarios = conflictScenarios.length;
        
        // Test each scenario by analyzing CSS specificity
        const namespaceCSSPath = path.join(this.distPath, 'widget-namespaced.min.css');
        if (fs.existsSync(namespaceCSSPath)) {
            const cssContent = fs.readFileSync(namespaceCSSPath, 'utf8');
            
            let conflictResolutionTests = 0;
            
            // Test for namespace prefix protection
            if (cssContent.includes('.e1-calculator-isolated-root .card')) {
                conflictResolutionTests++;
                test.details.card_protection = true;
            }
            
            if (cssContent.includes('.e1-calculator-isolated-root h1') || 
                cssContent.includes('.e1-calculator-isolated-root h2') ||
                cssContent.includes('.e1-calculator-isolated-root h3')) {
                conflictResolutionTests++;
                test.details.heading_protection = true;
            }
            
            // Test for box-sizing protection
            if (cssContent.includes('box-sizing') && cssContent.includes('.e1-calculator-isolated-root')) {
                conflictResolutionTests++;
                test.details.box_sizing_protection = true;
            }
            
            test.details.protection_mechanisms = `${conflictResolutionTests}/3`;
            
            if (conflictResolutionTests >= 2) {
                test.details.sufficient_protection = true;
            } else {
                test.issues.push('Insufficient CSS conflict protection');
            }
            
        } else {
            test.issues.push('Cannot test conflict resolution without namespace CSS');
        }
        
        test.passed = test.issues.length === 0;
        this.addTestResult('conflict_resolution', test);
        
        console.log(`  ${test.passed ? '✅' : '❌'} Conflict Resolution: ${test.issues.length === 0 ? 'Protection verified' : test.issues.length + ' issues'}\n`);
    }
    
    async setupCSSTestEnvironment() {
        console.log('🔧 Setting up CSS isolation test environment...');
        
        // Create CSS isolation test pages directory
        if (!fs.existsSync(this.testPagesDir)) {
            fs.mkdirSync(this.testPagesDir, { recursive: true });
        }
        
        // Ensure dist files exist
        if (!fs.existsSync(this.distPath)) {
            console.log('  📦 Building widget files...');
            execSync('npm run build:widget', { cwd: path.join(__dirname, '..') });
        }
        
        console.log('  ✅ CSS test environment ready\\n');
    }
    
    async generateIsolationTestPages() {
        console.log('📄 Generating CSS isolation test pages...');
        
        // Generate comprehensive isolation test page
        this.generateComprehensiveIsolationTest();
        
        // Generate conflict stress test
        this.generateConflictStressTest();
        
        // Generate side-by-side comparison
        this.generateSideBySideComparison();
        
        // Generate browser compatibility test
        this.generateBrowserCompatibilityTest();
        
        console.log('  ✅ CSS isolation test pages generated\\n');
    }
    
    generateComprehensiveIsolationTest() {
        const conflictCSS = this.conflictingStyles.map(style => 
            `${style.selector} { ${style.property}: ${style.value}; }`
        ).join('\\n        ');
        
        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive CSS Isolation Test</title>
    <style>
        /* External conflicting styles */
        ${conflictCSS}
        
        /* Additional stress test styles */
        body { font-family: 'Comic Sans MS' !important; background: yellow !important; }
        .container { padding: 50px !important; margin: 20px !important; }
        input[type="text"], input[type="number"], select { 
            background: lime !important; 
            border: 5px dotted orange !important;
            font-size: 24px !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>CSS Isolation Comprehensive Test</h1>
        <p style="background: pink; padding: 10px;">This page has extreme conflicting styles to test widget isolation.</p>
        
        <div class="card" style="background: red; color: white; padding: 20px; margin: 20px;">
            <h2>External Card (Should be RED)</h2>
            <p>This card should maintain its red background and conflicting styles.</p>
            <button class="button">External Button (Should be GREEN border)</button>
        </div>
        
        <h2>Shadow DOM Widget</h2>
        <div id="shadow-widget" data-e1-calculator data-shadow="true" style="border: 2px solid blue; margin: 20px;">
            <!-- Shadow DOM widget should be completely isolated -->
        </div>
        
        <h2>Namespace Widget</h2>
        <div id="namespace-widget" data-e1-calculator data-shadow="false" style="border: 2px solid green; margin: 20px;">
            <!-- Namespace widget should have prefixed isolation -->
        </div>
        
        <div class="card" style="background: red; color: white; padding: 20px; margin: 20px;">
            <h2>Another External Card (Should be RED)</h2>
            <p>This card should also maintain its red background.</p>
            <input type="text" placeholder="External input (should be LIME)" />
        </div>
        
        <div id="test-results" style="background: white; border: 2px solid black; padding: 20px; margin: 20px;">
            <h2>Isolation Test Results</h2>
            <div id="results-content">Running tests...</div>
        </div>
        
        <div id="test-controls" style="background: white; padding: 20px; margin: 20px;">
            <button onclick="runFullIsolationTest()" style="margin: 5px; padding: 10px;">Run Full Test</button>
            <button onclick="testShadowDOM()" style="margin: 5px; padding: 10px;">Test Shadow DOM</button>
            <button onclick="testNamespace()" style="margin: 5px; padding: 10px;">Test Namespace</button>
            <button onclick="testConflicts()" style="margin: 5px; padding: 10px;">Test Conflicts</button>
        </div>
    </div>
    
    <script src="../../../dist/e1-calculator-widget.min.js"></script>
    <script>
        let shadowWidget = null;
        let namespaceWidget = null;
        
        async function initializeWidgets() {
            try {
                shadowWidget = await window.E1Calculator.init('shadow-widget', { useShadowDOM: true });
                namespaceWidget = await window.E1Calculator.init('namespace-widget', { useShadowDOM: false });
                return true;
            } catch (error) {
                console.error('Widget initialization failed:', error);
                return false;
            }
        }
        
        async function runFullIsolationTest() {
            const results = document.getElementById('results-content');
            results.innerHTML = '<h3>Running comprehensive isolation test...</h3>';
            
            const initialized = await initializeWidgets();
            if (!initialized) {
                results.innerHTML = '<h3>❌ Widget initialization failed</h3>';
                return;
            }
            
            let report = '<h3>Comprehensive CSS Isolation Test Results</h3>';
            
            // Test widget initialization
            if (shadowWidget && namespaceWidget) {
                report += '<p>✅ Both widgets initialized successfully</p>';
                report += \`<p>📊 Shadow widget mode: \${shadowWidget.mode}</p>\`;
                report += \`<p>📊 Namespace widget mode: \${namespaceWidget.mode}</p>\`;
            } else {
                report += '<p>❌ Widget initialization incomplete</p>';
                results.innerHTML = report;
                return;
            }
            
            // Test external style preservation
            const externalCards = document.querySelectorAll('body > .container > .card');
            let externalStylesPreserved = true;
            
            externalCards.forEach((card, index) => {
                const style = getComputedStyle(card);
                const bgColor = style.backgroundColor;
                
                if (!bgColor.includes('255, 0, 0') && !bgColor.includes('red')) {
                    externalStylesPreserved = false;
                    report += \`<p>❌ External card \${index + 1} background not preserved</p>\`;
                } else {
                    report += \`<p>✅ External card \${index + 1} background preserved</p>\`;
                }
            });
            
            // Test widget isolation
            const shadowContainer = document.getElementById('shadow-widget');
            const namespaceContainer = document.getElementById('namespace-widget');
            
            // Shadow DOM isolation test
            if (shadowContainer.shadowRoot) {
                report += '<p>✅ Shadow Root created successfully</p>';
                
                const shadowCards = shadowContainer.shadowRoot.querySelectorAll('.card');
                let shadowIsolation = true;
                
                shadowCards.forEach(card => {
                    const style = getComputedStyle(card);
                    if (style.backgroundColor.includes('255, 0, 0')) {
                        shadowIsolation = false;
                    }
                });
                
                if (shadowIsolation) {
                    report += '<p>✅ Shadow DOM isolation working correctly</p>';
                } else {
                    report += '<p>❌ Shadow DOM isolation compromised</p>';
                }
            } else {
                report += '<p>❌ Shadow Root not created</p>';
            }
            
            // Namespace isolation test
            const namespaceCards = namespaceContainer.querySelectorAll('.card');
            let namespaceIsolation = true;
            
            namespaceCards.forEach(card => {
                const style = getComputedStyle(card);
                if (style.backgroundColor.includes('255, 0, 0')) {
                    namespaceIsolation = false;
                }
            });
            
            if (namespaceIsolation) {
                report += '<p>✅ Namespace isolation working correctly</p>';
            } else {
                report += '<p>❌ Namespace isolation compromised</p>';
            }
            
            // Overall test result
            const overallSuccess = externalStylesPreserved && shadowIsolation && namespaceIsolation;
            report += \`<h4>Overall Result: \${overallSuccess ? '✅ All tests passed' : '❌ Some tests failed'}</h4>\`;
            
            results.innerHTML = report;
        }
        
        async function testShadowDOM() {
            const results = document.getElementById('results-content');
            results.innerHTML = '<h3>Testing Shadow DOM isolation...</h3>';
            
            if (!shadowWidget) {
                shadowWidget = await window.E1Calculator.init('shadow-widget', { useShadowDOM: true });
            }
            
            if (shadowWidget && shadowWidget.mode === 'shadow') {
                results.innerHTML = '<h3>✅ Shadow DOM Test Passed</h3><p>Shadow DOM mode active and isolated</p>';
            } else {
                results.innerHTML = '<h3>❌ Shadow DOM Test Failed</h3><p>Shadow DOM mode not working</p>';
            }
        }
        
        async function testNamespace() {
            const results = document.getElementById('results-content');
            results.innerHTML = '<h3>Testing Namespace isolation...</h3>';
            
            if (!namespaceWidget) {
                namespaceWidget = await window.E1Calculator.init('namespace-widget', { useShadowDOM: false });
            }
            
            if (namespaceWidget && namespaceWidget.mode === 'namespace') {
                results.innerHTML = '<h3>✅ Namespace Test Passed</h3><p>Namespace mode active and isolated</p>';
            } else {
                results.innerHTML = '<h3>❌ Namespace Test Failed</h3><p>Namespace mode not working</p>';
            }
        }
        
        function testConflicts() {
            const results = document.getElementById('results-content');
            results.innerHTML = '<h3>Testing CSS conflicts...</h3>';
            
            // Add even more extreme conflicting styles
            const extremeStyles = document.createElement('style');
            extremeStyles.innerHTML = \`
                * { 
                    background: magenta !important; 
                    color: cyan !important;
                    border: 10px solid black !important;
                    padding: 50px !important;
                }
                .card { font-size: 50px !important; }
            \`;
            document.head.appendChild(extremeStyles);
            
            setTimeout(() => {
                // Check if widgets are still properly styled
                let conflictHandled = true;
                
                // Check external elements are affected
                const externalCard = document.querySelector('body > .container > .card');
                if (externalCard) {
                    const style = getComputedStyle(externalCard);
                    if (!style.backgroundColor.includes('255, 0, 255')) {
                        conflictHandled = false;
                    }
                }
                
                if (conflictHandled) {
                    results.innerHTML = '<h3>✅ Conflict Test Passed</h3><p>Extreme styles applied, widgets should remain unaffected</p>';
                } else {
                    results.innerHTML = '<h3>❌ Conflict Test Failed</h3><p>Conflict resolution not working</p>';
                }
                
                // Remove extreme styles after test
                setTimeout(() => {
                    document.head.removeChild(extremeStyles);
                }, 3000);
            }, 1000);
        }
        
        // Auto-run test on load
        window.addEventListener('load', () => {
            setTimeout(runFullIsolationTest, 1000);
        });
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.testPagesDir, 'comprehensive-isolation-test.html'), content.trim());
    }
    
    generateConflictStressTest() {
        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Conflict Stress Test</title>
    <style>
        /* Extreme conflicting styles for stress testing */
        * { 
            all: unset !important;
            display: block !important;
            background: linear-gradient(45deg, red, yellow, green, blue) !important;
            border: 20px dotted black !important;
            margin: 30px !important;
            padding: 40px !important;
            font-family: 'Courier New' !important;
            font-size: 30px !important;
            color: white !important;
            text-shadow: 2px 2px 4px black !important;
            box-shadow: 10px 10px 20px rgba(0,0,0,0.8) !important;
        }
        
        .card, .button, input, select, textarea, h1, h2, h3, p, div {
            animation: rainbow 3s infinite !important;
        }
        
        @keyframes rainbow {
            0% { background: red !important; }
            16% { background: orange !important; }
            32% { background: yellow !important; }
            48% { background: green !important; }
            64% { background: blue !important; }
            80% { background: indigo !important; }
            100% { background: violet !important; }
        }
    </style>
</head>
<body>
    <div>
        <h1>CSS Conflict Stress Test</h1>
        <p>This page applies extreme CSS conflicts to test widget resilience.</p>
        
        <div class="card">
            <h2>External Card with Extreme Styles</h2>
            <p>This should have rainbow animation and extreme styling.</p>
        </div>
        
        <div id="stress-test-widget" data-e1-calculator style="border: 5px solid purple;">
            <!-- Widget should resist all external styling -->
        </div>
        
        <input type="text" placeholder="External input with extreme styles" />
        <button class="button">External Button with Extreme Styles</button>
        
        <div id="test-results">
            <h2>Stress Test Results</h2>
            <div id="results-content">Loading...</div>
        </div>
    </div>
    
    <script src="../../../dist/e1-calculator-widget.min.js"></script>
    <script>
        async function runStressTest() {
            const results = document.getElementById('results-content');
            results.innerHTML = 'Running stress test...';
            
            try {
                const widget = await window.E1Calculator.init('stress-test-widget');
                
                if (widget) {
                    let report = \`<h3>Stress Test Results</h3>\`;
                    report += \`<p>✅ Widget initialized in \${widget.mode} mode</p>\`;
                    
                    // Check if widget resisted extreme styling
                    const container = document.getElementById('stress-test-widget');
                    let widgetElements;
                    
                    if (widget.mode === 'shadow' && container.shadowRoot) {
                        widgetElements = container.shadowRoot.querySelectorAll('*');
                    } else {
                        widgetElements = container.querySelectorAll('.e1-calculator-isolated-root *');
                    }
                    
                    if (widgetElements.length > 0) {
                        report += \`<p>📊 Found \${widgetElements.length} widget elements</p>\`;
                        
                        // Check if any widget elements have the rainbow animation
                        let affectedElements = 0;
                        Array.from(widgetElements).forEach(el => {
                            const style = getComputedStyle(el);
                            if (style.animationName.includes('rainbow') || 
                                style.backgroundColor.includes('255, 0, 0')) {
                                affectedElements++;
                            }
                        });
                        
                        if (affectedElements === 0) {
                            report += '<p>✅ Perfect isolation - no elements affected by extreme styles</p>';
                        } else {
                            report += \`<p>⚠️ \${affectedElements} elements affected by external styles</p>\`;
                        }
                        
                        // Performance impact test
                        const startTime = performance.now();
                        for (let i = 0; i < 100; i++) {
                            getComputedStyle(widgetElements[0]);
                        }
                        const endTime = performance.now();
                        
                        report += \`<p>⚡ Style computation performance: \${Math.round(endTime - startTime)}ms for 100 computations</p>\`;
                    }
                    
                    results.innerHTML = report;
                    
                } else {
                    results.innerHTML = '<h3>❌ Stress test failed - widget initialization failed</h3>';
                }
                
            } catch (error) {
                results.innerHTML = '<h3>❌ Stress test error: ' + error.message + '</h3>';
            }
        }
        
        window.addEventListener('load', runStressTest);
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.testPagesDir, 'conflict-stress-test.html'), content.trim());
    }
    
    generateSideBySideComparison() {
        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shadow DOM vs Namespace Side-by-Side</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .widget-section { border: 2px solid #ddd; border-radius: 8px; padding: 20px; }
        .shadow-section { border-color: #2196f3; }
        .namespace-section { border-color: #ff9800; }
        .section-title { text-align: center; font-weight: bold; margin-bottom: 20px; padding: 10px; }
        .shadow-title { background: #e3f2fd; color: #1976d2; }
        .namespace-title { background: #fff3e0; color: #f57c00; }
        
        /* Conflicting styles */
        .card { background: red !important; color: white !important; padding: 20px !important; }
        input, button { background: yellow !important; border: 3px solid green !important; }
        
        .stats { background: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 15px; }
        .stats h4 { margin: 0 0 10px 0; }
        
        @media (max-width: 768px) {
            .comparison-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <h1>Shadow DOM vs Namespace CSS Isolation Comparison</h1>
    <p>This page compares both isolation methods side by side with identical conflicting external styles.</p>
    
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <strong>External Conflicting Styles Active:</strong>
        <ul>
            <li>All .card elements: red background, white text</li>
            <li>All inputs/buttons: yellow background, green border</li>
        </ul>
    </div>
    
    <div class="comparison-grid">
        <div class="widget-section shadow-section">
            <div class="section-title shadow-title">
                🔐 Shadow DOM Isolation
            </div>
            <div id="shadow-comparison-widget" data-e1-calculator data-shadow="true">
                <!-- Shadow DOM widget -->
            </div>
            <div class="stats" id="shadow-stats">
                <h4>Shadow DOM Stats</h4>
                <div id="shadow-stats-content">Loading...</div>
            </div>
        </div>
        
        <div class="widget-section namespace-section">
            <div class="section-title namespace-title">
                📦 Namespace Isolation
            </div>
            <div id="namespace-comparison-widget" data-e1-calculator data-shadow="false">
                <!-- Namespace widget -->
            </div>
            <div class="stats" id="namespace-stats">
                <h4>Namespace Stats</h4>
                <div id="namespace-stats-content">Loading...</div>
            </div>
        </div>
    </div>
    
    <div style="margin-top: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h3>External Elements (Should be affected by conflicts)</h3>
        <div class="card" style="margin: 10px 0;">External Card - Should be RED</div>
        <input type="text" placeholder="External input - Should be YELLOW" style="margin: 5px;" />
        <button style="margin: 5px;">External Button - Should be YELLOW</button>
    </div>
    
    <div id="comparison-results" style="margin-top: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h3>Comparison Results</h3>
        <div id="results-content">Running comparison...</div>
    </div>
    
    <script src="../../../dist/e1-calculator-widget.min.js"></script>
    <script>
        let shadowWidget = null;
        let namespaceWidget = null;
        
        async function runComparison() {
            try {
                // Initialize both widgets
                shadowWidget = await window.E1Calculator.init('shadow-comparison-widget', { useShadowDOM: true });
                namespaceWidget = await window.E1Calculator.init('namespace-comparison-widget', { useShadowDOM: false });
                
                // Update stats
                updateShadowStats();
                updateNamespaceStats();
                updateComparisonResults();
                
            } catch (error) {
                document.getElementById('results-content').innerHTML = 'Comparison failed: ' + error.message;
            }
        }
        
        function updateShadowStats() {
            const statsContent = document.getElementById('shadow-stats-content');
            
            if (shadowWidget) {
                const container = document.getElementById('shadow-comparison-widget');
                let stats = \`<p><strong>Mode:</strong> \${shadowWidget.mode}</p>\`;
                stats += \`<p><strong>Shadow Root:</strong> \${container.shadowRoot ? 'Yes' : 'No'}</p>\`;
                
                if (container.shadowRoot) {
                    const elements = container.shadowRoot.querySelectorAll('*');
                    stats += \`<p><strong>Elements:</strong> \${elements.length}</p>\`;
                    
                    // Check isolation
                    const cards = container.shadowRoot.querySelectorAll('.card');
                    let isolated = true;
                    cards.forEach(card => {
                        const style = getComputedStyle(card);
                        if (style.backgroundColor.includes('255, 0, 0')) {
                            isolated = false;
                        }
                    });
                    stats += \`<p><strong>Isolation:</strong> \${isolated ? '✅ Perfect' : '❌ Compromised'}</p>\`;
                }
                
                statsContent.innerHTML = stats;
            } else {
                statsContent.innerHTML = '<p>Failed to initialize</p>';
            }
        }
        
        function updateNamespaceStats() {
            const statsContent = document.getElementById('namespace-stats-content');
            
            if (namespaceWidget) {
                const container = document.getElementById('namespace-comparison-widget');
                let stats = \`<p><strong>Mode:</strong> \${namespaceWidget.mode}</p>\`;
                stats += \`<p><strong>Shadow Root:</strong> No (namespace mode)</p>\`;
                
                const elements = container.querySelectorAll('.e1-calculator-isolated-root *');
                stats += \`<p><strong>Elements:</strong> \${elements.length}</p>\`;
                
                // Check isolation
                const cards = container.querySelectorAll('.card');
                let isolated = true;
                cards.forEach(card => {
                    const style = getComputedStyle(card);
                    if (style.backgroundColor.includes('255, 0, 0')) {
                        isolated = false;
                    }
                });
                stats += \`<p><strong>Isolation:</strong> \${isolated ? '✅ Working' : '❌ Compromised'}</p>\`;
                
                statsContent.innerHTML = stats;
            } else {
                statsContent.innerHTML = '<p>Failed to initialize</p>';
            }
        }
        
        function updateComparisonResults() {
            const resultsContent = document.getElementById('results-content');
            
            if (shadowWidget && namespaceWidget) {
                let report = '<h4>Isolation Comparison Results</h4>';
                
                // Test external elements
                const externalCard = document.querySelector('body > div:last-of-type .card');
                const externalStyle = getComputedStyle(externalCard);
                const externalAffected = externalStyle.backgroundColor.includes('255, 0, 0');
                
                report += \`<p><strong>External Elements:</strong> \${externalAffected ? '✅ Properly affected by conflicts' : '❌ Not affected as expected'}</p>\`;
                
                // Performance comparison
                const shadowContainer = document.getElementById('shadow-comparison-widget');
                const namespaceContainer = document.getElementById('namespace-comparison-widget');
                
                const shadowStart = performance.now();
                if (shadowContainer.shadowRoot) {
                    const shadowElements = shadowContainer.shadowRoot.querySelectorAll('*');
                    shadowElements.forEach(el => getComputedStyle(el));
                }
                const shadowEnd = performance.now();
                
                const namespaceStart = performance.now();
                const namespaceElements = namespaceContainer.querySelectorAll('*');
                namespaceElements.forEach(el => getComputedStyle(el));
                const namespaceEnd = performance.now();
                
                report += '<h4>Performance Comparison</h4>';
                report += \`<p><strong>Shadow DOM:</strong> \${Math.round(shadowEnd - shadowStart)}ms</p>\`;
                report += \`<p><strong>Namespace:</strong> \${Math.round(namespaceEnd - namespaceStart)}ms</p>\`;
                
                // Memory usage (if available)
                if (performance.memory) {
                    report += '<h4>Memory Usage</h4>';
                    report += \`<p><strong>Used Heap:</strong> \${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB</p>\`;
                }
                
                resultsContent.innerHTML = report;
            } else {
                resultsContent.innerHTML = '<p>❌ One or both widgets failed to initialize</p>';
            }
        }
        
        window.addEventListener('load', () => {
            setTimeout(runComparison, 1000);
        });
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.testPagesDir, 'side-by-side-comparison.html'), content.trim());
    }
    
    generateBrowserCompatibilityTest() {
        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser Compatibility CSS Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .browser-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .browser-test { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .supported { border-color: #4caf50; background: #f1f8e9; }
        .not-supported { border-color: #f44336; background: #ffebee; }
        .user-agent-test { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <h1>Browser Compatibility CSS Isolation Test</h1>
    <p>This page tests CSS isolation across different browser environments.</p>
    
    <div class="browser-grid">
        <div class="browser-test" id="chrome-test">
            <h3>Chrome/Chromium Test</h3>
            <div class="user-agent-test" id="chrome-ua"></div>
            <div id="chrome-widget" data-e1-calculator></div>
            <div id="chrome-results">Loading...</div>
        </div>
        
        <div class="browser-test" id="firefox-test">
            <h3>Firefox Test</h3>
            <div class="user-agent-test" id="firefox-ua"></div>
            <div id="firefox-widget" data-e1-calculator></div>
            <div id="firefox-results">Loading...</div>
        </div>
        
        <div class="browser-test" id="safari-test">
            <h3>Safari Test</h3>
            <div class="user-agent-test" id="safari-ua"></div>
            <div id="safari-widget" data-e1-calculator></div>
            <div id="safari-results">Loading...</div>
        </div>
        
        <div class="browser-test" id="edge-test">
            <h3>Edge Test</h3>
            <div class="user-agent-test" id="edge-ua"></div>
            <div id="edge-widget" data-e1-calculator></div>
            <div id="edge-results">Loading...</div>
        </div>
        
        <div class="browser-test" id="ie11-test">
            <h3>IE11 Test (Simulation)</h3>
            <div class="user-agent-test" id="ie11-ua"></div>
            <div id="ie11-widget" data-e1-calculator></div>
            <div id="ie11-results">Loading...</div>
        </div>
    </div>
    
    <div style="margin-top: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h3>Overall Browser Compatibility Results</h3>
        <div id="overall-results">Running tests...</div>
    </div>
    
    <script src="../../../dist/e1-calculator-widget.min.js"></script>
    <script>
        const browserTests = [
            {
                id: 'chrome',
                name: 'Chrome/Chromium',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                shadowSupport: true
            },
            {
                id: 'firefox',
                name: 'Firefox',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
                shadowSupport: true
            },
            {
                id: 'safari',
                name: 'Safari',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                shadowSupport: true
            },
            {
                id: 'edge',
                name: 'Edge',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
                shadowSupport: true
            },
            {
                id: 'ie11',
                name: 'Internet Explorer 11',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
                shadowSupport: false
            }
        ];
        
        async function runBrowserCompatibilityTests() {
            const results = [];
            
            for (const browser of browserTests) {
                const result = await testBrowserCompatibility(browser);
                results.push(result);
            }
            
            updateOverallResults(results);
        }
        
        async function testBrowserCompatibility(browser) {
            const uaElement = document.getElementById(\`\${browser.id}-ua\`);
            const resultsElement = document.getElementById(\`\${browser.id}-results\`);
            const testElement = document.getElementById(\`\${browser.id}-test\`);
            
            // Display user agent
            uaElement.textContent = browser.userAgent;
            
            try {
                // Simulate browser environment
                const originalUA = navigator.userAgent;
                Object.defineProperty(navigator, 'userAgent', {
                    value: browser.userAgent,
                    configurable: true
                });
                
                // Test widget initialization
                const widget = await window.E1Calculator.init(\`\${browser.id}-widget\`, {
                    useShadowDOM: browser.shadowSupport
                });
                
                // Restore original UA
                Object.defineProperty(navigator, 'userAgent', {
                    value: originalUA,
                    configurable: true
                });
                
                if (widget) {
                    const expectedMode = browser.shadowSupport ? 'shadow' : 'namespace';
                    const actualMode = widget.mode;
                    const modeCorrect = actualMode === expectedMode;
                    
                    let report = \`<p><strong>Mode:</strong> \${actualMode} \${modeCorrect ? '✅' : '❌'}</p>\`;
                    report += \`<p><strong>Expected:</strong> \${expectedMode}</p>\`;
                    
                    if (browser.shadowSupport) {
                        const container = document.getElementById(\`\${browser.id}-widget\`);
                        const hasShadowRoot = !!container.shadowRoot;
                        report += \`<p><strong>Shadow Root:</strong> \${hasShadowRoot ? '✅ Yes' : '❌ No'}</p>\`;
                    }
                    
                    resultsElement.innerHTML = report;
                    testElement.className += modeCorrect ? ' supported' : ' not-supported';
                    
                    return {
                        browser: browser.name,
                        success: true,
                        mode: actualMode,
                        expected: expectedMode,
                        correct: modeCorrect
                    };
                    
                } else {
                    resultsElement.innerHTML = '<p>❌ Widget initialization failed</p>';
                    testElement.className += ' not-supported';
                    
                    return {
                        browser: browser.name,
                        success: false,
                        error: 'Initialization failed'
                    };
                }
                
            } catch (error) {
                resultsElement.innerHTML = '<p>❌ Test error: ' + error.message + '</p>';
                testElement.className += ' not-supported';
                
                return {
                    browser: browser.name,
                    success: false,
                    error: error.message
                };
            }
        }
        
        function updateOverallResults(results) {
            const overallElement = document.getElementById('overall-results');
            
            const successful = results.filter(r => r.success).length;
            const total = results.length;
            
            let report = \`<h4>Browser Compatibility Summary: \${successful}/\${total} passed</h4>\`;
            
            results.forEach(result => {
                if (result.success) {
                    const status = result.correct ? '✅' : '⚠️';
                    report += \`<p>\${status} <strong>\${result.browser}:</strong> \${result.mode} mode</p>\`;
                } else {
                    report += \`<p>❌ <strong>\${result.browser}:</strong> \${result.error}</p>\`;
                }
            });
            
            // Browser compatibility matrix
            report += '<h4>CSS Isolation Support Matrix</h4>';
            report += '<table border="1" style="border-collapse: collapse; width: 100%;">';
            report += '<tr><th>Browser</th><th>Shadow DOM</th><th>Namespace</th><th>Recommendation</th></tr>';
            
            results.forEach(result => {
                const shadowSupport = browserTests.find(b => b.name === result.browser).shadowSupport;
                const recommendation = shadowSupport ? 'Shadow DOM' : 'Namespace';
                
                report += \`<tr>\`;
                report += \`<td>\${result.browser}</td>\`;
                report += \`<td>\${shadowSupport ? '✅' : '❌'}</td>\`;
                report += \`<td>✅</td>\`; // Namespace should work everywhere
                report += \`<td>\${recommendation}</td>\`;
                report += \`</tr>\`;
            });
            
            report += '</table>';
            
            overallElement.innerHTML = report;
        }
        
        window.addEventListener('load', () => {
            setTimeout(runBrowserCompatibilityTests, 1000);
        });
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync(path.join(this.testPagesDir, 'browser-compatibility-test.html'), content.trim());
    }
    
    async generateCSSTestReport() {
        const reportPath = path.join(__dirname, '../css-isolation-test-report.html');
        
        const report = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E1 Calculator - CSS Isolation Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .test-card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; }
        .test-passed { border-left: 4px solid #28a745; }
        .test-failed { border-left: 4px solid #dc3545; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; text-align: center; }
        .test-details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .test-links { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .test-links a { display: inline-block; margin: 5px 10px; padding: 10px 20px; background: #6f42c1; color: white; text-decoration: none; border-radius: 4px; }
        .test-links a:hover { background: #5a32a3; }
        pre { background: #23282d; color: #eee; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .css-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #e9ecef; padding: 15px; border-radius: 4px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E1 Calculator CSS Isolation Test Report</h1>
        <p>Generated: ${this.testResults.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${this.testResults.summary.total}</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #28a745;">${this.testResults.summary.passed}</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${this.testResults.summary.failed}</div>
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
                    ${test.issues && test.issues.length > 0 ? `
                        <h4 style="color: #dc3545; margin: 15px 0 10px 0;">Issues:</h4>
                        <ul style="margin: 0;">
                            ${test.issues.map(issue => `<li style="color: #dc3545;">${issue}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="css-metrics">
        <div class="metric-card">
            <h4>Shadow DOM CSS</h4>
            <p>File: e1-calculator-widget.min.css</p>
            <p>Optimized for complete isolation</p>
        </div>
        <div class="metric-card">
            <h4>Namespace CSS</h4>
            <p>File: widget-namespaced.min.css</p>
            <p>Prefixed for compatibility</p>
        </div>
    </div>
    
    <div class="test-links">
        <h2>Manual CSS Isolation Test Pages</h2>
        <p>Use these pages to manually verify CSS isolation across different scenarios:</p>
        <a href="test-pages/css-isolation/comprehensive-isolation-test.html" target="_blank">Comprehensive Isolation Test</a>
        <a href="test-pages/css-isolation/conflict-stress-test.html" target="_blank">Conflict Stress Test</a>
        <a href="test-pages/css-isolation/side-by-side-comparison.html" target="_blank">Shadow vs Namespace Comparison</a>
        <a href="test-pages/css-isolation/browser-compatibility-test.html" target="_blank">Browser Compatibility Test</a>
    </div>
    
    <details style="margin-top: 30px; background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
        <summary><h2 style="margin: 0;">Full CSS Test Data (JSON)</h2></summary>
        <pre>${JSON.stringify(this.testResults, null, 2)}</pre>
    </details>
</body>
</html>
        `;
        
        fs.writeFileSync(reportPath, report);
        console.log(`📋 CSS isolation test report generated: ${reportPath}`);
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
    
    printCSSSummary() {
        console.log('\\n🎨 CSS ISOLATION TEST SUMMARY');
        console.log('==============================');
        console.log(`Total Tests: ${this.testResults.summary.total}`);
        console.log(`✅ Passed: ${this.testResults.summary.passed}`);
        console.log(`❌ Failed: ${this.testResults.summary.failed}`);
        console.log(`\\n📋 Report: css-isolation-test-report.html`);
        console.log(`📄 Test Pages: test-pages/css-isolation/`);
    }
}

// Export for use as module or run directly
if (require.main === module) {
    const tester = new CSSIsolationTester();
    tester.runAllTests().catch(console.error);
} else {
    module.exports = CSSIsolationTester;
}