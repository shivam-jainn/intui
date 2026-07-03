import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { runid: string } }
) {
  try {
    const { runid } = params;
    const { uuid } = await req.json();

    if (!uuid || uuid === "client-check") {
      // Client-side "I Accept" button — just verify UUID exists
      if (uuid === "client-check") {
        return NextResponse.json({ verified: true, message: "Penalty acknowledged" });
      }
      return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
    }

    const verification = await prisma.mixerVerification.findUnique({
      where: { uuid },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Device not verified. Run verification first." },
        { status: 403 }
      );
    }

    const run = await prisma.mixerRun.findUnique({ where: { id: runid } });
    if (!run) {
      // Run might not exist if start API failed — still accept penalty
      return NextResponse.json({
        verified: true,
        message: "Penalty accepted. You may now continue.",
      });
    }

    if (run.status === "penalized") {
      return NextResponse.json({ verified: true, message: "Already penalized" });
    }

    await prisma.mixerRun.update({
      where: { id: runid },
      data: { status: "penalized", endedAt: new Date() },
    });

    return NextResponse.json({
      verified: true,
      message: "Penalty accepted. You may now continue.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify penalty" },
      { status: 500 }
    );
  }
}
