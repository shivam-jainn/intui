import { atom } from "jotai";
import type { IncidentFile } from "@/app/api/incident/[incidentid]/files/route";

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  line?: number;
  duration?: number;
}

export interface RunResult {
  id: string;
  timestamp: number;
  isSubmission: boolean;
  status: string;
  passed: number;
  failed: number;
  total: number;
  stdout: string;
  stderr: string;
  testResults: TestResult[];
  // Legacy fields from Go executor (snake_case)
  output?: string;
  error?: string;
  test_results?: TestResult[];
}

// ── Core State ──────────────────────────────────────────
export const incidentFilesAtom = atom<IncidentFile[]>([]);
export const activeFilePathAtom = atom<string>("");
export const fileContentsAtom = atom<Record<string, string>>({});
export const incidentResultAtom = atom<RunResult | null>(null);
export const incidentRunningAtom = atom<boolean>(false);
export const incidentSubmissionAtom = atom<boolean>(false);
export const slaSecondsAtom = atom<number>(-1);
export const slaTotalSecondsAtom = atom<number>(-1);

export const incidentMetaAtom = atom<{
  title: string;
  severity: string;
  difficulty: string;
  service: string;
} | null>(null);

// ── Panel / Sidebar State ───────────────────────────────
export const fileTreeOpenAtom = atom<boolean>(true);
export const aiPanelOpenAtom = atom<boolean>(true);
export const testDrawerOpenAtom = atom<boolean>(false);
export const leftTabAtom = atom<"report" | "code">("report");

// ── Derived ─────────────────────────────────────────────
export const isModifiedAtom = atom((get) => {
  const files = get(incidentFilesAtom);
  const contents = get(fileContentsAtom);
  return files.some(
    (f) =>
      !f.readonly &&
      contents[f.path] !== undefined &&
      contents[f.path] !== f.content
  );
});

export const modifiedFilesAtom = atom((get) => {
  const files = get(incidentFilesAtom);
  const contents = get(fileContentsAtom);
  return files
    .filter(
      (f) =>
        !f.readonly &&
        contents[f.path] !== undefined &&
        contents[f.path] !== f.content
    )
    .map((f) => f.path);
});

// Derived: test pass rate
export const testPassRateAtom = atom((get) => {
  const result = get(incidentResultAtom);
  if (!result) return null;

  const testRows = Array.isArray(result.test_results)
    ? result.test_results
    : [];

  if (testRows.length > 0) {
    const passed = testRows.filter(
      (tc: any) => tc?.passed === true || tc?.result === true
    ).length;
    return { passed, total: testRows.length, rate: passed / testRows.length };
  }

  const total =
    (typeof result.passed === "number" ? result.passed : 0) +
    (typeof result.failed === "number" ? result.failed : 0);
  if (total === 0) return null;
  const passed =
    typeof result.passed === "number" ? result.passed : 0;
  return { passed, total, rate: passed / total };
});
