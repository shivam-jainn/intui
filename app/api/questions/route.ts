import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

export async function GET(
  req: NextRequest,
  res : NextResponse
) {
  
  const questionObject = await prisma.question.findMany({
    include:{
      topics: {
        include:{
          topic : true
        }
      }
    }
  });
  console.log("questionObject : ", questionObject);
  return NextResponse.json(questionObject);
}
