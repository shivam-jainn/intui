import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth/auth';
import { pushMessage } from '@/lib/queues/rabbitmq';
import { upsertExecutionResult } from '@/lib/queues/execution-results-store';

export async function POST(req: NextRequest) {
  const { question_name, code, language } = await req.json();

  if (!question_name) {
    return NextResponse.json(
      { message: 'Cannot run code without the question name' },
      { status: 400 }
    );
  }

  if (!language) {
    return NextResponse.json(
      { message: 'Cannot run code without any language selected' },
      { status: 400 }
    );
  }

  if (!code || typeof code !== 'string' || code.length < 10) {
    return NextResponse.json(
      { message: 'No valid code exists.' },
      { status: 400 }
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });

  const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false';

  // When auth is enabled the user must be signed in. When auth is disabled
  // (local dev) allow submissions without a session.
  if (AUTH_ENABLED && !session?.user?.id) {
    return NextResponse.json(
      { message: 'You must be signed in to submit.' },
      { status: 401 }
    );
  }

  const jobId = randomUUID();
  const queueName = process.env.EXECUTION_QUEUE_NAME ?? 'execution_requests';
  const defaultDevWebhookBase = 'http://host.docker.internal:3000';
  const webappBaseUrl =
    process.env.WEBAPP_INTERNAL_URL
    ?? (process.env.NODE_ENV === 'development'
      ? defaultDevWebhookBase
      : req.nextUrl.origin);
  const webhookToken = process.env.EXECUTION_WEBHOOK_TOKEN;

  const requestBody = {
    jobId,
    questionName: question_name,
    userCode: code,
    language,
    isSubmission: true,
    userId: session?.user?.id,
    webhookUrl: `${webappBaseUrl}/api/execution/webhook`,
    webhookToken,
    enqueuedAt: new Date().toISOString(),
  };

  upsertExecutionResult({
    jobId,
    questionName: question_name,
    status: 'queued',
    language,
    userCode: code,
    isSubmission: true,
    userId: session?.user?.id,
  });

  try {
    const enqueueResult = await pushMessage(queueName, requestBody);

    if (!enqueueResult.success) {
      return NextResponse.json(
        {
          message: 'Failed to enqueue submission request.',
          error:
            process.env.NODE_ENV === 'development'
              ? enqueueResult.error
              : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Submission request queued.', jobId, status: 'queued' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { message: 'Some error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
