import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { AppRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id_token = formData.get('id_token') as string;
    const state = formData.get('state') as string;

    if (!id_token) {
      return new NextResponse('Missing id_token in launch request', { status: 400 });
    }

    // 1. Decode token to inspect claims
    const decodedToken = jwt.decode(id_token, { complete: true });
    if (!decodedToken || typeof decodedToken.payload === 'string') {
      return new NextResponse('Invalid id_token payload', { status: 400 });
    }

    const payload = decodedToken.payload as Record<string, unknown>;
    console.log('[LTI 1.3 Launch] Parsed claims for subject:', payload.sub);

    // 2. Extract LTI 1.3 Advantage claims
    const ltiSubject = (payload.sub as string) || `sub_${Date.now()}`;
    const name = (payload.name as string) || (payload.given_name as string) || 'Brightspace User';
    const email = (payload.email as string) || `${ltiSubject}@brightspace.edu`;

    // Map Roles
    const rolesClaim = (payload['https://purl.imsglobal.org/spec/lti/claim/roles'] as string[]) || [];
    const isInstructor = rolesClaim.some(r =>
      r.includes('Instructor') || r.includes('Faculty') || r.includes('teaching-assistant') || r.includes('Administrator')
    );
    const role: AppRole = isInstructor ? 'FACULTY' : 'LEARNER';

    // Extract Course Context
    const contextClaim = (payload['https://purl.imsglobal.org/spec/lti/claim/context'] as Record<string, unknown>) || {};
    const ltiContextId = (contextClaim.id as string) || 'd2l_default_course';
    const courseTitle = (contextClaim.title as string) || 'Brightspace Enrolled Course';

    // Extract AGS endpoint
    const agsClaim = (payload['https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'] as Record<string, unknown>) || {};
    const lineItemUrl = (agsClaim.lineitem as string) || (agsClaim.lineitems as string) || undefined;

    // 3. Auto-provision or update Course in database
    let course = db.getCourseByLtiContext(ltiContextId);
    if (!course) {
      course = db.createCourse(courseTitle, ltiContextId);
    }

    // 4. Auto-provision or update User in database
    const user = db.upsertUser({
      name,
      email,
      role,
      ltiSubject
    });

    // 5. Ensure Course Membership
    db.addCourseMember(course.id, user.id, role === 'FACULTY' ? 'FACULTY' : 'LEARNER');

    // 6. Redirect to the course workspace with user and course parameters
    const appBaseUrl = process.env.APP_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const redirectUrl = new URL(appBaseUrl);
    redirectUrl.searchParams.set('course_id', course.id);
    redirectUrl.searchParams.set('course_title', course.title);
    redirectUrl.searchParams.set('user_id', user.id);
    redirectUrl.searchParams.set('role', role.toLowerCase());

    const response = NextResponse.redirect(redirectUrl.toString(), 303);
    
    // Set authentication cookies for seamless session retention
    response.cookies.set('user_id', user.id, { path: '/', httpOnly: false, sameSite: 'none', secure: true });
    response.cookies.set('course_id', course.id, { path: '/', httpOnly: false, sameSite: 'none', secure: true });
    response.cookies.set('course_title', encodeURIComponent(course.title), { path: '/', httpOnly: false, sameSite: 'none', secure: true });
    response.cookies.set('user_role', role, { path: '/', httpOnly: false, sameSite: 'none', secure: true });

    return response;

  } catch (error) {
    console.error('[LTI Launch Error]:', error);
    return new NextResponse('LTI Launch processing failed', { status: 500 });
  }
}
