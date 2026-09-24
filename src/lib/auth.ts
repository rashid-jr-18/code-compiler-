import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User, AppRole, Question } from '@/types';

export interface AuthContext {
  user: User;
  role: AppRole;
}

/**
 * Server-side authentication resolver.
 * Inspects session cookies, LTI authorization headers, or dev headers.
 */
export function getAuthenticatedUser(request: NextRequest): User | null {
  // 1. Check for custom authentication / dev mode header or URL query
  const devUserId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId') || request.nextUrl.searchParams.get('user_id');
  const rawRole = (request.headers.get('x-user-role') || request.nextUrl.searchParams.get('role'))?.toUpperCase();

  if (devUserId) {
    const user = db.getUserById(devUserId) || db.getUserByLtiSubject(devUserId);
    if (user) return user;
  }

  // 2. Fallback based on dev role or alias
  if (rawRole === 'ADMIN') {
    return db.getUserById('usr_admin') || null;
  }
  if (rawRole === 'FACULTY' || rawRole === 'INSTRUCTOR') {
    return db.getUserById('usr_faculty') || null;
  }
  if (rawRole === 'LEARNER' || rawRole === 'STUDENT') {
    return db.getUserById('usr_student_alice') || null;
  }

  // 3. Check for authorization cookie / session
  const cookieUserId = request.cookies.get('user_id')?.value;
  if (cookieUserId) {
    const user = db.getUserById(cookieUserId) || db.getUserByLtiSubject(cookieUserId);
    if (user) return user;
  }

  // 4. Default fallback for testing / dev experience: Prof. Alan Turing
  return db.getUserById('usr_faculty') || null;
}

/**
 * Validates that the request has an authenticated user.
 */
export function requireAuth(request: NextRequest): { user: User } | NextResponse {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  return { user };
}

/**
 * Validates that the authenticated user has one of the allowed roles.
 */
export function requireRole(request: NextRequest, allowedRoles: AppRole[]): { user: User } | NextResponse {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (!allowedRoles.includes(auth.user.role)) {
    return NextResponse.json({
      error: `Forbidden: Required role ${allowedRoles.join(' or ')}, but current user has ${auth.user.role}`
    }, { status: 403 });
  }

  return auth;
}

/**
 * Validates course-scoped access:
 * - Admin has access to all courses
 * - Faculty must be assigned to the course
 * - Learner must be enrolled in the course
 */
export function requireCourseAccess(request: NextRequest, courseId: string): { user: User } | NextResponse {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // In development mode or admin role, allow full access
  if (auth.user.role === 'ADMIN' || process.env.NODE_ENV === 'development') {
    return auth;
  }

  const course = db.getCourseById(courseId);
  if (course && course.facultyId === auth.user.id) {
    return auth;
  }

  const members = db.getCourseMembers(courseId);
  const membership = members.find(m => m.userId === auth.user.id);

  if (!membership) {
    return NextResponse.json({
      error: 'Forbidden: You do not have access to this course'
    }, { status: 403 });
  }

  return auth;
}

/**
 * Sanitizes Question data for learners:
 * Never exposes hidden test case inputs or expected outputs!
 */
export function sanitizeQuestionForLearner(question: Question): Question {
  return {
    ...question,
    testCases: question.testCases.map(tc => {
      if (tc.isHidden) {
        return {
          id: tc.id,
          input: '*** HIDDEN TEST CASE ***',
          expectedOutput: '*** HIDDEN ***',
          points: tc.points,
          description: tc.description || 'Hidden Test Case',
          isHidden: true
        };
      }
      return tc;
    })
  };
}

