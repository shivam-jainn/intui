'use client';

import { useQuery } from '@tanstack/react-query';

export type Submission = {
  id: number;
  code: string;
  language: string;
  status: string;
  timeTaken: number | null;
  spaceTaken: number | null;
  createdAt: string;
};

export type QuestionDetail = {
  id: number;
  slug: string;
  name: string;
  difficulty: string;
  description?: string;
  companies?: string[];
  topics: { topic: { name: string } }[];
  Submission?: Submission[];
};

async function fetchQuestion(slug: string): Promise<QuestionDetail> {
  const res = await fetch(`/api/question/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error('Failed to load question');
  return res.json();
}

export function useQuestion(slug: string) {
  return useQuery({
    queryKey: ['question', slug],
    queryFn: () => fetchQuestion(slug),
    staleTime: 2 * 60 * 1000,
    enabled: !!slug,
  });
}
