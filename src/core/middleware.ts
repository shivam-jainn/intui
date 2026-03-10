import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // better-auth may use different cookie names depending on environment/setup.
  // in production it uses a secure prefix; in dev sometimes the secure prefix is still applied
  // which would make our original check miss the token.
  const cookieCandidates = 
    process.env.NODE_ENV === "production"
      ? ["__Secure-better-auth.session_token"]
      : ["better-auth.session_token", "__Secure-better-auth.session_token"];

  // try each name until we find a value
  let sessionToken: string | undefined;
  for (const name of cookieCandidates) {
    const cookie = request.cookies.get(name);
    if (cookie?.value) {
      sessionToken = cookie.value;
      break;
    }
  }

  // debugging: log all received cookie names (remove later if desired)
  // `request.cookies.keys` isn't available; use getAll() which returns all cookie objects.
  const names = request.cookies.getAll().map(c => c.name);
  console.log("cookies received:", names);
  console.log("sessionToken : ", sessionToken);
  
  const publicPaths = ["/", "/signin", "/signup"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  const isStaticFile = request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|otf|eot)$/i);
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  if (!sessionToken && !isPublicPath && !isStaticFile && !isApiRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/auth).*)"],
};