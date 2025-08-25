#!/usr/bin/env node

/**
 * Email System Validation Script
 *
 * Validates the email delivery system for the Heat Pump Calculator
 * Can be run locally or in CI/CD pipelines
 *
 * Usage:
 *   node scripts/validate-email-system.js
 *   node scripts/validate-email-system.js --email test@example.com
 *   node scripts/validate-email-system.js --mode full
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
let testEmail = 'test@example.com';
let mode = 'smoke';
let verbose = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--email':
      testEmail = args[i + 1];
      i++;
      break;
    case '--mode':
      mode = args[i + 1];
      i++;
      break;
    case '--verbose':
    case '-v':
      verbose = true;
      break;
    case '--help':
    case '-h':
      console.log(`
Email System Validation Script

Usage:
  node scripts/validate-email-system.js [options]

Options:
  --email <email>    Email address to send test emails to (default: test@example.com)
  --mode <mode>      Test mode: 'smoke' or 'full' (default: smoke)
  --verbose, -v      Verbose output
  --help, -h         Show this help message

Examples:
  node scripts/validate-email-system.js
  node scripts/validate-email-system.js --email your@email.com --mode full
  node scripts/validate-email-system.js --verbose
`);
      process.exit(0);
  }
}

console.log('🧪 Email System Validation');
console.log('==========================');
console.log(`📧 Test Email: ${testEmail}`);
console.log(`🔧 Test Mode: ${mode}`);
console.log('');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error(
    '❌ Error: package.json not found. Run this script from the project root.'
  );
  process.exit(1);
}

// Check if Next.js is available
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (!packageJson.dependencies?.next) {
    console.error('❌ Error: This does not appear to be a Next.js project.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
  process.exit(1);
}

// Function to check if development server is running
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000/api/email-status');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Function to run email tests via API
async function runEmailTests() {
  try {
    console.log('🔍 Checking email configuration...');

    const configResponse = await fetch(
      'http://localhost:3000/api/email-status'
    );
    const configData = await configResponse.json();

    if (verbose) {
      console.log(
        'Configuration check result:',
        JSON.stringify(configData, null, 2)
      );
    }

    if (!configData.isValid) {
      console.log('❌ Email configuration is invalid:');
      configData.errors?.forEach(error => console.log(`  - ${error}`));
      console.log('');
      console.log('💡 Setup instructions:');
      configData.suggestions?.forEach(suggestion =>
        console.log(`  - ${suggestion}`)
      );
      return false;
    }

    console.log('✅ Email configuration is valid');
    console.log('');

    console.log(`🧪 Running ${mode} email test...`);

    const testResponse = await fetch(
      'http://localhost:3000/api/test-email-suite',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail, mode }),
      }
    );

    const testData = await testResponse.json();

    if (verbose) {
      console.log('Test result:', JSON.stringify(testData, null, 2));
    }

    console.log(`${testData.success ? '✅' : '❌'} ${testData.message}`);

    if (testData.results) {
      if (testData.results.testType === 'full') {
        console.log(
          `📊 Test Results: ${testData.results.passed}/${testData.results.totalTests} passed`
        );

        if (testData.results.failed > 0) {
          console.log('❌ Failed tests:');
          testData.results.results
            ?.filter(r => !r.passed)
            ?.forEach(r => console.log(`  - ${r.testName}: ${r.error}`));
        }
      }
    }

    if (testData.instructions?.checkInbox) {
      console.log('');
      console.log('📧', testData.instructions.checkInbox);
    }

    return testData.success;
  } catch (error) {
    console.error('❌ Error running email tests:', error.message);
    return false;
  }
}

// Main validation function
async function validateEmailSystem() {
  // Check if development server is running
  console.log('🔍 Checking if development server is running...');

  const serverRunning = await checkDevServer();

  if (!serverRunning) {
    console.log(
      '❌ Development server is not running on http://localhost:3000'
    );
    console.log('');
    console.log('Please start the development server first:');
    console.log('  npm run dev');
    console.log('');
    console.log('Then run this script again.');
    return false;
  }

  console.log('✅ Development server is running');
  console.log('');

  // Run email tests
  const success = await runEmailTests();

  console.log('');
  console.log('📋 Validation Summary:');
  console.log('=====================');
  console.log(`Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test Email: ${testEmail}`);
  console.log(`Test Mode: ${mode}`);

  if (!success) {
    console.log('');
    console.log('🛠️ Troubleshooting:');
    console.log('- Check that RESEND_API_KEY is set in .env.local');
    console.log('- Verify your Resend API key is valid');
    console.log('- Check the Email Setup Guide: EMAIL_SETUP_GUIDE.md');
    console.log(
      '- Visit the test dashboard: http://localhost:3000/test-emails'
    );
  }

  return success;
}

// Run the validation
validateEmailSystem()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
