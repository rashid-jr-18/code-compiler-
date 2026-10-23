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

    try {
      const fs = await import('fs');
      const path = await import('path');
      const debugFilePath = path.join(process.cwd(), 'data', 'last_lti_launch.json');
      fs.writeFileSync(debugFilePath, JSON.stringify({
        timestamp: new Date().toISOString(),
        rawFormKeys: Object.keys(rawForm),
        rawForm,
        payloadKeys: Object.keys(payload),
        payload
      }, null, 2));
    } catch (e) {
      // ignore debug file write error
    }

    // Extract LTI 1.3 Claims or fallback to direct Form POST parameters
    const context = payload['https://purl.imsglobal.org/spec/lti/claim/context'] || {};
    const resourceLink = payload['https://purl.imsglobal.org/spec/lti/claim/resource_link'] || {};
    const lis = payload['https://purl.imsglobal.org/spec/lti/claim/lis'] || {};
    const custom = payload['https://purl.imsglobal.org/spec/lti/claim/custom'] || {};
    const agsEndpoint = payload['https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'] || {};

    const agsLineItemUrl = agsEndpoint.lineitem || 
      (agsEndpoint.lineitems ? `${agsEndpoint.lineitems}` : undefined) ||
      rawForm['lineitem'] ||
      rawForm['custom_lineitem'];

    const rawRoles: string[] = payload['https://purl.imsglobal.org/spec/lti/claim/roles'] || 
      payload['roles'] ||
      (rawForm['roles'] ? rawForm['roles'].split(',') : []) ||
      (rawForm['role'] ? [rawForm['role']] : []) ||
      (rawForm['ext_d2l_role'] ? [rawForm['ext_d2l_role']] : []) ||
      (custom['roles'] ? [custom['roles']] : []);

    console.log('[LTI Launch] Raw roles detected:', rawRoles);

    let isInstructor = rawRoles.some((r: string) => {
      const lower = String(r).toLowerCase();
      return lower.includes('instructor') ||
        lower.includes('faculty') ||
        lower.includes('administrator') ||
        lower.includes('admin') ||
        lower.includes('staff') ||
        lower.includes('teacher') ||
        lower.includes('teachingassistant');
    });

    const userId = payload.sub || 
      lis.person_sourcedid || 
      rawForm['user_id'] || 
      `usr_lti_${Date.now()}`;

    // Extract real full name purely from Brightspace LTI claims / parameters
    let userName = payload.name ||
      (payload.given_name ? `${payload.given_name} ${payload.family_name || ''}`.trim() : '') ||
      lis.person_name_full ||
      (lis.person_name_given ? `${lis.person_name_given} ${lis.person_name_family || ''}`.trim() : '') ||
      rawForm['lis_person_name_full'] ||
      (rawForm['lis_person_name_given'] ? `${rawForm['lis_person_name_given']} ${rawForm['lis_person_name_family'] || ''}`.trim() : '') ||
      rawForm['name'] ||
      rawForm['username'] ||
      custom.user_name ||
      custom.name ||
      '';

    const userEmail = payload.email || 
      lis.person_contact_email_primary || 
      rawForm['lis_person_contact_email_primary'] || 
      rawForm['email'] || 
      `${userId}@brightspace.edu`;

    // If userName is empty, fallback to email prefix or generic role title
    if (!userName) {
      if (payload.email) {
        userName = payload.email.split('@')[0];
      } else if (rawForm['email']) {
        userName = rawForm['email'].split('@')[0];
      } else {
        userName = isInstructor ? 'LMS Instructor' : 'LMS Learner';
      }
    }

    // Dynamic role check from name/email if roles claim was omitted
    if (!isInstructor) {
      const combined = `${userName} ${userEmail}`.toLowerCase();
      if (combined.includes('instructor') || combined.includes('faculty') || combined.includes('admin')) {
        isInstructor = true;
      }
    }

    const userRole = isInstructor ? 'faculty' : 'learner';
    
    // Resolve course context (e.g. "Advanced C++")
    const courseTitle = context.title || rawForm['context_title'] || 'Advanced C++';
    const rawContextId = context.id || rawForm['context_id'] || 'crs_advanced_cpp';
    const courseId = `crs_${String(rawContextId).replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const resourceLinkId = resourceLink.id || rawForm['resource_link_id'] || `rl_${Date.now()}`;
    const resourceLinkTitle = resourceLink.title || rawForm['resource_link_title'] || 'Code Assessment & Compiler';

    // Extract assignment_id if launch originated from a specific Brightspace assessment topic
    const assignmentId = request.nextUrl.searchParams.get('assignment_id') ||
      rawForm['assignment_id'] ||
      rawForm['custom_assignment_id'] ||
      request.cookies.get('assignment_id')?.value ||
      (custom && custom.assignment_id) ||
      (payload && payload['https://purl.imsglobal.org/spec/lti/claim/custom']?.assignment_id);

    console.log('========================================================');
    console.log('🔍 [BRIGHTSPACE LTI LAUNCH ROLES DEBUG]');
    console.log('👉 Raw Roles Received:', JSON.stringify(rawRoles));
    console.log('👉 Is Instructor?:', isInstructor);
    console.log('👉 Assigned Role:', userRole);
    console.log('👉 User Name:', userName);
    console.log('👉 User ID:', userId);
    console.log('👉 Targeted Assignment ID:', assignmentId || 'None (General Launcher)');
    console.log('========================================================');

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

    // 2.1 Bind AGS LineItem URL and enroll student if targeted launch
    if (assignmentId) {
      const existingAssignment = db.getAssignmentById(assignmentId);
      if (existingAssignment) {
        if (agsLineItemUrl && existingAssignment.lineItemUrl !== agsLineItemUrl) {
          db.updateAssignment(assignmentId, {
            lineItemUrl: agsLineItemUrl,
            resourceLinkId: resourceLinkId || existingAssignment.resourceLinkId
          });
          console.log(`[LTI Launch] Successfully bound Brightspace AGS lineItemUrl to assignment "${assignmentId}":`, agsLineItemUrl);
        }

        // If a real Brightspace student is launching this assignment, ensure they are enrolled in the assignment record
        if (!isInstructor) {
          const existingLearnerRecord = Array.from(db.assignmentLearners.values()).find(
            al => al.assignmentId === assignmentId && al.learnerId === userId
          );
          if (!existingLearnerRecord) {
            db.assignmentLearners.set(`al_${assignmentId}_${userId}`, {
              id: `al_${assignmentId}_${userId}`,
              assignmentId,
              learnerId: userId,
              status: 'ASSIGNED',
              score: 0,
              reviewed: false,
              exported: false,
              createdAt: new Date().toISOString()
            });
            console.log(`[LTI Launch] Auto-enrolled real Brightspace learner "${userId}" (${userName}) in assignment "${assignmentId}"`);
          }
        }
      }
    }

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
    redirectUrl.searchParams.set('raw_roles', encodeURIComponent(JSON.stringify(rawRoles)));
    redirectUrl.searchParams.set('course_id', course.id);
    redirectUrl.searchParams.set('course_title', courseTitle);
    redirectUrl.searchParams.set('resource_link_id', resourceLinkId);
    redirectUrl.searchParams.set('resource_link_title', resourceLinkTitle);
    if (assignmentId) {
      redirectUrl.searchParams.set('assignment_id', assignmentId);
    }

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
    if (assignmentId) {
      response.cookies.set('assignment_id', assignmentId, cookieOptions);
    } else {
      response.cookies.delete('assignment_id');
    }

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

  const assignmentId = request.nextUrl.searchParams.get('assignment_id') ||
    request.cookies.get('assignment_id')?.value;

  const redirectUrl = new URL(`${proto}://${host}/compiler`);

  if (assignmentId) {
    redirectUrl.searchParams.set('assignment_id', assignmentId);
  }

  // Forward all other search parameters if provided
  request.nextUrl.searchParams.forEach((val, key) => {
    if (key !== 'assignment_id') {
      redirectUrl.searchParams.set(key, val);
    }
  });

  // Preserve user context if set in cookies
  const cookieUserId = request.cookies.get('user_id')?.value;
  const cookieRole = request.cookies.get('user_role')?.value;
  const cookieCourseId = request.cookies.get('course_id')?.value;
  const cookieCourseTitle = request.cookies.get('course_title')?.value;

  if (cookieUserId && !redirectUrl.searchParams.has('user_id')) {
    redirectUrl.searchParams.set('user_id', cookieUserId);
  }
  if (cookieRole && !redirectUrl.searchParams.has('role')) {
    redirectUrl.searchParams.set('role', cookieRole);
  }
  if (cookieCourseId && !redirectUrl.searchParams.has('course_id')) {
    redirectUrl.searchParams.set('course_id', cookieCourseId);
  }
  if (cookieCourseTitle && !redirectUrl.searchParams.has('course_title')) {
    redirectUrl.searchParams.set('course_title', cookieCourseTitle);
  }

  const response = NextResponse.redirect(redirectUrl.toString(), 302);

  const cookieOptions = {
    path: '/',
    httpOnly: false,
    sameSite: 'none' as const,
    secure: true,
    maxAge: 86400
  };

  response.cookies.set('lti_session', 'active', cookieOptions);
  if (assignmentId) {
    response.cookies.set('assignment_id', assignmentId, cookieOptions);
  }

  return response;
}
