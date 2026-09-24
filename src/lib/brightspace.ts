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

  // If live Brightspace LTI credentials are provided, perform OAuth2 client_credentials token request and POST to AGS
  const tokenUrl = process.env.LTI_TOKEN_URL;
  const privateKey = process.env.LTI_TOOL_PRIVATE_KEY;
  const clientId = process.env.LTI_CLIENT_ID;

  if (tokenUrl && privateKey && clientId && lineItemUrl && lineItemUrl.startsWith('http')) {
    try {
      // 1. Create client assertion JWT
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

      // 2. Request Bearer token from Brightspace OAuth2 endpoint
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
        throw new Error(`Brightspace OAuth failed: ${tokenResponse.status} ${errText}`);
      }

      const { access_token } = await tokenResponse.json();

      // 3. Post score to AGS endpoint
      const scoreEndpoint = lineItemUrl.endsWith('/scores') ? lineItemUrl : `${lineItemUrl}/scores`;
      const scorePayload = {
        timestamp: new Date().toISOString(),
        scoreGiven,
        scoreMaximum,
        comment: comment || 'Graded on EduTech Compiler & Approved by Faculty',
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
        userId
      };

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
        throw new Error(`AGS Score POST failed: ${agsResponse.status} ${errText}`);
      }

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

  // Simulated live-ready response when running locally or before live credentials are bound
  return {
    success: true,
    gradeId: `mock_ags_${Date.now()}`,
    timestamp: new Date().toISOString()
  };
}

