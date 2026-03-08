import { NextRequest, NextResponse } from "next/server";

const AUTH_FAILURE_THRESHOLD = 3;
const AUTH_COOLDOWN_MS = 30_000;

let consecutiveAuthFailures = 0;
let bypassAuthUntil = 0;

const isAuthBypassActive = () => Date.now() < bypassAuthUntil;

const registerAuthFailure = () => {
  consecutiveAuthFailures += 1;

  if (consecutiveAuthFailures >= AUTH_FAILURE_THRESHOLD) {
    bypassAuthUntil = Date.now() + AUTH_COOLDOWN_MS;
    console.error("[middleware] auth circuit breaker opened for 30s");
  }
};

const registerAuthSuccess = () => {
  consecutiveAuthFailures = 0;
  bypassAuthUntil = 0;
};

export async function middleware(request: NextRequest) {
  if (isAuthBypassActive()) {
    return NextResponse.next();
  }

  try {
    // better-auth may use different cookie names depending on environment/setup.
    const cookieCandidates =
      process.env.NODE_ENV === "production"
        ? ["__Secure-better-auth.session_token"]
        : ["better-auth.session_token", "__Secure-better-auth.session_token"];

    let sessionToken: string | undefined;
    for (const name of cookieCandidates) {
      const cookie = request.cookies.get(name);
      if (cookie?.value) {
        sessionToken = cookie.value;
        break;
      }
    }

    const publicPaths = ["/", "/signin", "/signup"];
    const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

    if (!sessionToken && !isPublicPath) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    registerAuthSuccess();
  } catch (error) {
    registerAuthFailure();
    console.error("[middleware] auth check failed:", error);

    // Fail open while the breaker is warming up to avoid taking the whole app down.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Keep middleware off all Next internals and API handlers.
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};