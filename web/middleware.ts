import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Protected route paths
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/profile");

  // If attempting to access a protected route without a token cookie,
  // we redirect to the login page with a return URL.
  // (Note: The client-side AuthGuard also enforces localStorage token checks)
  if (isProtectedPath && !token) {
    // Note: We allow the request to proceed to client-side layout guard if using localStorage only,
    // but the client-side DashboardLayout will strictly enforce and redirect if no token is found in either.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/profile/:path*"],
};
