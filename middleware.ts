import { NextRequest, NextResponse } from 'next/server';

function getExcludedPaths(): string[] {
  try {
    const raw = process.env.EXCLUDE_MIDDLEWARE;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === 'true' || process.env.AUTH_DISABLED === '1';
}

async function hasValidSession(request: NextRequest): Promise<{ valid: boolean; userId?: string }> {
  const cookieHeader = request.headers.get('cookie') ?? '';

  if (!cookieHeader) {
    return { valid: false };
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
      return { valid: false };
    }

    const session = await response.json();
    if (session?.user && session?.session) {
      return { valid: true, userId: session.user.id };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export async function middleware(request: NextRequest) {
  if (isAuthDisabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const excludedPaths = getExcludedPaths();

  for (const prefix of excludedPaths) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  const { valid, userId } = await hasValidSession(request);

  if (!valid) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const requestHeaders = new Headers(request.headers);
  const uid = userId!;
  requestHeaders.set('x-user-id', uid);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/api/mixer/:path*',
    '/api/submissions',
    '/p0',
    '/p0/:path*',
  ],
};
