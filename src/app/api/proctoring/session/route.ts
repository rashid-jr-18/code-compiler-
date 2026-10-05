import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignmentId');
  const learnerId = searchParams.get('learnerId');

  if (!assignmentId || !learnerId) {
    return NextResponse.json({ error: 'Missing assignmentId or learnerId' }, { status: 400 });
  }

  const session = db.getProctoringSession(assignmentId, learnerId);
  return NextResponse.json({ session: session || null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignmentId, learnerId, consentAcceptedAt } = body;

    if (!assignmentId || !learnerId) {
      return NextResponse.json({ error: 'Missing assignmentId or learnerId' }, { status: 400 });
    }

    const session = db.getOrCreateProctoringSession(assignmentId, learnerId, consentAcceptedAt);
    return NextResponse.json({ success: true, session });
  } catch (error: unknown) {
    console.error('[Proctoring Session API] Error:', error);
    return NextResponse.json({ error: 'Failed to process proctoring session' }, { status: 500 });
  }
}
