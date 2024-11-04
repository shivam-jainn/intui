import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { question: string } }
) {
  const { question } = params;
  
  const questionObject = await prisma.question.findUnique({
    where:{
      name:question
    }
  });

  return NextResponse.json(questionObject);
}
