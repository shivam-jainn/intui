import { createAuthClient } from "better-auth/client";
import { NextRequest, NextResponse } from "next/server";

const client = createAuthClient()

export async function middleware(request: NextRequest) {
  const { data: session } = await client.getSession({
    fetchOptions: {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  });

  const publicPaths = ["/", "/signin", "/signup"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  const isStaticFile = request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|otf|eot)$/i);

  if (!session && !isPublicPath && !isStaticFile) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api).*)"],
};
