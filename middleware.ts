import { NextRequest, NextResponse } from "next/server";

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") ?? "";

  if (!cookieHeader) {
    return false;
  }

  try {
    const sessionUrl = new URL("/api/auth/get-session", request.url);
    const response = await fetch(sessionUrl, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const session = await response.json();
    return Boolean(session?.user && session?.session);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // only protect p0 and its nested routes
  const shouldProtect = request.nextUrl.pathname === '/p0' ||
    request.nextUrl.pathname.startsWith('/p0/');

  // Allow static assets and API calls to pass through without auth
  const isStaticFile = request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|otf|eot)$/i);
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  if (!shouldProtect || isStaticFile || isApiRoute) {
    return NextResponse.next();
  }

  const validSession = await hasValidSession(request);

  if (!validSession) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/p0", "/p0/:path*"],
};