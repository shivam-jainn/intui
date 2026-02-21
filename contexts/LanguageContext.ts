import { atom } from 'jotai';
import { Language, languageExtensions } from '@/lib/common/types/playground.types';

export const langAtom = atom<Language>('cpp');
