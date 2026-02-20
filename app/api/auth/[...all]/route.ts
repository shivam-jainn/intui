import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse, NextRequest } from "next/server";

const handler = toNextJsHandler(auth);

export async function POST(req: NextRequest) {
  if (process.env.AUTH_ENABLED === "false") {
    return NextResponse.json({ message: "Auth is disabled in this environment." }, { status: 404 });
  }
  return handler.POST(req as any);
}

export async function GET(req: NextRequest) {
  if (process.env.AUTH_ENABLED === "false") {
    return NextResponse.json({ message: "Auth is disabled in this environment." }, { status: 404 });
  }
  return handler.GET(req as any);
}
