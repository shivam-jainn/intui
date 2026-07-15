import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

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
  slaMinutes?: number;
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
  { params }: { params: Promise<{ incidentid: string }> }
) {
  const { incidentid } = await params;
  const requestedLang = req.nextUrl.searchParams.get('language') ?? 'python';
  const storage = getStorage();

  let manifest: IncidentManifest;
  try {
    const manifestBuffer = await storage.download(`incidents/${incidentid}/manifest.json`);
    manifest = JSON.parse(manifestBuffer.toString('utf8')) as IncidentManifest;
  } catch {
    return NextResponse.json({ message: 'Incident manifest not found' }, { status: 404 });
  }

  const activeLang = selectLanguage(manifest, requestedLang);
  if (!activeLang) {
    return NextResponse.json(
      { message: 'No languages available for this incident' },
      { status: 404 }
    );
  }

  const files = manifest.filesByLanguage?.[activeLang] ?? [];
  const availableLanguages =
    manifest.availableLanguages.length > 0
      ? manifest.availableLanguages
      : Object.keys(manifest.filesByLanguage ?? {});
  const fallbackEntryFile = files.find((file) => !file.readonly)?.path ?? files[0]?.path ?? '';
  const entryFile = manifest.entryFileByLanguage?.[activeLang] ?? fallbackEntryFile;

  let slaMinutes = 60;
  try {
    const metadataBuffer = await storage.download(`incidents/${incidentid}/metadata.json`);
    const metadata = JSON.parse(metadataBuffer.toString('utf8'));
    if (metadata && typeof metadata.slaMinutes === 'number') {
      slaMinutes = metadata.slaMinutes;
    } else if (metadata && typeof metadata.sla === 'number') {
      slaMinutes = metadata.sla;
    }
  } catch {
    try {
      const incidentJsonBuffer = await storage.download(`incidents/${incidentid}/incident.json`);
      const incidentJson = JSON.parse(incidentJsonBuffer.toString('utf8'));
      if (incidentJson && typeof incidentJson.slaMinutes === 'number') {
        slaMinutes = incidentJson.slaMinutes;
      } else if (incidentJson && typeof incidentJson.sla === 'number') {
        slaMinutes = incidentJson.sla;
      }
    } catch {}
  }

  return NextResponse.json({
    report: manifest.report,
    files,
    availableLanguages,
    entryFile,
    slaMinutes,
  } satisfies IncidentData);
}
