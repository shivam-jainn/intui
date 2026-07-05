import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { executorService } from '@/lib/executor-config';
import { auth } from '@/lib/auth';
import { prisma } from '@/prisma/db';
import { checkSpeedBadges, updateStreakAndCheckBadges } from '@/lib/badges';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const { incident_slug, code, language, entryFile, files } = await req.json();

  if (!incident_slug) {
    return NextResponse.json(
      { message: 'Cannot run incident without the incident slug' },
      { status: 400 }
    );
  }

  if (!language) {
    return NextResponse.json(
      { message: 'Cannot run incident without any language selected' },
      { status: 400 }
    );
  }

  if (!code || typeof code !== 'string' || code.length < 10) {
    return NextResponse.json({ message: 'No valid code exists.' }, { status: 400 });
  }

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { message: 'Incident files are required for execution.' },
      { status: 400 }
    );
  }

  const { valid, message } = executorService.validateConfig();
  if (!valid) {
    return NextResponse.json({ message: message || 'Configuration error.' }, { status: 500 });
  }

  const { incidentUrl, isDevelopment, targetAudience } = executorService.getConfig();

  const requestBody = {
    incidentName: incident_slug,
    userCode: code,
    language,
    entryFile,
    files,
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!isDevelopment) {
      if (!targetAudience) {
        throw new Error('Target audience must be defined for production execution authentication.');
      }

      const auth = new GoogleAuth({
        credentials: {
          client_email: process.env.EXEC_CLIENT_EMAIL,
          private_key: process.env.EXEC_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
      });

      const idTokenClient = await auth.getIdTokenClient(targetAudience);
      const idToken = await idTokenClient.idTokenProvider.fetchIdToken(targetAudience);

      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const response = await fetch(incidentUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Incident Execution Error: ${data?.error || 'Unknown error'} (HTTP ${response.status})`
      );
    }

    const responseBody = {
      incidentName: data.incidentName,
      status: data.status,
      passed: data.passed,
      output: data.output,
      error: data.error,
    };

    if (session?.user?.id) {
      try {
        const incident = await prisma.incident.findUnique({
          where: { slug: incident_slug },
          select: { id: true, severity: true },
        });

        if (incident) {
          await prisma.incidentSubmission.create({
            data: {
              incidentId: incident.id,
              userId: session.user.id,
              code,
              language,
              status: data.status || 'Unknown',
              timeTaken: data.timeTaken ?? null,
              spaceTaken: data.memoryUsedKB ?? null,
            },
          });

          if (data.status === 'Accepted') {
            await updateStreakAndCheckBadges(session.user.id);
            if (incident.severity === 'P0' && typeof data.timeTaken === 'number') {
              await checkSpeedBadges(session.user.id, data.timeTaken);
            }
          }
        }
      } catch (dbError) {
        console.error('Failed to save incident submission to DB:', dbError);
      }
    }

    return NextResponse.json(responseBody, { status: response.status });
  } catch (error: any) {
    console.error('Incident execution error:', error.message);
    return NextResponse.json(
      { message: 'Some error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
