import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { handleLoginActivity } from '@/lib/badges';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    
    if (session?.user?.id) {
      await handleLoginActivity(session.user.id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ACTIVITY API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
