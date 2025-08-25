import { NextResponse, type NextRequest } from 'next/server';
import { getSessionEdge } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page and API auth endpoint
  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return NextResponse.next();
  }

  // Check for session on protected admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const session = await getSessionEdge(request);

    if (!session) {
      // Redirect to login if no valid session
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.user.role !== 'admin') {
      // Return 403 if user doesn't have admin role
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
