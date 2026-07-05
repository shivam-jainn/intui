import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ incidentid: string }> }
) {
  const { incidentid } = await params;

  const incident = await prisma.incident.findUnique({
    where: { slug: incidentid },
    select: { id: true },
  });

  if (!incident) {
    return NextResponse.json([], { status: 200 });
  }

  const submissions = await prisma.incidentSubmission.findMany({
    where: { incidentId: incident.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(submissions);
}
