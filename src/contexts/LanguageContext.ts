import { Language, languageExtensions } from "@/services/common/types/playground.types";
import { atom } from "jotai";

export const langAtom = atom<Language>("cpp");
