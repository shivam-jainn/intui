'use client';

import { useQuery } from '@tanstack/react-query';

export type Incident = {
  id: number;
  slug: string;
  title: string;
  severity: string;
  difficulty: string;
  service: string;
  summary: string;
  slaMinutes: number;
};

async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch('/api/incidents');
  if (!res.ok) throw new Error('Failed to load incidents');
  return res.json();
}

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
    staleTime: 5 * 60 * 1000,
  });
}
