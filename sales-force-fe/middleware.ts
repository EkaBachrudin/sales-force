import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/leads', '/pipeline', '/analytics', '/properties', '/settings', '/users'];

// Routes that require specific roles
const roleProtectedRoutes: Record<string, string[]> = {
  '/users': ['Admin', 'Supervisor'],
  // Add other role-protected routes here
  // '/analytics': ['Admin', 'Supervisor'],
};

// Public routes
const publicRoutes = ['/login', '/register', '/features'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If already authenticated and trying to access login, redirect to dashboard
    const accessToken = request.cookies.get('access_token');
    if (accessToken && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Check if the path requires authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const accessToken = request.cookies.get('access_token');

    if (!accessToken) {
      // No access token, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For role-protected routes, we need to verify the user's role
    // Note: This is a basic check. For more secure implementation,
    // you might want to add a lightweight API endpoint to verify the JWT
    // and get the user's role without full authentication overhead
    for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        // For now, we'll let the client-side handle role verification
        // The page component will check the user's role and show appropriate content
        // This is because we can't decode the JWT and verify the role without a DB call
        // or additional setup
        break;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes that handle their own authentication
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
