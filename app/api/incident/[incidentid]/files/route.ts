import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

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

interface IncidentManifest {
  version: number;
  report: string;
  availableLanguages: string[];
  defaultLanguage?: string;
  entryFileByLanguage?: Record<string, string>;
  filesByLanguage: Record<string, IncidentFile[]>;
}

function selectLanguage(manifest: IncidentManifest, requestedLang: string): string | null {
  const languages =
    manifest.availableLanguages.length > 0
      ? manifest.availableLanguages
      : Object.keys(manifest.filesByLanguage ?? {});

  if (languages.length === 0) {
    return null;
  }

  if (languages.includes(requestedLang)) {
    return requestedLang;
  }

  if (manifest.defaultLanguage && languages.includes(manifest.defaultLanguage)) {
    return manifest.defaultLanguage;
  }

  return languages[0];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { incidentid: string } }
) {
  const { incidentid } = params;
  const requestedLang = req.nextUrl.searchParams.get("language") ?? "python";
  const storage = getStorage();

  let manifest: IncidentManifest;
  try {
    const manifestBuffer = await storage.download(`incidents/${incidentid}/manifest.json`);
    manifest = JSON.parse(manifestBuffer.toString("utf8")) as IncidentManifest;
  } catch {
    return NextResponse.json({ message: "Incident manifest not found" }, { status: 404 });
  }

  const activeLang = selectLanguage(manifest, requestedLang);
  if (!activeLang) {
    return NextResponse.json({ message: "No languages available for this incident" }, { status: 404 });
  }

  const files = manifest.filesByLanguage?.[activeLang] ?? [];
  const availableLanguages =
    manifest.availableLanguages.length > 0
      ? manifest.availableLanguages
      : Object.keys(manifest.filesByLanguage ?? {});
  const fallbackEntryFile = files.find((file) => !file.readonly)?.path ?? files[0]?.path ?? "";
  const entryFile = manifest.entryFileByLanguage?.[activeLang] ?? fallbackEntryFile;

  return NextResponse.json({
    report: manifest.report,
    files,
    availableLanguages,
    entryFile,
  } satisfies IncidentData);
}
