import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const courseId = request.nextUrl.searchParams.get('courseId') || undefined;

  const profile = db.getUserProfileStats(id, courseId);

  return NextResponse.json({
    success: true,
    profile
  });
}
