import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

export async function POST(req: NextRequest) {
  try {
    const { runId, userId } = await req.json();

    if (!runId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const run = await prisma.mixerRun.findUnique({ where: { id: runId } });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (run.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.mixerRun.update({
      where: { id: runId },
      data: {
        status: "submitted",
        submittedAt: new Date(),
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ runId: updated.id, status: updated.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit mixer run" },
      { status: 500 }
    );
  }
}
