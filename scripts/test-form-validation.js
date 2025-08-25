/**
 * Automated Form Validation Testing Script
 * Tests all form validation scenarios for the Heat Pump Calculator
 */

const testCases = [
  // Valid test case
  {
    name: 'Valid form submission',
    data: {
      firstName: 'Teemu',
      lastName: 'Kinnunen',
      email: 'teemu@energiaykkonen.fi',
      phone: '+358401234567',
      streetAddress: 'Testikatu 123',
      city: 'Helsinki',
      contactPreference: 'email',
      message: 'Test message',
      squareMeters: 150,
      ceilingHeight: '3.0',
      constructionYear: '1991-2010',
      floors: '2',
      heatingType: 'electric',
      annualHeatingCost: 2500,
      residents: '4',
      hotWaterUsage: 'normal',
      gdprConsent: true,
      marketingConsent: false,
    },
    expectedResult: 'success',
  },

  // Invalid firstName
  {
    name: 'Invalid firstName - too short',
    data: {
      firstName: 'T',
      lastName: 'Kinnunen',
      email: 'teemu@energiaykkonen.fi',
      phone: '+358401234567',
      contactPreference: 'email',
      squareMeters: 150,
      ceilingHeight: '3.0',
      constructionYear: '1991-2010',
      floors: '2',
      heatingType: 'electric',
      annualHeatingCost: 2500,
      residents: '4',
      hotWaterUsage: 'normal',
      gdprConsent: true,
    },
    expectedResult: 'validation_error',
    expectedError: 'First name must be at least 2 characters',
  },

  // Invalid email
  {
    name: 'Invalid email format',
    data: {
      firstName: 'Teemu',
      lastName: 'Kinnunen',
      email: 'invalid-email',
      phone: '+358401234567',
      contactPreference: 'email',
      squareMeters: 150,
      ceilingHeight: '3.0',
      constructionYear: '1991-2010',
      floors: '2',
      heatingType: 'electric',
      annualHeatingCost: 2500,
      residents: '4',
      hotWaterUsage: 'normal',
      gdprConsent: true,
    },
    expectedResult: 'validation_error',
    expectedError: 'Please enter a valid email address',
  },

  // Missing GDPR consent
  {
    name: 'Missing GDPR consent',
    data: {
      firstName: 'Teemu',
      lastName: 'Kinnunen',
      email: 'teemu@energiaykkonen.fi',
      phone: '+358401234567',
      contactPreference: 'email',
      squareMeters: 150,
      ceilingHeight: '3.0',
      constructionYear: '1991-2010',
      floors: '2',
      heatingType: 'electric',
      annualHeatingCost: 2500,
      residents: '4',
      hotWaterUsage: 'normal',
      gdprConsent: false,
    },
    expectedResult: 'validation_error',
    expectedError: 'You must agree to the privacy policy to continue',
  },

  // XSS attempt
  {
    name: 'XSS attempt in firstName',
    data: {
      firstName: "<script>alert('xss')</script>",
      lastName: 'Kinnunen',
      email: 'teemu@energiaykkonen.fi',
      phone: '+358401234567',
      contactPreference: 'email',
      squareMeters: 150,
      ceilingHeight: '3.0',
      constructionYear: '1991-2010',
      floors: '2',
      heatingType: 'electric',
      annualHeatingCost: 2500,
      residents: '4',
      hotWaterUsage: 'normal',
      gdprConsent: true,
    },
    expectedResult: 'validation_error',
    expectedError: 'First name contains invalid characters',
  },

  // SQL injection attempt
  {
    name: 'SQL injection attempt in message',
    data: {
      firstName: 'Teemu',
      lastName: 'Kinnunen',
      email: 'teemu@energiaykkonen.fi',
      phone: '+358401234567',
      contactPreference: 'email',
      message: "'; DROP TABLE leads; --",
      squareMeters: 150,
      ceilingHeight: '3.0',
      constructionYear: '1991-2010',
      floors: '2',
      heatingType: 'electric',
      annualHeatingCost: 2500,
      residents: '4',
      hotWaterUsage: 'normal',
      gdprConsent: true,
    },
    expectedResult: 'success', // Should be sanitized and accepted
    expectedBehavior: 'input_sanitized',
  },
];

async function runFormValidationTests() {
  console.log('🧪 Starting Form Validation Tests...\n');

  const baseUrl = 'http://localhost:3000';
  const results = [];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);

    try {
      const response = await fetch(`${baseUrl}/api/submit-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      });

      const result = await response.json();
      const success = response.ok;

      // Validate result
      let testPassed = false;
      let message = '';

      if (testCase.expectedResult === 'success' && success) {
        testPassed = true;
        message = '✅ PASS - Form submitted successfully';
      } else if (testCase.expectedResult === 'validation_error' && !success) {
        if (
          testCase.expectedError &&
          result.message.includes(testCase.expectedError)
        ) {
          testPassed = true;
          message = '✅ PASS - Expected validation error caught';
        } else {
          testPassed = false;
          message = `❌ FAIL - Wrong error message. Expected: "${testCase.expectedError}", Got: "${result.message}"`;
        }
      } else if (testCase.expectedResult === 'success' && !success) {
        testPassed = false;
        message = `❌ FAIL - Expected success but got error: ${result.message}`;
      } else {
        testPassed = false;
        message = `❌ FAIL - Unexpected result: ${JSON.stringify(result)}`;
      }

      results.push({
        testName: testCase.name,
        passed: testPassed,
        message: message,
        responseStatus: response.status,
        responseBody: result,
      });

      console.log(`  ${message}`);
    } catch (error) {
      results.push({
        testName: testCase.name,
        passed: false,
        message: `❌ FAIL - Network error: ${error.message}`,
        error: error.message,
      });

      console.log(`  ❌ FAIL - Network error: ${error.message}`);
    }

    console.log(''); // Empty line for readability
  }

  // Summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log('='.repeat(60));
  console.log('📊 FORM VALIDATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
  );
  console.log('');

  if (failedTests > 0) {
    console.log('❌ FAILED TESTS:');
    results
      .filter(r => !r.passed)
      .forEach(result => {
        console.log(`  - ${result.testName}: ${result.message}`);
      });
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: (passedTests / totalTests) * 100,
    results,
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFormValidationTests, testCases };
}

// Run tests if script is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runFormValidationTests().catch(console.error);
}
