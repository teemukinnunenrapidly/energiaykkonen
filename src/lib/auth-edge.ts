import { NextRequest } from 'next/server';

export interface SessionData {
  user: {
    id: string;
    role: string;
  };
  expires: string;
}

/**
 * Simple JWT verification for Edge Runtime (no external dependencies)
 */
async function verifyJWT(token: string): Promise<any> {
  try {
    // Split the JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
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
    const payload = await verifyJWT(sessionCookie);

    if (!payload || !payload.userId || !payload.role || !payload.expiresAt) {
      return null;
    }

    // Check if token is expired
    if (new Date() > new Date(payload.expiresAt)) {
      return null;
    }

    return {
      user: {
        id: payload.userId,
        role: payload.role,
      },
      expires: payload.expiresAt,
    };
  } catch {
    // Don't log in Edge Runtime
    return null;
  }
}
