"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "@/lib/auth-client";
import { useMemo } from "react";

export type SessionData = Awaited<ReturnType<typeof getSession>>;
export type Session = NonNullable<SessionData["data"]>;

const SESSION_KEY = ["auth-session"] as const;

async function fetchSession(): Promise<SessionData> {
  return getSession();
}

export function useCachedSession() {
  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const session = query.data?.data;
    return {
      data: (session ?? null) as Session | null,
      isPending: query.isLoading,
      error: query.error,
    };
  }, [query.data, query.isLoading, query.error]);
}

export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SESSION_KEY });
}
