'use client';

import React from 'react';
import { Skeleton } from '@mantine/core';
import { useCachedSession } from '@/lib/hooks/useSession';
import Landing from '../Landing/Landing';
import MixerHome from '../Mixer/MixerHome';

export default function Home() {
  const { data: session, isPending } = useCachedSession();

  if (isPending) {
    return (
      <div style={{ padding: '2rem' }}>
        <Skeleton height={400} radius="xl" mb="md" />
        <Skeleton height={200} radius="xl" />
      </div>
    );
  }

  return <div>{session ? <MixerHome /> : <Landing />}</div>;
}
