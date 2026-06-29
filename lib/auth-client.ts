import { createAuthClient } from 'better-auth/react';
import { useMemo } from 'react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3001',
});

export const { signIn, signUp, useSession, getSession, signOut } = authClient;

export function useAuth() {
  const { data, isPending } = useSession();
  return useMemo(
    () => ({
      user: data?.user ?? null,
      isAuthenticated: !!data?.user,
      isPending,
    }),
    [data?.user, isPending],
  );
}
