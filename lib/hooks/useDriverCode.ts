'use client';

import { useQuery } from '@tanstack/react-query';
import { getDriver } from '@/lib/common/playground/desc_and_driver';
import type { Language } from '@/lib/common/types/playground.types';

export function useDriverCode(slug: string, language: Language) {
  return useQuery({
    queryKey: ['question-driver', slug, language],
    queryFn: () => getDriver(slug, language),
    staleTime: 30 * 60 * 1000,
    enabled: !!slug && !!language,
  });
}
