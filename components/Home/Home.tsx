'use client';

import React from 'react';

import { useCachedSession } from '@/lib/hooks/useSession';
import Landing from '../Landing/Landing';
import MixerHome from '../Mixer/MixerHome';

export default function Home() {
  const { data: session, isPending } = useCachedSession();

  if (isPending) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="pixel-skeleton" style={{ height: 400 }} />
        <div className="pixel-skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  return <div>{session ? <MixerHome /> : <Landing />}</div>;
}
