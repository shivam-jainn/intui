import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { IssueStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { question: string } }
) {
  const { question } = params;

  try {
    const questionObject = await prisma.question.findUnique({
      where: { name: question },
      include: {
        topics: { include: { topic: true } },
        companies: { include: { company: true } },
      },
    });

    return NextResponse.json(questionObject);
  } catch (error: any) {
    console.warn("prisma: failed to fetch question — returning null. Reason:", (error && error.message) ? error.message.split('\n')[0] : error);
    return NextResponse.json(null);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { question: string } }
) {
  const { question } = params;
  try {
    const body = await req.json();
    const { status } = body as { status: IssueStatus };

    if (!status || !Object.values(IssueStatus).includes(status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be TODO, IN_PROGRESS, or DONE." },
        { status: 400 }
      );
    }

    const updated = await prisma.question.update({
      where: { name: question },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update question status:", error?.message);
    return NextResponse.json({ message: "Failed to update status" }, { status: 500 });
  }
}
