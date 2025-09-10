#!/usr/bin/env node
/**
 * Verification Tests for Dual CSS Output
 * Validates that webpack generates correct Shadow DOM and Namespace CSS files
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting CSS Output Verification Tests...\n');

// Test configuration
const DIST_DIR = path.join(__dirname, '..', 'dist');
const EXPECTED_FILES = {
  shadowDom: 'e1-calculator-widget.min.css',
  namespaced: 'widget-namespaced.min.css'
};

const TEST_RESULTS = [];

function addTestResult(testName, passed, message, details = null) {
  const result = {
    test: testName,
    status: passed ? 'PASS' : 'FAIL',
    message,
    details
  };
  TEST_RESULTS.push(result);
  
  const emoji = passed ? '✅' : '❌';
  console.log(`${emoji} ${testName}: ${message}`);
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

// Test 1: File existence
function testFileExistence() {
  console.log('📁 Test 1: CSS File Existence\n');
  
  Object.entries(EXPECTED_FILES).forEach(([type, filename]) => {
    const filePath = path.join(DIST_DIR, filename);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
      addTestResult(
        `${type} CSS file exists`,
        true,
        `${filename} found (${sizeKB} KB)`,
        filePath
      );
    } else {
      addTestResult(
        `${type} CSS file exists`,
        false,
        `${filename} not found`,
        filePath
      );
    }
  });
}

// Test 2: Shadow DOM CSS content validation
function testShadowDomCSS() {
  console.log('\n🎭 Test 2: Shadow DOM CSS Content Validation\n');
  
  const filePath = path.join(DIST_DIR, EXPECTED_FILES.shadowDom);
  if (!fs.existsSync(filePath)) {
    addTestResult('Shadow DOM CSS content', false, 'File not found');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Test for :host selector
  const hasHostSelector = content.includes(':host{') || content.includes(':host {');
  addTestResult(
    'Shadow DOM has :host selector',
    hasHostSelector,
    hasHostSelector ? ':host selector found' : ':host selector missing'
  );
  
  // Test for Shadow DOM reset styles
  const hasResetStyles = content.includes('all:initial') && content.includes('contain:layout');
  addTestResult(
    'Shadow DOM has reset styles',
    hasResetStyles,
    hasResetStyles ? 'Reset styles (all:initial, contain) found' : 'Reset styles missing'
  );
  
  // Test for widget styles without namespace
  const hasCleanSelectors = content.includes('.card{') || content.includes('.field-input{');
  addTestResult(
    'Shadow DOM has clean selectors',
    hasCleanSelectors,
    hasCleanSelectors ? 'Clean selectors (.card, .field-input) found' : 'Clean selectors missing'
  );
  
  // Test that it does NOT have namespace prefixes
  const hasNamespacePrefix = content.includes('.e1-calculator-isolated-root .card');
  addTestResult(
    'Shadow DOM has no namespace prefixes',
    !hasNamespacePrefix,
    !hasNamespacePrefix ? 'No namespace prefixes found (correct)' : 'Unexpected namespace prefixes found'
  );
}

// Test 3: Namespaced CSS content validation
function testNamespacedCSS() {
  console.log('\n🏷️  Test 3: Namespaced CSS Content Validation\n');
  
  const filePath = path.join(DIST_DIR, EXPECTED_FILES.namespaced);
  if (!fs.existsSync(filePath)) {
    addTestResult('Namespaced CSS content', false, 'File not found');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Test for namespace prefix on all selectors
  const hasNamespacePrefix = content.includes('.e1-calculator-isolated-root .card{') || 
                              content.includes('.e1-calculator-isolated-root .field-input{');
  addTestResult(
    'Namespaced CSS has prefixes',
    hasNamespacePrefix,
    hasNamespacePrefix ? 'Namespace prefixes (.e1-calculator-isolated-root) found' : 'Namespace prefixes missing'
  );
  
  // Test for namespaced reset styles
  const hasNamespacedReset = content.includes('.e1-calculator-isolated-root *') && 
                             content.includes('box-sizing:border-box');
  addTestResult(
    'Namespaced CSS has reset styles',
    hasNamespacedReset,
    hasNamespacedReset ? 'Namespaced reset styles found' : 'Namespaced reset styles missing'
  );
  
  // Test for preserved :host selector (should remain as-is)
  const hasHostSelector = content.includes(':host{') || content.includes(':host {');
  addTestResult(
    'Namespaced CSS preserves :host',
    hasHostSelector,
    hasHostSelector ? ':host selector preserved (correct)' : ':host selector missing'
  );
  
  // Test that clean selectors are prefixed
  const hasCleanSelectors = content.includes('.card{') && !content.includes('.e1-calculator-isolated-root');
  addTestResult(
    'Namespaced CSS has no unprefixed selectors',
    !hasCleanSelectors,
    !hasCleanSelectors ? 'All selectors properly prefixed' : 'Some selectors not prefixed'
  );
}

// Test 4: PostCSS plugin validation
function testPostCSSProcessing() {
  console.log('\n⚙️  Test 4: PostCSS Processing Validation\n');
  
  Object.entries(EXPECTED_FILES).forEach(([type, filename]) => {
    const filePath = path.join(DIST_DIR, filename);
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Test for autoprefixer
    const hasAutoprefixer = content.includes('-webkit-') || content.includes('-moz-');
    addTestResult(
      `${type} CSS has autoprefixer`,
      hasAutoprefixer,
      hasAutoprefixer ? 'Vendor prefixes found (autoprefixer working)' : 'No vendor prefixes (may be normal for modern browsers)'
    );
    
    // Test for minification
    const isMinified = !content.includes('\n  ') && content.length > 100;
    addTestResult(
      `${type} CSS is minified`,
      isMinified,
      isMinified ? 'CSS appears minified' : 'CSS not minified'
    );
  });
}

// Test 5: File size validation
function testFileSizes() {
  console.log('\n📊 Test 5: File Size Validation\n');
  
  Object.entries(EXPECTED_FILES).forEach(([type, filename]) => {
    const filePath = path.join(DIST_DIR, filename);
    if (!fs.existsSync(filePath)) return;
    
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
    
    // Expected size ranges
    const expectedSizes = {
      shadowDom: { min: 5, max: 15 }, // 5-15KB expected
      namespaced: { min: 8, max: 20 }  // 8-20KB expected (larger due to prefixing)
    };
    
    const expected = expectedSizes[type];
    const sizeOk = sizeKB >= expected.min && sizeKB <= expected.max;
    
    addTestResult(
      `${type} CSS size reasonable`,
      sizeOk,
      `${sizeKB}KB (expected: ${expected.min}-${expected.max}KB)`,
      sizeOk ? 'Within expected range' : 'Outside expected range - check for issues'
    );
  });
}

// Test 6: Content comparison
function testContentComparison() {
  console.log('\n🔄 Test 6: Content Comparison\n');
  
  const shadowPath = path.join(DIST_DIR, EXPECTED_FILES.shadowDom);
  const namespacedPath = path.join(DIST_DIR, EXPECTED_FILES.namespaced);
  
  if (!fs.existsSync(shadowPath) || !fs.existsSync(namespacedPath)) {
    addTestResult('Content comparison', false, 'Both CSS files needed for comparison');
    return;
  }
  
  const shadowContent = fs.readFileSync(shadowPath, 'utf8');
  const namespacedContent = fs.readFileSync(namespacedPath, 'utf8');
  
  // Namespaced should be larger (has prefixes)
  const namespacedLarger = namespacedContent.length > shadowContent.length;
  addTestResult(
    'Namespaced CSS is larger',
    namespacedLarger,
    namespacedLarger ? 
      `Namespaced: ${Math.round(namespacedContent.length/1024)}KB > Shadow: ${Math.round(shadowContent.length/1024)}KB` :
      'Namespaced CSS should be larger than Shadow DOM CSS'
  );
  
  // Both should contain similar base styles
  const sharedStyles = ['.card', '.field-input', '.button', ':host'];
  let sharedCount = 0;
  
  sharedStyles.forEach(selector => {
    const inShadow = shadowContent.includes(selector);
    const inNamespaced = namespacedContent.includes(selector);
    
    if (inShadow && inNamespaced) {
      sharedCount++;
    }
  });
  
  const hasSharedStyles = sharedCount >= 2; // At least 2 shared styles
  addTestResult(
    'Both CSS files share core styles',
    hasSharedStyles,
    `${sharedCount}/${sharedStyles.length} shared style patterns found`
  );
}

// Summary function
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  const passed = TEST_RESULTS.filter(r => r.status === 'PASS').length;
  const failed = TEST_RESULTS.filter(r => r.status === 'FAIL').length;
  const total = TEST_RESULTS.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round(passed/total*100)}%`);
  
  if (failed > 0) {
    console.log('\n🚨 FAILED TESTS:');
    TEST_RESULTS.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   • ${result.test}: ${result.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Dual CSS output is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the webpack configuration.');
    process.exit(1);
  }
}

// Run all tests
function runAllTests() {
  testFileExistence();
  testShadowDomCSS();
  testNamespacedCSS();
  testPostCSSProcessing();
  testFileSizes();
  testContentComparison();
  printSummary();
}

// Execute tests
runAllTests();