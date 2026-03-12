import { atom } from "jotai";
import type { IncidentFile } from "@/app/api/incident/[incidentid]/files/route";

// The files loaded for the incident, keyed by path
export const incidentFilesAtom = atom<IncidentFile[]>([]);

// The currently active file path in the editor
export const activeFilePathAtom = atom<string>("");

// Map of modified file content (path -> content)
export const fileContentsAtom = atom<Record<string, string>>({});

// Test run result
export const incidentResultAtom = atom<any>(null);

// Loading state for test run
export const incidentRunningAtom = atom<boolean>(false);
