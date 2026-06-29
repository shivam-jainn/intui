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
  return NextResponse.next();
}

export const config = {
  matcher: [],
};