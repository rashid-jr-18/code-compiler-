import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;
  const allCourses = db.getCourses();

  // Admin can see all courses
  if (user.role === 'ADMIN') {
    return NextResponse.json(allCourses);
  }

  // Faculty and Learner see only courses they are members of
  const memberCourses = allCourses.filter(course => {
    const members = db.getCourseMembers(course.id);
    return members.some(m => m.userId === user.id);
  });

  return NextResponse.json(memberCourses);
}

export async function POST(request: NextRequest) {
  // Only Admin or Faculty can create courses
  const auth = requireRole(request, ['ADMIN', 'FACULTY']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, ltiContextId } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 });
    }

    const course = db.createCourse(title.trim(), ltiContextId?.trim());

    // If created by faculty, automatically add as course faculty
    if (auth.user.role === 'FACULTY') {
      db.addCourseMember(course.id, auth.user.id, 'FACULTY');
    }

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

