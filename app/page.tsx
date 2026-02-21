'use client';

import React from 'react';
import { Loader } from '@mantine/core';
import Landing from '@/components/Landing/Landing';
import Home from '@/components/Home/Home';
import { useSession } from '@/lib/auth-client';

export default function Page() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return null;
  }

  return (
    <div style={{ overflow: 'auto' }}>
      {session !== null ? <Home /> : <Landing />}
    </div>
  );
}
