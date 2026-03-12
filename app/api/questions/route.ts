import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

export async function GET(
  req: NextRequest,
  res : NextResponse
) {
  
  const questionObject = await prisma.question.findMany({
    orderBy: {
      displayOrder: 'asc',
    },
    include:{
      topics: {
        include:{
          topic : true
        }
      }
    }
  });
  return NextResponse.json(questionObject);
}
