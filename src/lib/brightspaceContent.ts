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
  const rawTokenUrl = process.env.LTI_TOKEN_URL;
  const tokenUrl = (rawTokenUrl && !rawTokenUrl.includes('your-institution'))
    ? rawTokenUrl
    : 'https://auth.brightspace.com/core/connect/token';

  const privateKey = process.env.LTI_TOOL_PRIVATE_KEY;
  const clientId = process.env.LTI_CLIENT_ID;
  const appBaseUrl = process.env.APP_BASE_URL && !process.env.APP_BASE_URL.includes('yourdomain.com')
    ? process.env.APP_BASE_URL
    : 'https://learning.edutechcloud.com/compiler';

  const cleanBase = appBaseUrl.replace(/\/$/, '');
  const quicklinkUrl = cleanBase.endsWith('/compiler')
    ? `${cleanBase}/api/lti/launch?assignment_id=${encodeURIComponent(assignmentId)}`
    : `${cleanBase}/compiler/api/lti/launch?assignment_id=${encodeURIComponent(assignmentId)}`;

  console.log(`[Brightspace Sync] Initiating Brightspace sync for "${assignmentTitle}" (OrgUnit: ${orgUnitId})...`);

  if (!privateKey || !clientId) {
    const msg = 'LTI_TOOL_PRIVATE_KEY or LTI_CLIENT_ID not configured in environment';
    console.warn(`[Brightspace Sync] Skipped: ${msg}`);
    return { success: false, quicklinkUrl, error: msg };
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

    console.log(`[Brightspace Sync] Requesting OAuth token from ${tokenUrl}...`);
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        scope: 'core:*:* dropbox:*:* content:*:* content:modules:manage content:topics:manage'
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[Brightspace Sync] OAuth Token failed HTTP ${tokenRes.status}:`, errText);
      return { success: false, quicklinkUrl, error: `Brightspace OAuth token error (${tokenRes.status}): ${errText}` };
    }

    const { access_token } = await tokenRes.json();
    console.log('[Brightspace Sync] OAuth token obtained successfully.');

    // -------------------------------------------------------------------------
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
