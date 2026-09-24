import { NextRequest, NextResponse } from 'next/server';
import { executeWithPiston } from '@/lib/piston';
import { v4 as uuidv4 } from 'uuid';

interface ExecuteRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();
    const { source_code, language_id, stdin = '' } = body;

    if (!source_code || !language_id) {
      return NextResponse.json({
        error: 'source_code and language_id are required'
      }, { status: 400 });
    }

    const token = uuidv4();
    const result = await executeWithPiston(source_code, language_id, stdin);

    return NextResponse.json({
      stdout: result.stdout || null,
      stderr: result.stderr || null,
      status: result.status,
      time: result.time || "0.000",
      memory: result.memory || 0,
      token,
      compile_output: result.compile_output || null,
      pistonResponse: result.pistonResponse
    });

  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json({
      error: 'Code execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
