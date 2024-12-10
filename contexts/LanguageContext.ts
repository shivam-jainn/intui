import { Language, languageExtensions } from "@/lib/common/types/playground.types";
import { atom } from "jotai";

export const langAtom = atom<Language>("cpp");
