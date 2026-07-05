'use client';

import { useQuery } from '@tanstack/react-query';
import { getDesc } from '@/lib/common/playground/desc_and_driver';

export function useQuestionDesc(slug: string) {
  return useQuery({
    queryKey: ['question-desc', slug],
    queryFn: () => getDesc(slug),
    staleTime: 30 * 60 * 1000,
    enabled: !!slug,
  });
}
