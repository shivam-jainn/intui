import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(incidents);
  } catch (err: any) {
    console.error("[GET /api/incidents]", err);
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
