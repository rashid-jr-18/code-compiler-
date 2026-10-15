import jwt from 'jsonwebtoken';

export interface CreateBrightspaceTopicParams {
  courseId: string;
  moduleId?: string;
  assignmentId: string;
  assignmentTitle: string;
}

export interface CreateBrightspaceTopicResult {
  success: boolean;
  topicId?: string;
  quicklinkUrl: string;
  error?: string;
}

/**
 * Creates a dedicated Topic (Quicklink) in Brightspace Course Content tree under the course module.
 * When learners click this topic in the Brightspace Content sidebar, it launches directly into this assessment.
 * Official Brightspace Valence API: POST /d2l/api/le/(version)/(orgUnitId)/content/modules/(moduleId)/structure/
 */
export async function createBrightspaceTopic(params: CreateBrightspaceTopicParams): Promise<CreateBrightspaceTopicResult> {
  const { courseId, moduleId, assignmentId, assignmentTitle } = params;
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

  console.log(`[Brightspace Topic] Initiating topic creation for "${assignmentTitle}" (OrgUnit: ${orgUnitId})...`);

  if (!privateKey || !clientId) {
    const msg = 'LTI_TOOL_PRIVATE_KEY or LTI_CLIENT_ID not configured in environment';
    console.warn(`[Brightspace Topic] Skipped: ${msg}`);
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

    const clientAssertion = jwt.sign(assertionPayload, privateKey, { algorithm: 'RS256' });

    console.log(`[Brightspace Topic] Requesting OAuth token from ${tokenUrl}...`);
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        scope: 'core:*:* content:*:* content:modules:manage content:topics:manage'
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[Brightspace Topic] Token request failed HTTP ${tokenRes.status}:`, errText);
      return { success: false, quicklinkUrl, error: `Brightspace OAuth token error (${tokenRes.status}): ${errText}` };
    }

    const { access_token } = await tokenRes.json();
    console.log('[Brightspace Topic] OAuth token obtained successfully.');

    // Attempt to discover the appropriate parent module under the course offering
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
            console.log(`[Brightspace Topic] Auto-resolved parent module "${matched.Title}" -> ID: ${targetModuleId}`);
          }
        }
      }
    } catch (e: any) {
      console.warn('[Brightspace Topic] Root module discovery notice:', e?.message || e);
    }

    const payload = {
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

    console.log(`[Brightspace Topic] Calling Valence POST /content/modules/${targetModuleId}/structure/...`);

    // Try API version 1.74 first
    let createRes = await fetch(`https://${host}/d2l/api/le/1.74/${orgUnitId}/content/modules/${targetModuleId}/structure/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Fallback to version 1.82 if 1.74 is obsolete or 404
    if (!createRes.ok && (createRes.status === 404 || createRes.status === 400)) {
      console.log(`[Brightspace Topic] Retrying with API version 1.82...`);
      createRes = await fetch(`https://${host}/d2l/api/le/1.82/${orgUnitId}/content/modules/${targetModuleId}/structure/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    if (createRes.ok) {
      const topicData = await createRes.json();
      const topicId = String(topicData.Id || topicData.id || '');
      console.log(`[Brightspace Topic] Successfully created Topic in Brightspace! Topic ID: ${topicId}`);
      return {
        success: true,
        topicId,
        quicklinkUrl
      };
    } else {
      const errText = await createRes.text();
      console.error(`[Brightspace Topic] Valence API creation error HTTP ${createRes.status}:`, errText);
      return {
        success: false,
        quicklinkUrl,
        error: `Brightspace API HTTP ${createRes.status}: ${errText}`
      };
    }
  } catch (err: any) {
    console.error('[Brightspace Topic] Unexpected exception during topic creation:', err);
    return {
      success: false,
      quicklinkUrl,
      error: err?.message || String(err)
    };
  }
}
