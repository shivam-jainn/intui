export type ExecutionJobResult = {
  jobId: string;
  questionName: string;
  status: 'completed' | 'failed' | 'queued' | 'processing';
  result?: unknown;
  error?: string;
  completedAt?: string;
  isSubmission?: boolean;
  language?: string;
  userCode?: string;
  userId?: string;
  persisted?: boolean;
};

const globalStore = globalThis as unknown as {
  executionResultStore?: Map<string, ExecutionJobResult>;
};

const store = globalStore.executionResultStore ?? new Map<string, ExecutionJobResult>();

if (!globalStore.executionResultStore) {
  globalStore.executionResultStore = store;
}

export const upsertExecutionResult = (value: ExecutionJobResult) => {
  store.set(value.jobId, value);
};

export const getExecutionResult = (jobId: string): ExecutionJobResult | null => {
  return store.get(jobId) ?? null;
};
