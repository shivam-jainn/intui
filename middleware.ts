import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value; // Ensure safe access

  const publicPaths = ["/", "/signup", "/signin"];
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname);

  // Allow static files and images
  const isStaticFile = req.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|otf|eot)$/i);

  if (!token && !isPublicPath && !isStaticFile) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to all routes except static files, images, API routes, and Next.js assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|api).*)"],
};
