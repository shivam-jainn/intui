'use client';

import { useQuery } from '@tanstack/react-query';
import { Difficulty } from '@/lib/common/types/question.types';

type Topic = { topic: { name: string } };

export type Question = {
  id: number;
  displayOrder: number;
  slug: string;
  name: string;
  difficulty: Difficulty;
  topics: Topic[];
};

async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch('/api/questions');
  if (!res.ok) throw new Error('Failed to load questions');
  return res.json();
}

export function useQuestions() {
  return useQuery({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
