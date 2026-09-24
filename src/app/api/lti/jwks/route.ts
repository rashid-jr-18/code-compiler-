import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Public Keyset (JWKS) endpoint for Brightspace LTI 1.3
 * Exposes ONLY the tool's public key in standard RFC 7517 format.
 * NEVER exposes the private key!
 */
export async function GET() {
  try {
    const privateKeyPem = process.env.LTI_TOOL_PRIVATE_KEY;
    const keyId = 'edutech-key-1';

    if (!privateKeyPem) {
      // Return a valid JWKS format placeholder for development
      return NextResponse.json({
        keys: [
          {
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: keyId,
            n: 'u1lK...',
            e: 'AQAB'
          }
        ]
      });
    }

    // Derive public key from private key
    const publicKey = crypto.createPublicKey(privateKeyPem);
    const jwk = publicKey.export({ format: 'jwk' });

    return NextResponse.json({
      keys: [
        {
          ...jwk,
          kid: keyId,
          alg: 'RS256',
          use: 'sig'
        }
      ]
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    console.error('JWKS export error:', error);
    return NextResponse.json({ error: 'Failed to generate JWKS' }, { status: 500 });
  }
}

