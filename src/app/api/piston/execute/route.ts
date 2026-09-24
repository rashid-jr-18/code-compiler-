import { NextRequest, NextResponse } from 'next/server';
import { executeWithPiston } from '@/lib/piston';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both standard Piston payload and custom payload
    let sourceCode = '';
    let language: string | number = '';
    let stdin = body.stdin || '';

    if (body.files && Array.isArray(body.files) && body.files.length > 0) {
      sourceCode = body.files[0].content || '';
      language = body.language;
    } else if (body.source_code !== undefined) {
      sourceCode = body.source_code;
      language = body.language_id !== undefined ? body.language_id : body.language;
    } else if (body.sourceCode !== undefined) {
      sourceCode = body.sourceCode;
      language = body.languageId !== undefined ? body.languageId : body.language;
    }

    if (!sourceCode) {
      return NextResponse.json(
        { error: 'Source code is required (via files[0].content, source_code, or sourceCode)' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    if (!language) {
      return NextResponse.json(
        { error: 'Language or language_id is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const result = await executeWithPiston(sourceCode, language, stdin);

    // Provide unified response that satisfies both Piston clients and UI clients
    const responsePayload = {
      ...(result.pistonResponse || {}),
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
      time: result.time,
      memory: result.memory
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error: any) {
    console.error('[Piston API] Execution error:', error);
    return NextResponse.json(
      {
        error: 'Execution failed',
        details: error?.message || 'Unknown error'
      },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

