import { NextRequest } from 'next/server';
import { getExecutionJobStatus } from '@/lib/execution/job-status';

const logStream = (message: string) => {
  process.stdout.write(`[execution-sse] ${message}\n`);
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isTerminalStatus = (status: unknown) =>
  status === 'completed' || status === 'failed';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        if (closed) {
          return;
        }

        const status =
          payload && typeof payload === 'object' && 'status' in payload
            ? String((payload as Record<string, unknown>).status)
            : 'unknown';
        logStream(`emit jobId=${params.jobId} status=${status}`);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        logStream(`close jobId=${params.jobId}`);
        controller.close();
      };

      req.signal.addEventListener('abort', close);
      logStream(`open jobId=${params.jobId}`);

      const run = async () => {
        const timeoutAt = Date.now() + 90_000;

        while (!closed && Date.now() < timeoutAt) {
          const payload = await getExecutionJobStatus(req.headers, params.jobId);
          send(payload);

          if (isTerminalStatus(payload.status)) {
            await sleep(100);
            close();
            return;
          }

          await sleep(1000);
        }

        if (!closed) {
          send({
            jobId: params.jobId,
            status: 'queued',
            message: 'Execution is still in progress. Reconnect stream.',
          });
          close();
        }
      };

      run().catch((error: unknown) => {
        send({
          jobId: params.jobId,
          status: 'failed',
          message: 'SSE stream failed',
          error: error instanceof Error ? error.message : String(error),
        });
        logStream(
          `error jobId=${params.jobId} message=${error instanceof Error ? error.message : String(error)}`
        );
        close();
      });
    },
    cancel() {
      closed = true;
      logStream(`cancel jobId=${params.jobId}`);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
