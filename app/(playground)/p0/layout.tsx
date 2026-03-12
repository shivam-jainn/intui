import React, { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export default async function P0Layout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user) {
    redirect('/signin');
  }

  return <>{children}</>;
}
