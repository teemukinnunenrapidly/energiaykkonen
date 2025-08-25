import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
);

export interface SessionData {
  user: {
    id: string;
    role: string;
  };
  expires: string;
}

/**
 * Get session from request cookies (Edge-compatible version)
 */
export async function getSessionEdge(
  request: NextRequest
): Promise<SessionData | null> {
  const sessionCookie = request.cookies.get('admin-session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);

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
  } catch {
    // Don't log in Edge Runtime
    return null;
  }
}
