'use client';

import { useQuery } from '@tanstack/react-query';

export type IncidentSubmission = {
  id: number;
  code: string;
  language: string;
  status: string;
  timeTaken: number | null;
  spaceTaken: number | null;
  createdAt: string;
};

async function fetchIncidentSubmissions(incidentId: string): Promise<IncidentSubmission[]> {
  const res = await fetch(`/api/incident/${encodeURIComponent(incidentId)}/submissions`);
  if (!res.ok) return [];
  return res.json();
}

export function useIncidentSubmissions(incidentId: string) {
  return useQuery({
    queryKey: ['incident-submissions', incidentId],
    queryFn: () => fetchIncidentSubmissions(incidentId),
    staleTime: 30 * 1000,
    enabled: !!incidentId,
  });
}
