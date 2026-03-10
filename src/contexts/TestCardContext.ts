import { atom } from "jotai";

export const resultAtom = atom<"testcases"|"results">("testcases");

export const resultDataAtom = atom(null);