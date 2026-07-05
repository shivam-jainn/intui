import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { runid: string } }
) {
  try {
    const { runid } = params;
    const { uuid } = await req.json();

    // Frontend polls with "client-check" — skip UUID validation,
    // just return whether the terminal script already registered.
    if (uuid === "client-check") {
      const run = await prisma.mixerRun.findUnique({ where: { id: runid } });
      return NextResponse.json({
        verified: run?.status === "penalized",
      });
    }

    if (!uuid) {
      return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
    }

    // Auto-register device if the terminal script was run —
    // no need for a separate verification step.
    const verification = await prisma.mixerVerification.findUnique({
      where: { uuid },
    });
    if (!verification) {
      await prisma.mixerVerification.create({
        data: { uuid, verifiedAt: new Date() },
      });
    }

    const run = await prisma.mixerRun.findUnique({ where: { id: runid } });
    if (run?.status === "penalized") {
      return NextResponse.json({ verified: true, message: "Already penalized" });
    }
    if (!run) {
      return NextResponse.json({
        verified: true,
        message: "Penalty accepted. You may now continue.",
      });
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
