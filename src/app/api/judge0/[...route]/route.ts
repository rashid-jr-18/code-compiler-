import { NextRequest, NextResponse } from 'next/server';

// Get Judge0 URL from environment variable with fallback
const JUDGE0_URL = process.env.NEXT_PUBLIC_JUDGE0_URL || 'http://localhost:2358';

// RapidAPI headers (if using RapidAPI)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RapidAPI-Key, X-RapidAPI-Host',
  };
}

function getProxyHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add RapidAPI headers if available
  if (RAPIDAPI_KEY) {
    headers['X-RapidAPI-Key'] = RAPIDAPI_KEY;
  }
  if (RAPIDAPI_HOST) {
    headers['X-RapidAPI-Host'] = RAPIDAPI_HOST;
  }

  return headers;
}

function encodeSourceToBase64(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const modifiedBody = { ...body };

  // If source_code is present, encode it to base64
  if (modifiedBody.source_code && typeof modifiedBody.source_code === 'string') {
    modifiedBody.source_code = Buffer.from(modifiedBody.source_code, 'utf-8').toString('base64');
    modifiedBody.base64_encoded = true;
  }

  return modifiedBody;
}

function decodeBase64Response(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const decodedData = { ...data };

  // Decode base64 fields if they exist
  const fieldsToDecode = ['stdout', 'stderr', 'compile_output', 'message'];
  
  fieldsToDecode.forEach(field => {
    if (decodedData[field] && typeof decodedData[field] === 'string') {
      try {
        decodedData[field] = Buffer.from(decodedData[field], 'base64').toString('utf-8');
      } catch (error) {
        // If decoding fails, keep original value
        console.warn(`Failed to decode ${field}:`, error);
      }
    }
  });

  return decodedData;
}

async function handleRequest(
  request: NextRequest,
  method: string,
  route: string[]
): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    
    // Construct the Judge0 URL
    const judge0Url = `${JUDGE0_URL}/${route.join('/')}${queryString ? `?${queryString}` : ''}`;

    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const requestBody = await request.json();
        body = JSON.stringify(encodeSourceToBase64(requestBody));
      } catch (error) {
        // If JSON parsing fails, keep body as null
      }
    }

    // For submissions endpoint, ensure base64_encoded=true is added to query params
    let finalUrl = judge0Url;
    if (route.includes('submissions')) {
      const urlObj = new URL(judge0Url);
      if (!urlObj.searchParams.has('base64_encoded')) {
        urlObj.searchParams.set('base64_encoded', 'true');
        finalUrl = urlObj.toString();
      }
    }

    const response = await fetch(finalUrl, {
      method,
      headers: getProxyHeaders(),
      body,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Judge0 API error: ${response.status} ${response.statusText}` },
        { 
          status: response.status,
          headers: getCorsHeaders()
        }
      );
    }

    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
      responseData = decodeBase64Response(responseData);
    } else {
      responseData = await response.text();
    }

    return NextResponse.json(responseData, {
      status: response.status,
      headers: getCorsHeaders()
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    );
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  return handleRequest(request, 'GET', route);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  return handleRequest(request, 'POST', route);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  return handleRequest(request, 'PUT', route);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  return handleRequest(request, 'DELETE', route);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  return handleRequest(request, 'PATCH', route);
}
