import jwt from 'jsonwebtoken';

export interface CreateBrightspaceTopicParams {
  courseId: string;
  moduleId?: string;
  assignmentId: string;
  assignmentTitle: string;
  instructions?: string;
  maxPoints?: number;
  startDate?: string;
  dueDate?: string;
}

export interface CreateBrightspaceTopicResult {
  success: boolean;
  topicId?: string;
  dropboxFolderId?: string;
  quicklinkUrl: string;
  error?: string;
}

export interface BrightspaceSyncRosterResult {
  success: boolean;
  count: number;
  error?: string;
}

/**
 * Reusable helper to obtain a Brightspace OAuth2 Access Token using LTI 1.3 Client Credentials Assertion.
 */
export async function getBrightspaceAccessToken(customScope?: string): Promise<string | null> {
  const rawTokenUrl = process.env.LTI_TOKEN_URL;
  const tokenUrl = (rawTokenUrl && !rawTokenUrl.includes('your-institution'))
    ? rawTokenUrl
    : 'https://auth.brightspace.com/core/connect/token';

  const privateKey = process.env.LTI_TOOL_PRIVATE_KEY;
  const clientId = process.env.LTI_CLIENT_ID;

  if (!privateKey || !clientId) {
    console.warn('[Brightspace Token] Missing LTI_TOOL_PRIVATE_KEY or LTI_CLIENT_ID in environment');
    return null;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const assertionPayload = {
      iss: clientId,
      sub: clientId,
      aud: tokenUrl,
      iat: now,
      exp: now + 300,
      jti: `jti_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    };

    const keyId = process.env.LTI_KEY_ID || 'edutech-key-1';
    const clientAssertion = jwt.sign(assertionPayload, privateKey, {
      algorithm: 'RS256',
      keyid: keyId,
      header: {
        kid: keyId,
        alg: 'RS256',
        typ: 'JWT'
      }
    });

    const scope = customScope || 'core:*:* dropbox:*:* content:*:* content:modules:manage content:topics:manage users:*:* classlist:*:* enrollments:*:* https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly';

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        scope
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[Brightspace Token] Failed HTTP ${tokenRes.status}:`, errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (err: any) {
    console.error('[Brightspace Token] Exception obtaining token:', err?.message || err);
    return null;
  }
}

/**
 * Creates both:
 * 1. An Assignment (Dropbox) Folder in Brightspace (/d2l/lms/dropbox/admin/folders_manage.d2l)
 *    Matching standard format: "(EX) <Title> (Code Assessment)"
 * 2. A Topic Quicklink under the course Content Module in Brightspace Course Content sidebar.
 */
export async function createBrightspaceTopic(params: CreateBrightspaceTopicParams): Promise<CreateBrightspaceTopicResult> {
  const { courseId, moduleId, assignmentId, assignmentTitle, instructions, maxPoints, startDate, dueDate } = params;
  const orgUnitId = String(courseId).replace(/^crs_/, '');

  const host = process.env.BRIGHTSPACE_HOST || 'corplms.d2l-partners.brightspace.com';
  const appBaseUrl = process.env.APP_BASE_URL && !process.env.APP_BASE_URL.includes('yourdomain.com')
    ? process.env.APP_BASE_URL
    : 'https://learning.edutechcloud.com/compiler';

  const cleanBase = appBaseUrl.replace(/\/$/, '');
  const quicklinkUrl = cleanBase.endsWith('/compiler')
    ? `${cleanBase}/api/lti/launch?assignment_id=${encodeURIComponent(assignmentId)}`
    : `${cleanBase}/compiler/api/lti/launch?assignment_id=${encodeURIComponent(assignmentId)}`;

  console.log(`[Brightspace Sync] Initiating Brightspace sync for "${assignmentTitle}" (OrgUnit: ${orgUnitId})...`);

  const access_token = await getBrightspaceAccessToken();
  if (!access_token) {
    const msg = 'Could not obtain Brightspace OAuth token (check LTI_TOOL_PRIVATE_KEY and LTI_CLIENT_ID)';
    console.warn(`[Brightspace Sync] Skipped: ${msg}`);
    return { success: false, quicklinkUrl, error: msg };
  }

  try {
    // STEP 1: Create Brightspace Assignment (Dropbox) Folder
    // Appears in /d2l/lms/dropbox/admin/folders_manage.d2l as "(EX) Title (Code Assessment)"
    // -------------------------------------------------------------------------
    let createdDropboxId: string | undefined = undefined;
    const formattedDropboxName = `(EX) ${assignmentTitle} (Code Assessment)`;

    const dropboxPayload = {
      CategoryId: null,
      Name: formattedDropboxName,
      Code: assignmentId,
      Body: {
        Text: `${instructions || 'Solve the assigned coding assessment.'}\n\nWorkspace Link: ${quicklinkUrl}`,
        Html: `<p>${instructions || 'Solve the assigned coding assessment.'}</p><p><a href="${quicklinkUrl}" target="_blank"><strong>👉 Launch Coding Assessment Workspace</strong></a></p>`
      },
      IsHidden: false,
      StartDate: startDate ? new Date(startDate).toISOString() : null,
      StartDateAvailabilityType: 0,
      EndDate: dueDate ? new Date(dueDate).toISOString() : null,
      EndDateAvailabilityType: 0,
      DueDate: dueDate ? new Date(dueDate).toISOString() : null,
      DisplayInCalendar: true,
      DropboxType: 2, // Individual
      GroupCategoryId: null,
      ScoreOutOf: Number(maxPoints) || 100,
      IsGradable: true,
      GradeItemId: null,
      NotificationEmail: null,
      AllowOnlyUsersWithSpecialAccess: false,
      SubmissionType: 3 // Text submission / link
    };

    console.log(`[Brightspace Sync] Creating Dropbox Folder "${formattedDropboxName}" on course ${orgUnitId}...`);
    try {
      let dropboxRes = await fetch(`https://${host}/d2l/api/le/1.74/${orgUnitId}/dropbox/folders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dropboxPayload)
      });

      if (!dropboxRes.ok && (dropboxRes.status === 404 || dropboxRes.status === 400)) {
        dropboxRes = await fetch(`https://${host}/d2l/api/le/1.82/${orgUnitId}/dropbox/folders/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dropboxPayload)
        });
      }

      if (dropboxRes.ok) {
        const dropboxData = await dropboxRes.json();
        createdDropboxId = String(dropboxData.Id || dropboxData.id || '');
        console.log(`[Brightspace Sync] Dropbox Folder created successfully! Folder ID: ${createdDropboxId}`);
      } else {
        const dropboxErr = await dropboxRes.text();
        console.warn(`[Brightspace Sync] Dropbox creation HTTP ${dropboxRes.status}:`, dropboxErr);
      }
    } catch (dbxErr) {
      console.warn('[Brightspace Sync] Dropbox creation exception:', dbxErr);
    }

    // -------------------------------------------------------------------------
    // STEP 2: Create Topic in Content Module Tree
    // -------------------------------------------------------------------------
    let targetModuleId = moduleId || '1531';
    try {
      const rootRes = await fetch(`https://${host}/d2l/api/le/1.74/${orgUnitId}/content/root/`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (rootRes.ok) {
        const rootModules = await rootRes.json();
        if (Array.isArray(rootModules) && rootModules.length > 0) {
          const matched = rootModules.find((m: any) => 
            /compiler|edutech|code|assessment/i.test(m.Title || '')
          );
          if (matched && matched.Id) {
            targetModuleId = String(matched.Id);
            console.log(`[Brightspace Sync] Auto-resolved parent module "${matched.Title}" -> ID: ${targetModuleId}`);
          }
        }
      }
    } catch (e: any) {
      console.warn('[Brightspace Sync] Root module discovery notice:', e?.message || e);
    }

    const topicPayload = {
      Title: assignmentTitle,
      ShortTitle: assignmentTitle.slice(0, 30),
      Type: 1, // Topic
      TopicType: 3, // Quicklink / Link
      Url: quicklinkUrl,
      StartDate: null,
      EndDate: null,
      DueDate: null,
      IsHidden: false,
      IsLocked: false,
      OpenAsExternalResource: false
    };

    console.log(`[Brightspace Sync] Creating Content Topic under module ${targetModuleId}...`);
    let createRes = await fetch(`https://${host}/d2l/api/le/1.74/${orgUnitId}/content/modules/${targetModuleId}/structure/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(topicPayload)
    });

    if (!createRes.ok && (createRes.status === 404 || createRes.status === 400)) {
      createRes = await fetch(`https://${host}/d2l/api/le/1.82/${orgUnitId}/content/modules/${targetModuleId}/structure/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(topicPayload)
      });
    }

    let createdTopicId: string | undefined = undefined;
    if (createRes.ok) {
      const topicData = await createRes.json();
      createdTopicId = String(topicData.Id || topicData.id || '');
      console.log(`[Brightspace Sync] Created Content Topic successfully! ID: ${createdTopicId}`);
    }

    const hasAnyCreated = Boolean(createdDropboxId || createdTopicId);
    return {
      success: hasAnyCreated,
      topicId: createdTopicId,
      dropboxFolderId: createdDropboxId,
      quicklinkUrl,
      error: !hasAnyCreated ? 'Could not create Dropbox folder or Topic on Brightspace' : undefined
    };
  } catch (err: any) {
    console.error('[Brightspace Sync] Unexpected exception:', err);
    return {
      success: false,
      quicklinkUrl,
      error: err?.message || String(err)
    };
  }
}

/**
 * Synchronizes the complete classlist of enrolled learners from Brightspace for a given course.
 * Uses either LTI 1.3 NRPS (Names and Role Provisioning Service) or Brightspace Valence REST API.
 */
export async function syncBrightspaceCourseClasslist(
  courseId: string,
  nrpsUrl?: string
): Promise<BrightspaceSyncRosterResult> {
  const { db } = await import('@/lib/db');
  const orgUnitId = String(courseId).replace(/^crs_/, '');
  let host = process.env.BRIGHTSPACE_HOST;

  if (!host || host.includes('corplms.d2l-partners')) {
    if (nrpsUrl) {
      try {
        const u = new URL(nrpsUrl);
        if (u.host) host = u.host;
      } catch {}
    }
    if (!host) {
      const courseAssignments = db.getAssignmentsByCourse(courseId);
      for (const a of courseAssignments) {
        if (a.lineItemUrl) {
          try {
            const u = new URL(a.lineItemUrl);
            if (u.host) {
              host = u.host;
              break;
            }
          } catch {}
        }
      }
    }
  }

  if (!host) {
    host = 'corpinside21.partners.brightspace.com';
  }

  console.log(`[Brightspace Classlist Sync] Starting roster sync for course "${courseId}" (OrgUnit: ${orgUnitId}, Host: ${host})...`);

  const accessToken = await getBrightspaceAccessToken();
  if (!accessToken) {
    console.warn('[Brightspace Classlist Sync] Cannot sync: Missing Brightspace access token.');
    return { success: false, count: 0, error: 'Could not obtain Brightspace access token' };
  }

  let rawMembers: any[] = [];

  // Attempt 1: LTI 1.3 NRPS Membership Container
  if (nrpsUrl) {
    try {
      console.log(`[Brightspace Classlist Sync] Querying LTI 1.3 NRPS: ${nrpsUrl}`);
      const nrpsRes = await fetch(nrpsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.ims.lti-nrps.v2.membershipcontainer+json'
        }
      });
      if (nrpsRes.ok) {
        const nrpsData = await nrpsRes.json();
        if (nrpsData && Array.isArray(nrpsData.members)) {
          rawMembers = nrpsData.members.map((m: any) => ({
            Identifier: m.user_id || m.sub || m.identifier,
            DisplayName: m.name || `${m.given_name || ''} ${m.family_name || ''}`.trim(),
            UserName: m.email ? m.email.split('@')[0] : (m.user_id || 'learner'),
            Email: m.email || `${m.user_id}@brightspace.edu`,
            RoleName: (m.roles || []).some((r: string) => /learner|student/i.test(r)) ? 'Student' : 'Instructor'
          }));
          console.log(`[Brightspace Classlist Sync] NRPS fetched ${rawMembers.length} members successfully.`);
        }
      } else {
        console.warn(`[Brightspace Classlist Sync] NRPS returned HTTP ${nrpsRes.status}`);
      }
    } catch (e: any) {
      console.warn('[Brightspace Classlist Sync] NRPS query exception:', e?.message || e);
    }
  }

  // Attempt 2: Brightspace Valence Classlist REST API
  if (rawMembers.length === 0) {
    const versions = ['1.74', '1.82', '1.67', '1.45'];
    for (const v of versions) {
      try {
        const url = `https://${host}/d2l/api/le/${v}/${orgUnitId}/classlist/`;
        console.log(`[Brightspace Classlist Sync] Trying Valence classlist API v${v} (${url})...`);
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            rawMembers = list;
            console.log(`[Brightspace Classlist Sync] Valence v${v} returned ${list.length} members!`);
            break;
          }
        } else {
          console.warn(`[Brightspace Classlist Sync] Valence v${v} returned HTTP ${res.status}`);
        }
      } catch (e: any) {
        console.warn(`[Brightspace Classlist Sync] Valence v${v} exception:`, e?.message || e);
      }
    }
  }

  if (rawMembers.length === 0) {
    console.warn(`[Brightspace Classlist Sync] No members returned for course ${orgUnitId}.`);
    return { success: false, count: 0, error: 'No members returned from Brightspace classlist' };
  }

  // Filter to learners / students (exclude instructors and admins)
  const learners = rawMembers.filter((m: any) => {
    const role = (m.RoleName || '').toLowerCase();
    const roles = Array.isArray(m.roles) ? m.roles.map((r: string) => r.toLowerCase()) : [];
    const isLearner = role.includes('student') || role.includes('learner') || roles.some((r: string) => r.includes('student') || r.includes('learner'));
    const isTeacher = role.includes('instructor') || role.includes('faculty') || role.includes('teacher') || role.includes('admin') || roles.some((r: string) => r.includes('instructor') || r.includes('faculty'));
    return isLearner || !isTeacher;
  });

  console.log(`[Brightspace Classlist Sync] Found ${learners.length} learners out of ${rawMembers.length} total members.`);

  // Upsert each learner into the local database and enroll them into the course and existing assignments
  let syncedCount = 0;

  for (const learner of learners) {
    const userId = String(learner.Identifier || learner.user_id || learner.Id || '').trim();
    if (!userId) continue;

    const name = learner.DisplayName || `${learner.FirstName || ''} ${learner.LastName || ''}`.trim() || learner.UserName || `Student ${userId}`;
    const email = learner.Email || learner.email || `${userId}@brightspace.edu`;

    db.upsertUser({
      id: userId,
      name,
      email,
      role: 'LEARNER'
    });

    db.addCourseMember(courseId, userId, 'LEARNER');
    syncedCount++;
  }

  // Ensure all existing assignments in this course also enroll these learners
  const courseAssignments = db.getAssignmentsByCourse(courseId);
  for (const asg of courseAssignments) {
    for (const learner of learners) {
      const userId = String(learner.Identifier || learner.user_id || learner.Id || '').trim();
      if (userId) {
        db.ensureAssignmentLearner(asg.id, userId);
      }
    }
  }

  console.log(`[Brightspace Classlist Sync] Successfully synced and enrolled ${syncedCount} learners into course "${courseId}"!`);
  return { success: true, count: syncedCount };
}
