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
 */
export async function createBrightspaceTopic(params: CreateBrightspaceTopicParams): Promise<CreateBrightspaceTopicResult> {
  const { courseId, moduleId, assignmentId, assignmentTitle } = params;
  const orgUnitId = String(courseId).replace(/^crs_/, '');

  const host = process.env.BRIGHTSPACE_HOST || 'corplms.d2l-partners.brightspace.com';
  const tokenUrl = process.env.LTI_TOKEN_URL;
  const privateKey = process.env.LTI_TOOL_PRIVATE_KEY;
  const clientId = process.env.LTI_CLIENT_ID;
  const appBaseUrl = process.env.APP_BASE_URL && !process.env.APP_BASE_URL.includes('yourdomain.com')
    ? process.env.APP_BASE_URL
    : 'https://learning.edutechcloud.com/compiler';

  const cleanBase = appBaseUrl.replace(/\/$/, '');
  const quicklinkUrl = cleanBase.endsWith('/compiler')
    ? `${cleanBase}/api/lti/launch?assignment_id=${encodeURIComponent(assignmentId)}`
    : `${cleanBase}/compiler/api/lti/launch?assignment_id=${encodeURIComponent(assignmentId)}`;

  if (tokenUrl && privateKey && clientId && !tokenUrl.includes('your-institution')) {
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

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: clientAssertion,
          scope: 'core:*:* content:*:*'
        })
      });

      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json();
        const targetModuleId = moduleId || '1531';
        const createUrl = `https://${host}/d2l/api/le/1.74/${orgUnitId}/content/modules/${targetModuleId}/structure/`;

        const createRes = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Title: assignmentTitle,
            ShortTitle: assignmentTitle,
            Type: 1, // Quicklink / Link
            TopicType: 3,
            Url: quicklinkUrl,
            StartDate: null,
            EndDate: null,
            DueDate: null,
            IsHidden: false,
            IsLocked: false
          })
        });

        if (createRes.ok) {
          const topicData = await createRes.json();
          console.log('[Brightspace Content API] Created topic successfully:', topicData);
          return {
            success: true,
            topicId: String(topicData.Id || topicData.id || ''),
            quicklinkUrl
          };
        } else {
          const errText = await createRes.text();
          console.warn('[Brightspace Content API] Topic creation non-200:', createRes.status, errText);
        }
      }
    } catch (e: any) {
      console.warn('[Brightspace Content API] Topic creation exception:', e?.message || e);
    }
  }

  return {
    success: false,
    quicklinkUrl
  };
}

