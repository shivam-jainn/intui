import { atom } from "jotai";

export const screenLockupAtom = atom<boolean>(false);
export const lockSessionIdAtom = atom<string>("");
export const lockConsequenceAtom = atom<string>("");
