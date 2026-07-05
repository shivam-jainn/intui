'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  hydrate,
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { useEffect, useRef } from 'react';

const PERSIST_KEY = 'intui-query-cache';
const STATIC_CACHE_MAX_AGE = 30 * 60 * 1000;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

function withoutAuthSession(clientState: any) {
  if (!clientState?.queries) return;
  clientState.queries = clientState.queries.filter(
    (q: any) => q.queryKey?.[0] !== 'auth-session'
  );
}

function restoreFromStorage(queryClient: QueryClient): boolean {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return false;

    const stored = JSON.parse(raw);
    if (stored.buster !== 'v1') return false;
    if (Date.now() - stored.timestamp > STATIC_CACHE_MAX_AGE) return false;

    withoutAuthSession(stored.clientState);
    hydrate(queryClient, stored.clientState);
    return true;
  } catch {
    localStorage.removeItem(PERSIST_KEY);
    return false;
  }
}

let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
    restoreFromStorage(browserQueryClient);
  }
  return browserQueryClient;
}

export default function TanstackQueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const persisted = useRef(false);

  useEffect(() => {
    if (persisted.current) return;
    persisted.current = true;

    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: PERSIST_KEY,
      throttleTime: 1000,
      serialize: (data) => {
        withoutAuthSession(data.clientState);
        return JSON.stringify(data);
      },
    });

    persistQueryClient({
      queryClient,
      persister,
      maxAge: STATIC_CACHE_MAX_AGE,
      buster: 'v1',
    });
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
