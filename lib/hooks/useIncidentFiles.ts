'use client';

import { useQuery } from '@tanstack/react-query';
import type { IncidentData } from '@/app/api/incident/[incidentid]/files/route';

async function fetchIncidentFiles(incidentId: string, language: string): Promise<IncidentData> {
  const res = await fetch(
    `/api/incident/${encodeURIComponent(incidentId)}/files?language=${language}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useIncidentFiles(incidentId: string, language: string) {
  return useQuery({
    queryKey: ['incident-files', incidentId, language],
    queryFn: () => fetchIncidentFiles(incidentId, language),
    staleTime: 30 * 60 * 1000,
    enabled: !!incidentId && !!language,
  });
}
