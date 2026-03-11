import { atom } from "jotai";

export const resultAtom = atom<"testcases"|"results">("testcases");

export const resultDataAtom = atom<any>(null);

export const submissionAtom = atom<boolean>(false);