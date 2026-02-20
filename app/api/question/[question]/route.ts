import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { question: string } }
) {
  const { question } = params;

  try {
    const questionObject = await prisma.question.findUnique({
      where:{
        name:question
      },
      include:{
        topics:{
          include:{
            topic:true
          }
        }
      }
    });

    return NextResponse.json(questionObject);
  } catch (error: any) {
    console.warn("prisma: failed to fetch question — returning null. Reason:", (error && error.message) ? error.message.split('\n')[0] : error);
    return NextResponse.json(null);
  }
}
