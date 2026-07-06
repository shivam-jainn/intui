import React, { type ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function P0Layout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user) {
    redirect('/signin');
  }

  // Record login activity and update/check badges
  try {
    const { handleLoginActivity } = await import('@/lib/badges');
    await handleLoginActivity(session.user.id);
  } catch (err) {
    console.error("Failed to update activity/badges in layout:", err);
  }

  return <>{children}</>;
}
