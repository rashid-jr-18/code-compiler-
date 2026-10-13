import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * LTI 1.3 / LTI Launch Handler
 * Handles the HTTP POST form submission from Brightspace containing id_token and state.
 * Extracts user profile, roles, and course context, then safely redirects to /compiler (GET)
 * using the public domain so redirects never point to localhost:4000.
 */
export async function POST(request: NextRequest) {
  try {
    let idToken = '';
    let rawForm: Record<string, string> = {};

    const clonedRequest = request.clone();
    try {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        if (typeof value === 'string') {
          rawForm[key] = value;
        }
      });
      idToken = rawForm['id_token'] || '';
    } catch {
      try {
        const text = await clonedRequest.text();
        const params = new URLSearchParams(text);
        params.forEach((value, key) => {
          rawForm[key] = value;
        });
        idToken = rawForm['id_token'] || '';
      } catch (e) {
        console.warn('[LTI Launch] Body parse warning:', e);
      }
    }

    console.log('[LTI Launch] Received rawForm keys:', Object.keys(rawForm));

    // 1. Decode JWT payload if id_token is provided (LTI 1.3 Advantage)
    let payload: Record<string, any> = {};
    if (idToken) {
      try {
        const parts = idToken.split('.');
        if (parts.length >= 2) {
          const decoded = Buffer.from(parts[1], 'base64url').toString('utf-8');
          payload = JSON.parse(decoded);
          console.log('[LTI Launch] Decoded LTI 1.3 payload keys:', Object.keys(payload));
        }
      } catch (e) {
        console.warn('[LTI Launch] JWT decode warning:', e);
      }
    }

    // Extract LTI 1.3 Claims or fallback to direct Form POST parameters
    const context = payload['https://purl.imsglobal.org/spec/lti/claim/context'] || {};
    const resourceLink = payload['https://purl.imsglobal.org/spec/lti/claim/resource_link'] || {};
    const lis = payload['https://purl.imsglobal.org/spec/lti/claim/lis'] || {};
    const custom = payload['https://purl.imsglobal.org/spec/lti/claim/custom'] || {};

    const rawRoles: string[] = payload['https://purl.imsglobal.org/spec/lti/claim/roles'] || 
      payload['roles'] ||
      (rawForm['roles'] ? rawForm['roles'].split(',') : []) ||
      (rawForm['role'] ? [rawForm['role']] : []) ||
      (rawForm['ext_d2l_role'] ? [rawForm['ext_d2l_role']] : []) ||
      (custom['roles'] ? [custom['roles']] : []);

    console.log('[LTI Launch] Raw roles detected:', rawRoles);

    const isInstructor = rawRoles.some((r: string) => {
      const lower = String(r).toLowerCase();
      return lower.includes('instructor') ||
        lower.includes('faculty') ||
        lower.includes('administrator') ||
        lower.includes('admin') ||
        lower.includes('staff') ||
        lower.includes('teacher') ||
        lower.includes('teachingassistant');
    });

    const userRole = isInstructor ? 'faculty' : 'learner';

    const userId = payload.sub || 
      lis.person_sourcedid || 
      rawForm['user_id'] || 
      `usr_lti_${Date.now()}`;

    // Extract full name from all possible Brightspace LTI claims
    const userName = payload.name ||
      (payload.given_name ? `${payload.given_name} ${payload.family_name || ''}`.trim() : '') ||
      lis.person_name_full ||
      (lis.person_name_given ? `${lis.person_name_given} ${lis.person_name_family || ''}`.trim() : '') ||
      rawForm['lis_person_name_full'] ||
      (rawForm['lis_person_name_given'] ? `${rawForm['lis_person_name_given']} ${rawForm['lis_person_name_family'] || ''}`.trim() : '') ||
      rawForm['name'] ||
      custom.user_name ||
      custom.name ||
      (isInstructor ? 'TATA Tpsdi Instructor' : 'Amivarshaa Blankenship');

    const userEmail = payload.email || 
      lis.person_contact_email_primary || 
      rawForm['lis_person_contact_email_primary'] || 
      rawForm['email'] || 
      `${userId}@brightspace.edu`;
    
    // Resolve course context (e.g. "Advanced C++")
    const courseTitle = context.title || rawForm['context_title'] || 'Advanced C++';
    const rawContextId = context.id || rawForm['context_id'] || 'crs_advanced_cpp';
    const courseId = `crs_${String(rawContextId).replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const resourceLinkId = resourceLink.id || rawForm['resource_link_id'] || `rl_${Date.now()}`;
    const resourceLinkTitle = resourceLink.title || rawForm['resource_link_title'] || 'Code Assessment & Compiler';

    console.log('[LTI Launch] User resolved:', { userId, userName, userRole, courseTitle });

    // 2. Auto-provision user & course dynamically in persistent database
    db.upsertUser({
      id: userId,
      name: userName,
      email: userEmail,
      role: isInstructor ? 'FACULTY' : 'LEARNER',
      ltiSubject: payload.sub || rawForm['user_id']
    });

    let course = db.getCourseByLtiContext(rawContextId) || db.getCourseById(courseId);
    if (!course) {
      course = db.createCourse(courseTitle, rawContextId);
    }
    db.addCourseMember(course.id, userId, isInstructor ? 'FACULTY' : 'LEARNER');

    // 3. Resolve Public Domain for safe 303 browser redirect (Never redirect to localhost or 127.0.0.1!)
    let host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'learning.edutechcloud.com';
    let proto = request.headers.get('x-forwarded-proto') || 'https';

    // If host contains localhost, 127.0.0.1 or internal port 4000, force canonical domain
    if (!host || host.includes('localhost') || host.includes('127.0.0.1') || host.includes(':4000')) {
      host = process.env.APP_DOMAIN || 'learning.edutechcloud.com';
      proto = 'https';
    }
    
    const redirectUrl = new URL(`${proto}://${host}/compiler`);
    redirectUrl.searchParams.set('user_id', userId);
    redirectUrl.searchParams.set('role', userRole);
    redirectUrl.searchParams.set('course_id', course.id);
    redirectUrl.searchParams.set('course_title', courseTitle);
    redirectUrl.searchParams.set('resource_link_id', resourceLinkId);
    redirectUrl.searchParams.set('resource_link_title', resourceLinkTitle);

    // 303 See Other forces the browser to transition from HTTP POST to HTTP GET
    const response = NextResponse.redirect(redirectUrl.toString(), 303);

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
    response.cookies.set('lti_session', 'active', cookieOptions);

    return response;
  } catch (err) {
    console.error('[LTI Launch Handler] Critical error:', err);
    let host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'learning.edutechcloud.com';
    let proto = request.headers.get('x-forwarded-proto') || 'https';
    if (!host || host.includes('localhost') || host.includes('127.0.0.1') || host.includes(':4000')) {
      host = process.env.APP_DOMAIN || 'learning.edutechcloud.com';
      proto = 'https';
    }
    return NextResponse.redirect(`${proto}://${host}/compiler`, 303);
  }
}

export async function GET(request: NextRequest) {
  let host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'learning.edutechcloud.com';
  let proto = request.headers.get('x-forwarded-proto') || 'https';
  if (!host || host.includes('localhost') || host.includes('127.0.0.1') || host.includes(':4000')) {
    host = process.env.APP_DOMAIN || 'learning.edutechcloud.com';
    proto = 'https';
  }
  return NextResponse.redirect(`${proto}://${host}/compiler`, 302);
}
