import { NextResponse } from 'next/server';

export async function GET() {
  // Return your public key set
  const jwks = {
    keys: [
      {
        kty: "RSA",
        use: "sig",
        kid: "your-key-id",
        n: "your-public-key-n-value",
        e: "AQAB"
      }
    ]
  };
  
  return NextResponse.json(jwks);
}
