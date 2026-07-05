import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type MixerDifficulty = 'easy' | 'medium' | 'hard';
export type TimerMode = 'timer' | 'mixer';
export type MixerRunStatus = 'pending' | 'running' | 'submitted' | 'failed' | 'penalized';

export interface MixerRun {
  runId: string;
  difficulty: MixerDifficulty;
  duration: number;
  status: MixerRunStatus;
  startedAt: string;
}

export const mixerVerifiedAtom = atomWithStorage<boolean>('mixer_verified', false);

export const mixerRunAtom = atom<MixerRun | null>(null);

export const shadowbanAtom = atom<{
  banned: boolean;
  referralCode?: string;
  reason?: string;
}>({ banned: false });

export const penaltyPopupOpenAtom = atom<boolean>(false);
