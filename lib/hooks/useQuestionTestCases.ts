'use client';

import { useQuery } from '@tanstack/react-query';
import { getTestCases } from '@/lib/common/playground/desc_and_driver';

export function useQuestionTestCases(slug: string) {
  return useQuery({
    queryKey: ['question-testcases', slug],
    queryFn: () => getTestCases(slug),
    staleTime: 30 * 60 * 1000,
    enabled: !!slug,
  });
}
