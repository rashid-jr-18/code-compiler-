import { NextRequest, NextResponse } from 'next/server';
import { executeWithPiston } from '@/lib/piston';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceCode, languageId, stdin = '' } = body;

    if (!sourceCode || !languageId) {
      return NextResponse.json({ error: 'sourceCode and languageId are required' }, { status: 400 });
    }

    const result = await executeWithPiston(sourceCode, Number(languageId), stdin);

    return NextResponse.json({
      stdout: result.stdout || null,
      stderr: result.stderr || null,
      compileOutput: result.compile_output || null,
      status: result.status.description,
      executionTime: parseFloat(result.time || '0'),
      pistonResponse: result.pistonResponse
    });

  } catch (error) {
    console.error('Code run error:', error);
    return NextResponse.json({
      error: 'Execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
