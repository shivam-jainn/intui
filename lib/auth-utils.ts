import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { auth } from './auth';

export async function getSession() {
  const h = await headers();
  return auth.api.getSession({ headers: h });
}

export async function getUserId(request?: NextRequest): Promise<string | null> {
  if (request) {
    return request.headers.get('x-user-id');
  }
  const session = await getSession();
  return session?.user?.id ?? null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}
