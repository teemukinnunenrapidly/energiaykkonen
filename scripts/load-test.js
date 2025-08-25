/**
 * Load Testing Script for Heat Pump Calculator
 * Simulates concurrent users submitting forms
 */

const https = require('https');
const http = require('http');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  concurrentUsers: 50, // Reduced from 100 for development testing
  testDuration: 60000, // 1 minute
  requestInterval: 2000, // 2 seconds between requests per user
};

// Sample test data generators
const firstNames = [
  'Teemu',
  'Anna',
  'Mikko',
  'Sari',
  'Jukka',
  'Liisa',
  'Petri',
  'Minna',
];
const lastNames = [
  'Kinnunen',
  'Virtanen',
  'Korhonen',
  'Mäkinen',
  'Nieminen',
  'Hakkarainen',
];
const cities = [
  'Helsinki',
  'Tampere',
  'Turku',
  'Oulu',
  'Lahti',
  'Kuopio',
  'Jyväskylä',
];
const heatingTypes = ['electric', 'oil', 'district', 'other'];
const constructionYears = ['<1970', '1970-1990', '1991-2010', '>2010'];

function generateTestData() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.example.com`,
    phone: `+35840${Math.floor(Math.random() * 9000000) + 1000000}`,
    streetAddress: `Testikatu ${Math.floor(Math.random() * 999) + 1}`,
    city: cities[Math.floor(Math.random() * cities.length)],
    contactPreference: Math.random() > 0.5 ? 'email' : 'phone',
    message: Math.random() > 0.7 ? 'Test message for load testing' : undefined,

    // Property details
    squareMeters: Math.floor(Math.random() * 300) + 50, // 50-350 m²
    ceilingHeight: ['2.5', '3.0', '3.5'][Math.floor(Math.random() * 3)],
    constructionYear:
      constructionYears[Math.floor(Math.random() * constructionYears.length)],
    floors: ['1', '2', '3+'][Math.floor(Math.random() * 3)],

    // Heating details
    heatingType: heatingTypes[Math.floor(Math.random() * heatingTypes.length)],
    annualHeatingCost: Math.floor(Math.random() * 8000) + 500, // €500-8500

    // Household
    residents: ['1', '2', '3', '4', '5', '6', '7', '8+'][
      Math.floor(Math.random() * 8)
    ],
    hotWaterUsage: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],

    // GDPR
    gdprConsent: true,
    marketingConsent: Math.random() > 0.6, // 40% opt-in rate
  };
}

function makeRequest(userData) {
  return new Promise(resolve => {
    const postData = JSON.stringify(userData);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/submit-lead',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const startTime = Date.now();

    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        try {
          const result = JSON.parse(data);
          resolve({
            success: res.statusCode < 400,
            statusCode: res.statusCode,
            responseTime,
            data: result,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            responseTime,
            error: 'Invalid JSON response',
            timestamp: new Date().toISOString(),
          });
        }
      });
    });

    req.on('error', err => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      resolve({
        success: false,
        statusCode: 0,
        responseTime,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    });

    req.write(postData);
    req.end();
  });
}

async function simulateUser(userId) {
  const results = [];
  const startTime = Date.now();

  console.log(`👤 User ${userId} started`);

  while (Date.now() - startTime < TEST_CONFIG.testDuration) {
    const userData = generateTestData();
    const result = await makeRequest(userData);

    results.push({
      userId,
      ...result,
    });

    if (result.success) {
      console.log(
        `✅ User ${userId}: ${result.statusCode} (${result.responseTime}ms)`
      );
    } else {
      console.log(
        `❌ User ${userId}: ${result.statusCode} - ${result.error || 'Failed'} (${result.responseTime}ms)`
      );
    }

    // Wait before next request
    await new Promise(resolve =>
      setTimeout(resolve, TEST_CONFIG.requestInterval)
    );
  }

  console.log(`👤 User ${userId} finished with ${results.length} requests`);
  return results;
}

async function runLoadTest() {
  console.log('🚀 Starting Load Test...');
  console.log(
    `Configuration: ${TEST_CONFIG.concurrentUsers} users, ${TEST_CONFIG.testDuration / 1000}s duration`
  );
  console.log('='.repeat(80));

  const startTime = Date.now();

  // Start all simulated users
  const userPromises = [];
  for (let i = 1; i <= TEST_CONFIG.concurrentUsers; i++) {
    userPromises.push(simulateUser(i));
  }

  // Wait for all users to complete
  const allResults = await Promise.all(userPromises);
  const flatResults = allResults.flat();

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  // Calculate statistics
  const totalRequests = flatResults.length;
  const successfulRequests = flatResults.filter(r => r.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const successRate = (successfulRequests / totalRequests) * 100;

  const responseTimes = flatResults
    .filter(r => r.responseTime)
    .map(r => r.responseTime);
  const avgResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  // Calculate requests per second
  const requestsPerSecond = totalRequests / (totalDuration / 1000);

  // Status code breakdown
  const statusCodes = {};
  flatResults.forEach(r => {
    statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
  });

  // Error breakdown
  const errors = {};
  flatResults
    .filter(r => !r.success)
    .forEach(r => {
      const errorType = r.error || `HTTP ${r.statusCode}`;
      errors[errorType] = (errors[errorType] || 0) + 1;
    });

  console.log('\n' + '='.repeat(80));
  console.log('📊 LOAD TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Test Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`Concurrent Users: ${TEST_CONFIG.concurrentUsers}`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful Requests: ${successfulRequests}`);
  console.log(`Failed Requests: ${failedRequests}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Requests/Second: ${requestsPerSecond.toFixed(2)}`);
  console.log('');

  console.log('⏱️  Response Times:');
  console.log(`  Average: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`  Minimum: ${minResponseTime}ms`);
  console.log(`  Maximum: ${maxResponseTime}ms`);
  console.log('');

  console.log('📈 Status Code Distribution:');
  Object.entries(statusCodes).forEach(([code, count]) => {
    const percentage = ((count / totalRequests) * 100).toFixed(1);
    console.log(`  ${code}: ${count} (${percentage}%)`);
  });

  if (Object.keys(errors).length > 0) {
    console.log('\n❌ Error Breakdown:');
    Object.entries(errors).forEach(([error, count]) => {
      const percentage = ((count / totalRequests) * 100).toFixed(1);
      console.log(`  ${error}: ${count} (${percentage}%)`);
    });
  }

  console.log('\n🎯 Performance Assessment:');
  if (successRate >= 99) {
    console.log('  ✅ Excellent - Very high success rate');
  } else if (successRate >= 95) {
    console.log('  ✅ Good - High success rate');
  } else if (successRate >= 90) {
    console.log('  ⚠️  Acceptable - Moderate success rate');
  } else {
    console.log('  ❌ Poor - Low success rate, investigation needed');
  }

  if (avgResponseTime <= 2000) {
    console.log('  ✅ Excellent - Fast average response time');
  } else if (avgResponseTime <= 5000) {
    console.log('  ✅ Good - Acceptable response time');
  } else if (avgResponseTime <= 10000) {
    console.log('  ⚠️  Slow - Response time could be improved');
  } else {
    console.log('  ❌ Very Slow - Response time needs optimization');
  }

  if (requestsPerSecond >= 10) {
    console.log('  ✅ Excellent - High throughput');
  } else if (requestsPerSecond >= 5) {
    console.log('  ✅ Good - Adequate throughput');
  } else if (requestsPerSecond >= 2) {
    console.log('  ⚠️  Moderate - Acceptable throughput');
  } else {
    console.log('  ❌ Low - Throughput below expectations');
  }

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    requestsPerSecond,
    statusCodes,
    errors,
    results: flatResults,
  };
}

// Run the load test if script is executed directly
if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = { runLoadTest, generateTestData };
