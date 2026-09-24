import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;
  const streak = db.getUserStreak(user.id);

  return NextResponse.json({
    success: true,
    streak
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;
  try {
    const body = await request.json().catch(() => ({}));
    const isSolved = Boolean(body.isSolved);

    const updatedStreak = db.recordUserActivity(user.id, isSolved);

    return NextResponse.json({
      success: true,
      streak: updatedStreak
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update streak' }, { status: 500 });
  }
}

