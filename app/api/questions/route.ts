import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

export async function GET(
  req: NextRequest,
  res : NextResponse
) {
  try {
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
  } catch (error: any) {
    // Graceful fallback for local development when DB isn't available
    console.warn("prisma: failed to fetch questions — returning empty list. Reason:", (error && error.message) ? error.message.split('\n')[0] : error);
    return NextResponse.json([]);
  }
}
