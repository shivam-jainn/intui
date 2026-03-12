'use client';

import React from 'react'
import MixerHome from '../Mixer/MixerHome'
import Landing from '../Landing/Landing'
import { useSession } from '@/lib/auth-client'
import { Skeleton } from '@mantine/core'

export default function Home() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div style={{ padding: '2rem' }}>
        <Skeleton height={400} radius="xl" mb="md" />
        <Skeleton height={200} radius="xl" />
      </div>
    )
  }

  return (
    <div>
      {session ? <MixerHome /> : <Landing />}
    </div>
  )
}
