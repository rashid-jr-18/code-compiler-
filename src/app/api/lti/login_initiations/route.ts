import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * OpenID Connect Login Initiation Endpoint for Brightspace LTI 1.3
 * Brightspace initiates an authentication request to this endpoint.
 */
export async function GET(request: NextRequest) {
  return handleOidcInitiation(request);
}

export async function POST(request: NextRequest) {
  return handleOidcInitiation(request);
}

async function handleOidcInitiation(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  let iss = searchParams.get('iss');
  let login_hint = searchParams.get('login_hint');
  let target_link_uri = searchParams.get('target_link_uri');
  let client_id = searchParams.get('client_id');
  let lti_message_hint = searchParams.get('lti_message_hint');

  // If POST, parameters might be in the request body
  if (request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        iss = (formData.get('iss') as string) || iss;
        login_hint = (formData.get('login_hint') as string) || login_hint;
        target_link_uri = (formData.get('target_link_uri') as string) || target_link_uri;
        client_id = (formData.get('client_id') as string) || client_id;
        lti_message_hint = (formData.get('lti_message_hint') as string) || lti_message_hint;
      }
    } catch (e) {
      // Ignore body parse errors and use query params
    }
  }

  console.log('[LTI OIDC Initiation] Received:', { iss, client_id, login_hint });

  if (!iss || !login_hint) {
    return NextResponse.json({ error: 'Missing iss or login_hint parameter' }, { status: 400 });
  }

  const appBaseUrl = process.env.APP_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const redirectUri = `${appBaseUrl}/api/lti/launch`;
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  // Brightspace OIDC Auth Endpoint
  const authUrl = new URL('https://auth.brightspace.com/core/connect/auth');
  authUrl.searchParams.set('response_type', 'id_token');
  authUrl.searchParams.set('response_mode', 'form_post');
  authUrl.searchParams.set('scope', 'openid');
  authUrl.searchParams.set('client_id', client_id || process.env.LTI_CLIENT_ID || 'test-client-id');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('login_hint', login_hint);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('prompt', 'none');

  if (lti_message_hint) {
    authUrl.searchParams.set('lti_message_hint', lti_message_hint);
  }

  return NextResponse.redirect(authUrl.toString(), 302);
}

