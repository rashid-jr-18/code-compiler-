import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCourseAccess, requireRole } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireCourseAccess(request, id);
  if (auth instanceof NextResponse) return auth;

  const members = db.getCourseMembers(id);
  return NextResponse.json(members);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Only Admin or assigned Faculty can add members to a course
  const auth = requireRole(request, ['ADMIN', 'FACULTY']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    const member = db.addCourseMember(id, userId, role);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add course member' }, { status: 500 });
  }
}

