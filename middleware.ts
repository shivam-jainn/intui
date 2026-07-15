import { NextRequest, NextResponse } from 'next/server';

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie') ?? '';

  if (!cookieHeader) {
    return false;
  }

  try {
    const sessionUrl = new URL('/api/auth/get-session', request.url);
    const response = await fetch(sessionUrl, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
      },
      cache: 'no-store',
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
  const pathname = request.nextUrl.pathname;

  // Allow static assets and Next internal files to pass through without auth
  const isStaticFile = pathname.match(
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|otf|eot)$/i
  ) || pathname.startsWith('/_next');
  
  const isApiRoute = pathname.startsWith('/api');

  if (isStaticFile || isApiRoute) {
    return NextResponse.next();
  }

  // Landing page never redirects, so bypass session verification entirely
  if (pathname === '/') {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const hasSessionCookie =
    cookieHeader.includes('better-auth.session_token') ||
    cookieHeader.includes('__secure-better-auth.session_token');

  const publicRoutes = ['/signin', '/signup'];

  if (!hasSessionCookie) {
    // No session cookie exists, user is definitely logged out
    if (!publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    return NextResponse.next();
  }

  // Session cookie exists, verify session validity
  const validSession = await hasValidSession(request);

  if (!validSession) {
    // If not signed in, only allow public routes
    if (!publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  } else {
    // If signed in and trying to access auth pages, redirect to dashboard
    if (pathname === '/signin' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/p0', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
