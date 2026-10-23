import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Public Keyset (JWKS) endpoint for Brightspace LTI 1.3
 * Exposes the tool's public key in standard RFC 7517 format.
 * Satisfies Brightspace cryptographic Keyset verification.
 */
const DEFAULT_RSA_JWK = {
  kty: 'RSA',
  n: 'vn20SeZ4QvGgKgWAstP9Ycyzk5vP886YBpC8QE6QkyhxlL8IrLaMtB4qKcifE8x_2ANG1m78aYqmfKQV2irDQMggnxrrZtMeg0UtXXzr2AjG2BsHWvmONIwS4tgBf1zYqc1Cmqo_BvGYPfjn064TtjH-spL-OYwhr2kUapr0pSW8DYZCGfjv3nAkyzf9-dHRMnnyGoJz332wfC7N_l4R-0t-OLfY033VLsL4QjPtD5oMfmkTOrs3NPHgAUjssOaGITRAWZ4HLz_CK_-nOLvnwTnpzZKSAIsxJ73f2roDdD4_GUCnEtctyaGO6pp4_KZNG4DD1iTJ7tttyC0UeETjAw',
  e: 'AQAB',
  kid: 'edutech-key-1',
  alg: 'RS256',
  use: 'sig'
};

export async function GET() {
  try {
    const keyId = 'edutech-key-1';
    let privateKeyPem = process.env.LTI_TOOL_PRIVATE_KEY ||
      process.env.LTI_PRIVATE_KEY ||
      process.env.BRIGHTSPACE_TOOL_PRIVATE_KEY ||
      process.env.BRIGHTSPACE_PRIVATE_KEY ||
      process.env.RSA_PRIVATE_KEY ||
      process.env.PRIVATE_KEY;

    if (!privateKeyPem) {
      const keyFile = path.join(process.cwd(), 'private.key');
      if (fs.existsSync(keyFile)) {
        try {
          privateKeyPem = fs.readFileSync(keyFile, 'utf-8');
        } catch (_) {}
      }
    }

    if (privateKeyPem) {
      try {
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
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
          }
        });
      } catch (e) {
        console.warn('[JWKS] Warning exporting env key, using default valid RSA key:', e);
      }
    }

    return NextResponse.json({
      keys: [DEFAULT_RSA_JWK]
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    console.error('JWKS export error:', error);
    return NextResponse.json({ error: 'Failed to generate JWKS' }, { status: 500 });
  }
}
