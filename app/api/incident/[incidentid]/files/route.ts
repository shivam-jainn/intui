import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export interface IncidentFile {
  path: string;
  content: string;
  readonly: boolean;
  language: string;
}

export interface IncidentData {
  report: string;
  files: IncidentFile[];
  availableLanguages: string[];
  entryFile: string;
}

function getLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".py": "python",
    ".cpp": "cpp",
    ".ts": "typescript",
    ".js": "javascript",
    ".go": "go",
    ".java": "java",
  };
  return map[ext] ?? "plaintext";
}

async function listFilesRecursive(dir: string, baseDir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__pycache__" || entry.name === "node_modules") continue;
        const nested = await listFilesRecursive(fullPath, baseDir);
        results.push(...nested);
      } else {
        results.push(path.relative(baseDir, fullPath));
      }
    }
  } catch {
    // directory doesn't exist
  }
  return results;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { incidentid: string } }
) {
  const { incidentid } = params;
  const lang = req.nextUrl.searchParams.get("language") ?? "python";

  const dataDir = path.join(process.cwd(), "data", "incidents", incidentid);

  // Read incident report
  let report = "";
  try {
    report = await fs.readFile(path.join(dataDir, "IncidentReport.md"), "utf8");
  } catch {
    return NextResponse.json({ message: "Incident not found" }, { status: 404 });
  }

  // Discover available languages
  const langBaseDir = path.join(dataDir, "language");
  let availableLanguages: string[] = [];
  try {
    const langEntries = await fs.readdir(langBaseDir, { withFileTypes: true });
    availableLanguages = langEntries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    availableLanguages = [];
  }

  if (!availableLanguages.includes(lang)) {
    if (availableLanguages.length === 0) {
      return NextResponse.json({ message: "No languages available for this incident" }, { status: 404 });
    }
  }

  const activeLang = availableLanguages.includes(lang) ? lang : availableLanguages[0];
  const langDir = path.join(langBaseDir, activeLang);
  const srcDir = path.join(langDir, "src");
  const testsDir = path.join(langDir, "tests");

  // List src (editable) files
  const srcFiles = await listFilesRecursive(srcDir, langDir);
  // List test (readonly) files
  const testFiles = await listFilesRecursive(testsDir, langDir);

  const files: IncidentFile[] = [];

  for (const relPath of srcFiles) {
    try {
      const content = await fs.readFile(path.join(langDir, relPath), "utf8");
      files.push({
        path: relPath,
        content,
        readonly: false,
        language: getLanguageFromPath(relPath),
      });
    } catch {
      // skip unreadable files
    }
  }

  for (const relPath of testFiles) {
    try {
      const content = await fs.readFile(path.join(langDir, relPath), "utf8");
      files.push({
        path: relPath,
        content,
        readonly: true,
        language: getLanguageFromPath(relPath),
      });
    } catch {
      // skip
    }
  }

  // Determine a sensible entry file (first src file)
  const entryFile = srcFiles[0] ?? "";

  return NextResponse.json({
    report,
    files,
    availableLanguages,
    entryFile,
  } satisfies IncidentData);
}
