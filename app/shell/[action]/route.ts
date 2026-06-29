import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const VALID_ACTIONS = [
  'wallpaper',
  'terminal',
  'dock',
  'screensaver',
  'notification',
  'hostname',
  'finder',
  'voice',
  'browser',
  'revert',
  'verify',
  'forkbomb',
  'network-kill',
  'tmpfill',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { action } = params;

  if (!VALID_ACTIONS.includes(action)) {
    return new NextResponse('Invalid action', { status: 400 });
  }

  const sessionId = request.nextUrl.searchParams.get('session');

  if (!sessionId) {
    return new NextResponse('Missing session parameter', { status: 400 });
  }

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'mixer', `${action}.sh`);
    let scriptContent = await readFile(scriptPath, 'utf-8');

    scriptContent = scriptContent.replace(/\$\{SESSION_ID\}/g, sessionId);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    scriptContent = scriptContent.replace(/\$\{BASE_URL\}/g, baseUrl);

    return new NextResponse(scriptContent, {
      headers: {
        'Content-Type': 'text/x-shellscript',
        'Content-Disposition': `attachment; filename="${action}.sh"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return new NextResponse('Script not found', { status: 404 });
  }
}
