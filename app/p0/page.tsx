import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import P0SimulationHome from '@/components/P0Simulation/P0SimulationHome';
import { auth } from '@/lib/auth';

export default async function P0Page() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user) {
    redirect('/signin');
  }

  return <P0SimulationHome />;
}
