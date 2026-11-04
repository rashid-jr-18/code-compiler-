import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { syncBrightspaceCourseClasslist } from '@/lib/brightspaceContent';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Faculty or Admin role required' }, { status: 403 });
  }

  const result = await syncBrightspaceCourseClasslist(id);
  const updatedMembers = db.getCourseMembers(id);

  return NextResponse.json({
    success: result.success,
    count: result.count,
    error: result.error,
    members: updatedMembers
  });
}

