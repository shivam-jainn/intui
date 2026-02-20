import { createAuthClient } from "better-auth/react";

// Toggle client-side auth behavior using NEXT_PUBLIC_AUTH_ENABLED
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false";

let _signIn: any;
let _signUp: any;
let _useSession: any;
let _getSession: any;
let _signOut: any;

if (AUTH_ENABLED) {
  const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  });

  _signIn = authClient.signIn;
  _signUp = authClient.signUp;
  _useSession = authClient.useSession;
  _getSession = authClient.getSession;
  _signOut = authClient.signOut;
} else {
  // simple no-op / stub implementations for local dev when auth is disabled
  _signIn = {
    social: async (_opts: any) => ({ data: null, error: null }),
    // provide same shape as `authClient.signIn` where used (SocialSignIn)
  } as any;
  _signUp = async () => ({ data: null, error: null });
  _useSession = () => ({ data: null, isPending: false });
  _getSession = async () => null;
  _signOut = async () => ({ ok: true });
}

export const signIn = _signIn;
export const signUp = _signUp;
export const useSession = _useSession;
export const getSession = _getSession;
export const signOut = _signOut;
