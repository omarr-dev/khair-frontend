import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Redirect visitors from old Vercel domain to maarij.sa
  if (host.includes("khair-frontend-three.vercel.app")) {
    // Rewrite to the redirect page
    return NextResponse.rewrite(new URL("/redirect-notice", request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
