import { atom } from 'jotai';
import type { TimerStatus, TimerMode } from '@/components/Timer/Timer';

export const timerStatusAtom = atom<TimerStatus>('idle');
export const timerModeAtom = atom<TimerMode>('timer');
export const timerPopupAtom = atom<'config' | 'verify' | 'penalty' | null>(null);

// Defaults and SLA
export const timerDefaultConfigAtom = atom<{
  type: 'question' | 'incident' | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  slaMinutes?: number;
}>({ type: null });
