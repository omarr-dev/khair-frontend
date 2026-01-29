import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Redirect visitors from old Vercel domain to notice page
  if (host.includes('khair-frontend-three.vercel.app')) {
    return NextResponse.rewrite(new URL('/redirect-notice', request.url));
  }

  // Note: Token is stored in localStorage which is not accessible in middleware
  // Authentication is handled client-side in the ProtectedRoute component
  // This middleware is kept minimal to allow client-side auth handling

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
