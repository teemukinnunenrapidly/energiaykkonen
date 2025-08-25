import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  detectSuspiciousPatterns,
  securityLogger,
} from '@/lib/input-sanitizer';

/**
 * Security Testing Endpoint
 *
 * This endpoint is for testing security measures during development.
 * In production, this should be removed or protected with authentication.
 */

export async function POST(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Security testing not available in production' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { testType, testData } = body;

    const headersList = await headers();
    const clientIp =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'test-ip';

    const userAgent = headersList.get('user-agent') || 'test-agent';

    switch (testType) {
      case 'xss':
        return testXSSProtection(testData, clientIp, userAgent);

      case 'sql_injection':
        return testSQLInjectionProtection(testData, clientIp, userAgent);

      case 'suspicious_patterns':
        return testSuspiciousPatternDetection(testData);

      case 'rate_limit':
        return testRateLimitingInfo();

      case 'security_events':
        return getSecurityEvents();

      default:
        return NextResponse.json(
          {
            message: 'Invalid test type',
            availableTests: [
              'xss',
              'sql_injection',
              'suspicious_patterns',
              'rate_limit',
              'security_events',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function testXSSProtection(testData: string, ip: string, userAgent: string) {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src=x onerror=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    testData || '<script>console.log("test")</script>',
  ];

  const results = xssPayloads.map(payload => {
    const detection = detectSuspiciousPatterns(payload);

    if (detection.isSuspicious) {
      securityLogger.log({
        type: 'suspicious_input',
        severity: detection.severity,
        ip,
        userAgent,
        details: {
          field: 'security-test',
          patterns: detection.patterns,
          originalValue: payload,
          testType: 'xss',
        },
      });
    }

    return {
      payload,
      detected: detection.isSuspicious,
      severity: detection.severity,
      patterns: detection.patterns,
    };
  });

  return NextResponse.json({
    testType: 'XSS Protection',
    results,
    summary: {
      total: results.length,
      detected: results.filter(r => r.detected).length,
      passed: results.filter(r => r.detected).length === results.length,
    },
  });
}

function testSQLInjectionProtection(
  testData: string,
  ip: string,
  userAgent: string
) {
  const sqlPayloads = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "1'; INSERT INTO users VALUES('hacker','password'); --",
    testData || "test' OR 1=1 --",
  ];

  const results = sqlPayloads.map(payload => {
    const detection = detectSuspiciousPatterns(payload);

    if (detection.isSuspicious) {
      securityLogger.log({
        type: 'suspicious_input',
        severity: detection.severity,
        ip,
        userAgent,
        details: {
          field: 'security-test',
          patterns: detection.patterns,
          originalValue: payload,
          testType: 'sql_injection',
        },
      });
    }

    return {
      payload,
      detected: detection.isSuspicious,
      severity: detection.severity,
      patterns: detection.patterns,
    };
  });

  return NextResponse.json({
    testType: 'SQL Injection Protection',
    results,
    summary: {
      total: results.length,
      detected: results.filter(r => r.detected).length,
      passed: results.filter(r => r.detected).length === results.length,
    },
  });
}

function testSuspiciousPatternDetection(testData: string) {
  const testInput = testData || 'Normal safe input text';
  const detection = detectSuspiciousPatterns(testInput);

  return NextResponse.json({
    testType: 'Suspicious Pattern Detection',
    input: testInput,
    result: {
      isSuspicious: detection.isSuspicious,
      severity: detection.severity,
      patterns: detection.patterns,
    },
  });
}

function testRateLimitingInfo() {
  return NextResponse.json({
    testType: 'Rate Limiting Information',
    configuration: {
      maxRequests: 10,
      windowMs: 3600000, // 1 hour
      implementation:
        'In-memory Map (development) / Redis (production recommended)',
    },
    testing: {
      instructions:
        'Make multiple requests to /api/submit-lead to test rate limiting',
      expectedBehavior:
        'After 10 requests from same IP within 1 hour, should return 429 status',
    },
  });
}

function getSecurityEvents() {
  const events = securityLogger.getEvents();

  return NextResponse.json({
    testType: 'Security Events Log',
    events: events.slice(-20), // Last 20 events
    total: events.length,
    summary: {
      suspicious_input: events.filter(e => e.type === 'suspicious_input')
        .length,
      rate_limit_exceeded: events.filter(e => e.type === 'rate_limit_exceeded')
        .length,
      validation_failed: events.filter(e => e.type === 'validation_failed')
        .length,
    },
  });
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Security testing not available in production' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: 'Security Testing Endpoint',
    description: 'POST with testType to run security tests',
    availableTests: {
      xss: 'Test XSS protection with malicious scripts',
      sql_injection: 'Test SQL injection protection',
      suspicious_patterns: 'Test pattern detection with custom input',
      rate_limit: 'Get rate limiting information',
      security_events: 'View recent security events',
    },
    examples: {
      xss_test: {
        method: 'POST',
        body: { testType: 'xss', testData: '<script>alert("test")</script>' },
      },
      pattern_test: {
        method: 'POST',
        body: {
          testType: 'suspicious_patterns',
          testData: 'Your custom input here',
        },
      },
    },
  });
}
