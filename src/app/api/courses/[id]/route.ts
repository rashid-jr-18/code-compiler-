import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCourseAccess } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireCourseAccess(request, id);
  if (auth instanceof NextResponse) return auth;

  const course = db.getCourseById(id);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const members = db.getCourseMembers(id);
  const assignments = db.getAssignmentsByCourse(id);

  return NextResponse.json({
    ...course,
    members,
    assignments
  });
}

