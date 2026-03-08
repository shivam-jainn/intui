import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 30_000;

let consecutiveFailures = 0;
let breakerOpenUntil = 0;
let lastKnownGood: unknown[] = [];

const isBreakerOpen = () => Date.now() < breakerOpenUntil;

export async function GET() {
  if (isBreakerOpen()) {
    return NextResponse.json(lastKnownGood, {
      status: 200,
      headers: { "x-circuit-breaker": "open" },
    });
  }

  try {
    const questionObject = await prisma.question.findMany({
      include: {
        topics: {
          include: {
            topic: true,
          },
        },
      },
    });

    consecutiveFailures = 0;
    breakerOpenUntil = 0;
    lastKnownGood = questionObject;

    return NextResponse.json(questionObject);
  } catch (error) {
    consecutiveFailures += 1;

    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      breakerOpenUntil = Date.now() + COOLDOWN_MS;
    }

    console.error("[api/questions] fetch failed:", error);

    return NextResponse.json(
      {
        error: "Questions are temporarily unavailable",
        breakerOpen: isBreakerOpen(),
      },
      { status: 503 },
    );
  }
}
