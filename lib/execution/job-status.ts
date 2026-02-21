import { prisma } from '@/prisma/db';
import { auth } from '@/lib/auth/auth';
import {
  ExecutionJobResult,
  getExecutionResult,
  upsertExecutionResult,
} from '@/lib/queues/execution-results-store';

export type ExecutionStatusPayload = {
  jobId: string;
  status: 'completed' | 'failed' | 'queued' | 'processing';
  message?: string;
  error?: string;
  results?: Array<Record<string, unknown>>;
  completedAt?: string;
} & Record<string, unknown>;

const getResultArray = (result: unknown): Array<Record<string, unknown>> => {
  if (!result || typeof result !== 'object') {
    return [];
  }

  const data = result as Record<string, unknown>;
  return Array.isArray(data.results)
    ? (data.results as Array<Record<string, unknown>>)
    : [];
};

const isAccepted = (result: unknown): boolean => {
  const testResults = getResultArray(result);
  return (
    testResults.length > 0 &&
    testResults.every((value) => value.passed === true || value.output === true)
  );
};

const persistSubmissionIfNeeded = async (
  headers: Headers,
  current: ExecutionJobResult
) => {
  if (
    !current.isSubmission ||
    current.persisted ||
    !current.userId ||
    !current.questionName ||
    !current.language ||
    !current.userCode
  ) {
    return;
  }

  try {
    const session = await auth.api.getSession({ headers });
    if (!session?.user?.id || session.user.id !== current.userId) {
      return;
    }

    const question = await prisma.question.findUnique({
      where: { name: current.questionName },
      select: { id: true },
    });

    if (!question) {
      return;
    }

    const accepted = current.status === 'completed' && isAccepted(current.result);

    await prisma.submission.create({
      data: {
        questionId: question.id,
        userId: current.userId,
        code: current.userCode,
        language: current.language,
        status: accepted ? 'ACCEPTED' : 'WRONG_ANSWER',
      },
    });

    if (accepted) {
      await prisma.question.update({
        where: { id: question.id },
        data: { status: 'DONE' },
      });
    }

    upsertExecutionResult({
      ...current,
      persisted: true,
    });
  } catch {
    // Non-fatal for status endpoint.
  }
};

export const getExecutionJobStatus = async (
  headers: Headers,
  jobId: string
): Promise<ExecutionStatusPayload> => {
  const current = getExecutionResult(jobId);
  if (!current) {
    return { jobId, status: 'queued' };
  }

  await persistSubmissionIfNeeded(headers, current);

  if (current.status === 'failed') {
    return {
      jobId: current.jobId,
      status: current.status,
      message: 'Execution failed',
      error: current.error,
      results: getResultArray(current.result),
      completedAt: current.completedAt,
    };
  }

  return {
    jobId: current.jobId,
    status: current.status,
    ...(current.result && typeof current.result === 'object'
      ? (current.result as Record<string, unknown>)
      : {}),
    error: current.error,
    completedAt: current.completedAt,
  };
};
