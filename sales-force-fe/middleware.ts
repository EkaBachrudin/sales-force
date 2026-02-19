import { NextResponse } from 'next/server';

export async function middleware() {
  // NOTE: Authentication is now handled entirely by client-side AuthContext
  // which uses refresh tokens stored in httpOnly cookies.
  // Middleware no longer checks for access_token since it's managed by the backend.

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
