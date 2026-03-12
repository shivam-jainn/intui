import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import P0SimulationHome from '@/components/P0Simulation/P0SimulationHome';

export default async function P0Page() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user) {
    redirect('/signin');
  }

  return <P0SimulationHome />;
}