import { NextRequest, NextResponse } from 'next/server';
import { getExecutionJobStatus } from '@/lib/execution/job-status';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const payload = await getExecutionJobStatus(req.headers, params.jobId);
  return NextResponse.json(payload);
}
