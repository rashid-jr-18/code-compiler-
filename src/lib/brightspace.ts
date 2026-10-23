// D2L Brightspace LTI 1.3 Advantage & Assignment and Grade Services (AGS) Integration

import jwt from 'jsonwebtoken';

export interface BrightspaceGradeExportParams {
  lineItemUrl?: string;
  userId: string; // Brightspace LTI Subject or User ID
  scoreGiven: number;
  scoreMaximum: number;
  comment?: string;
}

export interface BrightspaceExportResult {
  success: boolean;
  gradeId?: string;
  timestamp: string;
  error?: string;
}

/**
 * Sends a reviewed score to Brightspace Gradebook via LTI 1.3 AGS /scores endpoint.
 * Requires Faculty authorization before invocation.
 */
export async function postGradeToBrightspace(params: BrightspaceGradeExportParams): Promise<BrightspaceExportResult> {
  const { lineItemUrl, userId, scoreGiven, scoreMaximum, comment } = params;

  console.log(`[Brightspace AGS] Exporting grade:`, {
    userId,
    scoreGiven,
    scoreMaximum,
    lineItemUrl: lineItemUrl || 'Default AGS LineItem'
  });

  // Verify parameters
  if (scoreGiven < 0 || scoreGiven > scoreMaximum) {
    throw new Error(`Invalid score: scoreGiven (${scoreGiven}) cannot exceed scoreMaximum (${scoreMaximum})`);
  }

  // 1. Validate lineItemUrl (Must be a real Brightspace AGS LineItem URL)
  if (!lineItemUrl || !lineItemUrl.startsWith('http')) {
    const errorMsg = 'Cannot export to Brightspace: This assessment does not have a linked Brightspace Grade Item URL (lineItemUrl). Please launch this assessment from Brightspace once after linking the Grade Item.';
    console.error(`[Brightspace AGS Error] ${errorMsg}`);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: errorMsg
    };
  }

  // 2. Resolve Brightspace OAuth2 credentials
  const rawTokenUrl = process.env.LTI_TOKEN_URL;
  const tokenUrl = (rawTokenUrl && !rawTokenUrl.includes('your-institution'))
    ? rawTokenUrl
    : 'https://auth.brightspace.com/core/connect/token';
  const privateKey = process.env.LTI_TOOL_PRIVATE_KEY;
  const clientId = process.env.LTI_CLIENT_ID;

  if (!privateKey || !clientId) {
    const errorMsg = 'Cannot export to Brightspace: LTI_CLIENT_ID or LTI_TOOL_PRIVATE_KEY is missing in server environment.';
    console.error(`[Brightspace AGS Error] ${errorMsg}`);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: errorMsg
    };
  }

  try {
    // 3. Create client assertion JWT (LTI 1.3 Advantage standard)
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

    // 4. Request Bearer token from Brightspace OAuth2 endpoint
    console.log(`[Brightspace AGS] Requesting OAuth token from ${tokenUrl}...`);
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/score https://purl.imsglobal.org/spec/lti-ags/scope/lineitem'
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error(`[Brightspace AGS Error] OAuth token failed (${tokenResponse.status}):`, errText);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: `Brightspace OAuth token request failed (${tokenResponse.status}): ${errText}`
      };
    }

    const { access_token } = await tokenResponse.json();

    // 5. Post score to AGS endpoint
    // Brightspace score endpoint format: <lineItemUrl>/scores
    const scoreEndpoint = lineItemUrl.endsWith('/scores') ? lineItemUrl : `${lineItemUrl.replace(/\/$/, '')}/scores`;
    const scorePayload = {
      timestamp: new Date().toISOString(),
      scoreGiven,
      scoreMaximum,
      comment: comment || 'Graded on EduTech Compiler & Approved by Faculty',
      activityProgress: 'Completed',
      gradingProgress: 'FullyGraded',
      userId
    };

    console.log(`[Brightspace AGS] Posting score to ${scoreEndpoint}:`, scorePayload);

    const agsResponse = await fetch(scoreEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/vnd.ims.lis.v1.score+json'
      },
      body: JSON.stringify(scorePayload)
    });

    if (!agsResponse.ok) {
      const errText = await agsResponse.text();
      console.error(`[Brightspace AGS Error] Score submission failed (${agsResponse.status}):`, errText);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: `Brightspace AGS Score POST failed (${agsResponse.status}): ${errText}`
      };
    }

    console.log(`[Brightspace AGS] Successfully exported grade to Brightspace Gradebook!`);
    return {
      success: true,
      gradeId: `ags_d2l_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

  } catch (err: unknown) {
    console.error('[Brightspace AGS Error]', err);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown Brightspace AGS error'
    };
  }
}

