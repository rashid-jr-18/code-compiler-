import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * LTI 1.3 Launch Handler
 * Handles the HTTP POST form submission from Brightspace containing id_token and state.
 * Extracts user profile, roles, and course context, then safely redirects to /compiler (GET)
 * to prevent Next.js "Invalid Server Actions request" error.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let idToken = '';
    let state = '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      idToken = (formData.get('id_token') as string) || '';
      state = (formData.get('state') as string) || '';
    } else if (contentType.includes('application/json')) {
      const json = await request.json().catch(() => ({}));
      idToken = json.id_token || '';
      state = json.state || '';
    }

    // Decode JWT payload (Header.Payload.Signature)
    let payload: Record<string, any> = {};
    if (idToken) {
      try {
        const parts = idToken.split('.');
        if (parts.length >= 2) {
          const decoded = Buffer.from(parts[1], 'base64url').toString('utf-8');
          payload = JSON.parse(decoded);
        }
      } catch (e) {
        console.warn('[LTI Launch] JWT parse error:', e);
      }
    }

    // Extract standard LTI 1.3 Claims
    const context = payload['https://purl.imsglobal.org/spec/lti/claim/context'] || {};
    const resourceLink = payload['https://purl.imsglobal.org/spec/lti/claim/resource_link'] || {};
    const rawRoles: string[] = payload['https://purl.imsglobal.org/spec/lti/claim/roles'] || [];

    const isInstructor = rawRoles.some((r: string) =>
      r.toLowerCase().includes('instructor') ||
      r.toLowerCase().includes('faculty') ||
      r.toLowerCase().includes('administrator')
    );

    const userRole = isInstructor ? 'faculty' : 'learner';
    const userId = payload.sub || `usr_lti_${Date.now()}`;
    const userName = payload.name || payload.given_name || (isInstructor ? 'Course Faculty' : 'Course Learner');
    const userEmail = payload.email || `${userId}@brightspace.edu`;
    const courseId = context.id ? `crs_${String(context.id).replace(/[^a-zA-Z0-9_-]/g, '_')}` : 'crs_cs101';
    const courseTitle = context.title || 'Brightspace Course';
    const resourceLinkId = resourceLink.id || `rl_${Date.now()}`;
    const resourceLinkTitle = resourceLink.title || 'Programming';

    // Auto-provision user & course dynamically in persistent local database
    db.upsertUser({
      id: userId,
      name: userName,
      email: userEmail,
      role: isInstructor ? 'FACULTY' : 'LEARNER',
      ltiSubject: payload.sub
    });

    let course = db.getCourseByLtiContext(context.id || courseId) || db.getCourseById(courseId);
    if (!course) {
      course = db.createCourse(courseTitle, context.id || courseId);
    }
    db.addCourseMember(course.id, userId, isInstructor ? 'FACULTY' : 'LEARNER');

    // Build clean GET redirect URL to the compiler page with populated params
    const redirectUrl = new URL('/compiler', request.url);
    redirectUrl.searchParams.set('user_id', userId);
    redirectUrl.searchParams.set('role', userRole);
    redirectUrl.searchParams.set('course_id', course.id);
    redirectUrl.searchParams.set('course_title', courseTitle);
    redirectUrl.searchParams.set('resource_link_id', resourceLinkId);
    redirectUrl.searchParams.set('resource_link_title', resourceLinkTitle);

    // 303 See Other forces the browser to transition from HTTP POST to HTTP GET
    const response = NextResponse.redirect(redirectUrl, 303);

    // Set cookie headers with SameSite=None and Secure for iframe embedding
    const cookieOptions = {
      path: '/',
      httpOnly: false,
      sameSite: 'none' as const,
      secure: true,
      maxAge: 86400
    };

    response.cookies.set('user_id', userId, cookieOptions);
    response.cookies.set('user_role', userRole, cookieOptions);
    response.cookies.set('course_id', course.id, cookieOptions);
    response.cookies.set('course_title', courseTitle, cookieOptions);

    return response;
  } catch (err) {
    console.error('[LTI Launch Handler] Error:', err);
    return NextResponse.redirect(new URL('/compiler', request.url), 303);
  }
}

export async function GET(request: NextRequest) {
  // If accessed directly via GET, redirect straight to /compiler
  return NextResponse.redirect(new URL('/compiler', request.url), 302);
}
