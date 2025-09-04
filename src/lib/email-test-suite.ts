/**
 * Comprehensive email testing suite
 * Tests all email functionality including error scenarios
 */

import { Lead } from './supabase';
import {
  sendCustomerResultsEmail,
  sendSalesNotificationEmail,
  sendLeadEmails,
} from './email-service';
import { validateEmailConfiguration } from './email-config-validator';
import { calculateLeadScore } from './email-templates';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  error?: string;
}

export interface TestSuiteResults {
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  configValid: boolean;
}

/**
 * Create test lead data with different scenarios
 */
export function createTestLead(
  scenario:
    | 'high-value'
    | 'medium-value'
    | 'low-value'
    | 'minimal-data' = 'high-value',
  testEmail: string = 'test@example.com'
): Lead {
  const baseData = {
    id: `test-${scenario}-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'new' as const,
    notes: undefined,
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Test Suite) AppleWebKit/537.36',
    source_page: 'https://test.energiaykkonen.fi/calculator',
  };

  switch (scenario) {
    case 'high-value':
      return {
        ...baseData,
        // House Information
        neliot: 180,
        huonekorkeus: 3.0,
        rakennusvuosi: '<1970',
        floors: 2,

        // Current Heating
        lammitysmuoto: 'Oil',
        vesikiertoinen: 3500,
        current_energy_consumption: 20000,

        // Household
        henkilomaara: 5,
        hot_water_usage: 'High',

        // Contact Info
        first_name: 'Matti',
        last_name: 'Meikäläinen',
        sahkoposti: testEmail,
        puhelinnumero: '+358401234567',
        osoite: 'Iso-Roobertinkatu 20',
        paikkakunta: 'Helsinki',
        valittutukimuoto: 'Both',
        message:
          'Kiinnostaa todella paljon! Voitteko ottaa yhteyttä mahdollisimman pian?',

        // High-value calculations
        annual_energy_need: 28800,
        heat_pump_consumption: 8640,
        heat_pump_cost_annual: 1036.8,
        annual_savings: 2463.2,
        five_year_savings: 12316,
        ten_year_savings: 24632,
        payback_period: 6.1,
        co2_reduction: 5760,
      };

    case 'medium-value':
      return {
        ...baseData,
        // House Information
        neliot: 120,
        huonekorkeus: 2.5,
        rakennusvuosi: '1991-2010',
        floors: 1,

        // Current Heating
        lammitysmuoto: 'Electric',
        vesikiertoinen: 2200,
        current_energy_consumption: 15000,

        // Household
        henkilomaara: 3,
        hot_water_usage: 'Normal',

        // Contact Info
        first_name: 'Anna',
        last_name: 'Virtanen',
        sahkoposti: testEmail,
        puhelinnumero: '+358501234567',
        osoite: 'Puistokatu 15',
        paikkakunta: 'Tampere',
        valittutukimuoto: 'Email',
        message: undefined,

        // Medium-value calculations
        annual_energy_need: 18720,
        heat_pump_consumption: 5616,
        heat_pump_cost_annual: 673.92,
        annual_savings: 1526.08,
        five_year_savings: 7630.4,
        ten_year_savings: 15260.8,
        payback_period: 9.8,
        co2_reduction: 3744,
      };

    case 'low-value':
      return {
        ...baseData,
        // House Information
        neliot: 80,
        huonekorkeus: 2.5,
        rakennusvuosi: '>2010',
        floors: 1,

        // Current Heating
        lammitysmuoto: 'District',
        vesikiertoinen: 1400,
        current_energy_consumption: 12000,

        // Household
        henkilomaara: 2,
        hot_water_usage: 'Low',

        // Contact Info
        first_name: 'Pekka',
        last_name: 'Korhonen',
        sahkoposti: testEmail,
        puhelinnumero: '+358401234567',
        osoite: undefined,
        paikkakunta: 'Oulu',
        valittutukimuoto: 'Phone',
        message: undefined,

        // Low-value calculations
        annual_energy_need: 12480,
        heat_pump_consumption: 3744,
        heat_pump_cost_annual: 449.28,
        annual_savings: 950.72,
        five_year_savings: 4753.6,
        ten_year_savings: 9507.2,
        payback_period: 15.8,
        co2_reduction: 2496,
      };

    case 'minimal-data':
      return {
        ...baseData,
        // House Information
        neliot: 100,
        huonekorkeus: 2.5,
        rakennusvuosi: '1970-1990',
        floors: 1,

        // Current Heating
        lammitysmuoto: 'Other',
        vesikiertoinen: 1800,
        current_energy_consumption: undefined,

        // Household
        henkilomaara: 1,
        hot_water_usage: 'Normal',

        // Contact Info - minimal required data
        first_name: 'Test',
        last_name: 'User',
        sahkoposti: testEmail,
        puhelinnumero: '+358401234567',
        osoite: undefined,
        paikkakunta: undefined,
        valittutukimuoto: 'Email',
        message: undefined,

        // Basic calculations
        annual_energy_need: 15600,
        heat_pump_consumption: 4680,
        heat_pump_cost_annual: 561.6,
        annual_savings: 1238.4,
        five_year_savings: 6192,
        ten_year_savings: 12384,
        payback_period: 12.1,
        co2_reduction: 3120,
      };

    default:
      throw new Error(`Unknown test scenario: ${scenario}`);
  }
}

/**
 * Run a single test with timing and error handling
 */
async function runTest(
  testName: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    await testFn();
    const duration = Date.now() - startTime;

    return {
      testName,
      passed: true,
      duration,
      details: 'Test completed successfully',
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      testName,
      passed: false,
      duration,
      details: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test email configuration
 */
async function testEmailConfiguration(): Promise<TestResult> {
  return runTest('Email Configuration Validation', async () => {
    const config = validateEmailConfiguration();
    if (!config.isValid) {
      throw new Error(`Configuration invalid: ${config.errors.join(', ')}`);
    }
  });
}

/**
 * Test customer email with different lead scenarios
 */
async function testCustomerEmails(testEmail: string): Promise<TestResult[]> {
  const scenarios: Array<
    'high-value' | 'medium-value' | 'low-value' | 'minimal-data'
  > = ['high-value', 'medium-value', 'low-value', 'minimal-data'];

  const results: TestResult[] = [];

  for (const scenario of scenarios) {
    const result = await runTest(`Customer Email - ${scenario}`, async () => {
      const testLead = createTestLead(scenario, testEmail);
      const result = await sendCustomerResultsEmail(testLead);

      if (!result.success) {
        throw new Error('Customer email sending failed');
      }
    });

    results.push(result);
  }

  return results;
}

/**
 * Test sales notification emails
 */
async function testSalesEmails(testEmail: string): Promise<TestResult[]> {
  const scenarios: Array<'high-value' | 'medium-value' | 'low-value'> = [
    'high-value',
    'medium-value',
    'low-value',
  ];

  const results: TestResult[] = [];

  for (const scenario of scenarios) {
    const result = await runTest(`Sales Email - ${scenario}`, async () => {
      const testLead = createTestLead(scenario, testEmail);
      const result = await sendSalesNotificationEmail(
        testLead,
        'http://localhost:3000'
      );

      if (!result.success) {
        throw new Error('Sales email sending failed');
      }

      // Verify lead scoring
      const expectedScore =
        scenario === 'high-value'
          ? 'high'
          : scenario === 'medium-value'
            ? 'medium'
            : 'low';

      if (result.leadScore !== expectedScore) {
        throw new Error(
          `Expected lead score ${expectedScore}, got ${result.leadScore}`
        );
      }
    });

    results.push(result);
  }

  return results;
}

/**
 * Test combined email sending
 */
async function testCombinedEmails(testEmail: string): Promise<TestResult> {
  return runTest('Combined Email Sending', async () => {
    const testLead = createTestLead('high-value', testEmail);
    const results = await sendLeadEmails(testLead, 'http://localhost:3000');

    if (results.errors.length > 0) {
      throw new Error(`Email errors: ${results.errors.join(', ')}`);
    }

    if (!results.customerEmail?.success || !results.salesEmail?.success) {
      throw new Error('Not all emails were sent successfully');
    }
  });
}

/**
 * Test lead scoring algorithm
 */
async function testLeadScoring(): Promise<TestResult> {
  return runTest('Lead Scoring Algorithm', async () => {
    const highValueLead = createTestLead('high-value');
    const mediumValueLead = createTestLead('medium-value');
    const lowValueLead = createTestLead('low-value');

    const highScore = calculateLeadScore(highValueLead);
    const mediumScore = calculateLeadScore(mediumValueLead);
    const lowScore = calculateLeadScore(lowValueLead);

    if (highScore !== 'high') {
      throw new Error(
        `Expected high score for high-value lead, got ${highScore}`
      );
    }

    if (mediumScore !== 'medium') {
      throw new Error(
        `Expected medium score for medium-value lead, got ${mediumScore}`
      );
    }

    if (lowScore !== 'low') {
      throw new Error(`Expected low score for low-value lead, got ${lowScore}`);
    }
  });
}

/**
 * Test error handling scenarios
 */
async function testErrorHandling(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test with invalid email address
  const invalidEmailTest = await runTest(
    'Invalid Email Address Handling',
    async () => {
      const testLead = createTestLead('high-value', 'invalid-email');

      try {
        await sendCustomerResultsEmail(testLead);
        throw new Error('Should have failed with invalid email');
      } catch (error) {
        // Expected to fail
        if (
          error instanceof Error &&
          error.message.includes('Should have failed')
        ) {
          throw error;
        }
        // This is expected - the test passes if it properly handles the error
      }
    }
  );

  results.push(invalidEmailTest);

  return results;
}

/**
 * Run complete email test suite
 */
export async function runEmailTestSuite(
  testEmail: string = 'test@example.com'
): Promise<TestSuiteResults> {
  console.log('🧪 Starting comprehensive email test suite...');
  console.log(`📧 Test emails will be sent to: ${testEmail}`);

  const startTime = Date.now();
  const results: TestResult[] = [];

  // Check configuration first
  const configTest = await testEmailConfiguration();
  results.push(configTest);

  const configValid = configTest.passed;

  if (configValid) {
    console.log('✅ Configuration valid, proceeding with email tests...');

    // Test lead scoring (doesn't require API calls)
    const scoringTest = await testLeadScoring();
    results.push(scoringTest);

    // Test customer emails
    const customerTests = await testCustomerEmails(testEmail);
    results.push(...customerTests);

    // Test sales emails
    const salesTests = await testSalesEmails(testEmail);
    results.push(...salesTests);

    // Test combined emails
    const combinedTest = await testCombinedEmails(testEmail);
    results.push(combinedTest);

    // Test error handling
    const errorTests = await testErrorHandling();
    results.push(...errorTests);
  } else {
    console.log('❌ Configuration invalid, skipping email tests');
  }

  const duration = Date.now() - startTime;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  const suiteResults: TestSuiteResults = {
    totalTests: results.length,
    passed,
    failed,
    duration,
    results,
    configValid,
  };

  // Print summary
  console.log('\n📊 Email Test Suite Results:');
  console.log('============================');
  console.log(`Total Tests: ${suiteResults.totalTests}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️ Duration: ${duration}ms`);
  console.log(`📧 Test Email: ${testEmail}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(result => {
        console.log(`  - ${result.testName}: ${result.error}`);
      });
  }

  console.log('\n💡 Check your email inbox and spam folder for test emails');

  return suiteResults;
}

/**
 * Quick smoke test for basic functionality
 */
export async function runEmailSmokeTest(
  testEmail: string = 'test@example.com'
): Promise<boolean> {
  console.log('🚀 Running email smoke test...');

  try {
    // Check configuration
    const config = validateEmailConfiguration();
    if (!config.isValid) {
      console.log('❌ Email configuration invalid');
      return false;
    }

    // Send one test email of each type
    const testLead = createTestLead('medium-value', testEmail);
    const results = await sendLeadEmails(testLead, 'http://localhost:3000');

    if (results.errors.length > 0) {
      console.log('❌ Email sending failed:', results.errors);
      return false;
    }

    console.log('✅ Smoke test passed - emails sent successfully');
    console.log(`📧 Check your inbox: ${testEmail}`);
    return true;
  } catch (error) {
    console.log('❌ Smoke test failed:', error);
    return false;
  }
}
