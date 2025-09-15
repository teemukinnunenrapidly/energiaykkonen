import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createSessionToken,
  getSessionCookieOptions,
  clearSessionCookie,
} from '@/lib/auth';

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0]
    : request.headers.get('x-real-ip') || 'unknown';
  return `login_${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || now - attempt.lastAttempt > RATE_LIMIT_WINDOW) {
    // Reset or initialize attempts
    loginAttempts.set(key, { count: 0, lastAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - attempt.count };
}

function recordAttempt(key: string, failed: boolean) {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, lastAttempt: now };

  if (failed) {
    attempt.count += 1;
    attempt.lastAttempt = now;
    loginAttempts.set(key, attempt);
  } else {
    // Clear attempts on successful login
    loginAttempts.delete(key);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify password
    const isValidPassword = verifyAdminPassword(password);

    if (!isValidPassword) {
      recordAttempt(rateLimitKey, true);
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Success - clear rate limiting and create session
    recordAttempt(rateLimitKey, false);

    // Create session token
    const sessionToken = await createSessionToken({
      id: 'admin',
      role: 'admin',
    });

    // Set session cookie
    const { name, options } = getSessionCookieOptions();
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
    });

    response.cookies.set(name, sessionToken, options);

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Logout endpoint - clear session cookie
  try {
    const { name, options } = clearSessionCookie();
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set(name, '', options);

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
