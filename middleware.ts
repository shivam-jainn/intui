import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;
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