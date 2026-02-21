import { NextRequest, NextResponse } from 'next/server';
import { upsertExecutionResult } from '@/lib/queues/execution-results-store';
import { prisma } from '@/prisma/db';

const logWebhook = (message: string) => {
  process.stdout.write(`[execution-webhook] ${message}\n`);
};

type WebhookPayload = {
  jobId: string;
  questionName?: string;
  status: 'completed' | 'failed' | 'queued' | 'processing';
  result?: unknown;
  error?: string;
  completedAt?: string;
  isSubmission?: boolean;
  language?: string;
  userCode?: string;
  userId?: string;
};

export async function POST(req: NextRequest) {
  const configuredToken = process.env.EXECUTION_WEBHOOK_TOKEN;
  const headerToken = req.headers.get('x-webhook-token') ?? '';

  if (configuredToken && headerToken !== configuredToken) {
    logWebhook('rejected unauthorized webhook request');
    return NextResponse.json({ message: 'Unauthorized webhook' }, { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;

  if (!payload?.jobId || !payload?.status) {
    logWebhook('rejected invalid webhook payload');
    return NextResponse.json({ message: 'Invalid webhook payload' }, { status: 400 });
  }

  logWebhook(
    `received jobId=${payload.jobId} status=${payload.status} question=${payload.questionName ?? ''}`
  );

  upsertExecutionResult({
    jobId: payload.jobId,
    questionName: payload.questionName ?? '',
    status: payload.status,
    result: payload.result,
    error: payload.error,
    completedAt: payload.completedAt,
    isSubmission: payload.isSubmission,
    language: payload.language,
    userCode: payload.userCode,
    userId: payload.userId,
  });

  logWebhook(`stored jobId=${payload.jobId} status=${payload.status}`);

  // If this webhook is for a submission that completed, persist the
  // submission and close the question (mark DONE) immediately. This
  // mirrors persistSubmissionIfNeeded but runs without a user session
  // because webhooks are authenticated with a token.
  if (payload.isSubmission && payload.status === 'completed') {
    try {
      const getResultArray = (result: unknown): Array<Record<string, unknown>> => {
        if (!result || typeof result !== 'object') return [];
        const data = result as Record<string, unknown>;
        return Array.isArray(data.results) ? (data.results as Array<Record<string, unknown>>) : [];
      };

      const isAccepted = (result: unknown): boolean => {
        const testResults = getResultArray(result);
        return (
          testResults.length > 0 &&
          testResults.every((value) => value.passed === true || value.output === true)
        );
      };

      const question = await prisma.question.findUnique({
        where: { name: payload.questionName ?? '' },
        select: { id: true },
      });

      if (question) {
        const accepted = isAccepted(payload.result);

        // Only create a DB submission if a userId was provided and the
        // corresponding user exists. When auth is disabled there may be no
        // matching user, so skip DB writes in that case.
        if (payload.userId) {
          const user = await prisma.user.findUnique({ where: { id: payload.userId } });
          if (user) {
            await prisma.submission.create({
              data: {
                questionId: question.id,
                userId: payload.userId,
                code: payload.userCode ?? '',
                language: payload.language ?? '',
                status: accepted ? 'ACCEPTED' : 'WRONG_ANSWER',
              },
            });

            if (accepted) {
              await prisma.question.update({ where: { id: question.id }, data: { status: 'DONE' } });
            }
          }
        }

        // mark persisted in in-memory store even if DB write was skipped
        upsertExecutionResult({
          jobId: payload.jobId,
          questionName: payload.questionName ?? '',
          status: payload.status,
          result: payload.result,
          error: payload.error,
          completedAt: payload.completedAt,
          isSubmission: payload.isSubmission,
          language: payload.language,
          userCode: payload.userCode,
          userId: payload.userId,
          persisted: true,
        });
      }
    } catch (e) {
      // non-fatal; keep webhook optimistic
      logWebhook(`failed to persist submission for jobId=${payload.jobId}`);
    }
  }

  return NextResponse.json({ ok: true });
}
