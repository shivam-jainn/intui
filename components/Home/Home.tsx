'use client';

import { Skeleton } from '@mantine/core';
import React from 'react';
import Dashboard from '../Dashboard/Dashboard';
import Landing from '../Landing/Landing';
import { useAuth } from '@/lib/auth-client';

export default function Home() {
  const { isAuthenticated, isPending } = useAuth();

  if (isPending) {
    return (
      <div style={{ padding: '2rem' }}>
        <Skeleton height={400} radius="xl" mb="md" />
        <Skeleton height={200} radius="xl" />
      </div>
    );
  }

  return (
    <div>
      {isAuthenticated ? <Dashboard /> : <Landing />}
    </div>
  );
}
