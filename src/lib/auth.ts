import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

// Support both legacy and new JWT systems
// Use a simpler approach for JWT secret encoding
const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.NEXT_PUBLIC_SUPABASE_JWT_SECRET ||
  'fallback-secret-key-change-in-production';

// Convert to Uint8Array for jose library
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  role: string;
  expiresAt: Date;
  [key: string]: unknown;
}

export interface SessionData {
  user: {
    id: string;
    role: string;
  };
  expires: string;
}

// Session duration: 8 hours
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

/**
 * Create a new session token (JWT)
 */
export async function createSessionToken(userData: {
  id: string;
  role: string;
}): Promise<string> {
  const payload: SessionPayload = {
    userId: userData.id,
    role: userData.role,
    expiresAt: new Date(Date.now() + SESSION_DURATION),
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET_BYTES);

  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySessionToken(
  token: string
): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES);

    if (!payload.userId || !payload.role || !payload.expiresAt) {
      return null;
    }

    // Check if token is expired
    if (new Date() > new Date(payload.expiresAt as string)) {
      return null;
    }

    return {
      user: {
        id: payload.userId as string,
        role: payload.role as string,
      },
      expires: payload.expiresAt as string,
    };
  } catch (error) {
    console.error('Invalid session token:', error);
    return null;
  }
}

/**
 * Get session from request cookies
 */
export async function getSession(
  request?: NextRequest
): Promise<SessionData | null> {
  let sessionCookie: string | undefined;

  if (request) {
    // For middleware usage
    sessionCookie = request.cookies.get('admin-session')?.value;
  } else {
    // For server components/actions
    const cookieStore = await cookies();
    sessionCookie = cookieStore.get('admin-session')?.value;
  }

  if (!sessionCookie) {
    return null;
  }

  return await verifySessionToken(sessionCookie);
}

/**
 * Verify admin credentials against environment variable
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return false;
  }

  return password === adminPassword;
}

/**
 * Check if user is authenticated and has admin role
 */
export async function requireAdmin(
  request?: NextRequest
): Promise<SessionData> {
  const session = await getSession(request);

  if (!session) {
    throw new Error('Authentication required');
  }

  if (session.user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return session;
}

/**
 * Create session cookie options
 */
export function getSessionCookieOptions() {
  return {
    name: 'admin-session',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: SESSION_DURATION / 1000, // Convert to seconds
    },
  };
}

/**
 * Clear session cookie
 */
export function clearSessionCookie() {
  const { name, options } = getSessionCookieOptions();
  return {
    name,
    options: {
      ...options,
      maxAge: 0,
    },
  };
}
