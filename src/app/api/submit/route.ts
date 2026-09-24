import { NextRequest, NextResponse } from 'next/server';
import { executeWithPiston } from '@/lib/piston';
import { storeSubmission } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { source_code, language_id, stdin = '' } = await request.json();

    const token = uuidv4();
    storeSubmission(token, {
      stdout: null,
      stderr: null,
      status: { id: 1, description: 'In Queue' },
      time: '0.000',
      memory: 0,
      token
    });

    // Execute asynchronously via Piston
    executeWithPiston(source_code, language_id, stdin)
      .then((result) => {
        storeSubmission(token, {
          stdout: result.stdout || null,
          stderr: result.stderr || null,
          status: result.status,
          time: result.time || '0.000',
          memory: result.memory || 0,
          token,
          compile_output: result.compile_output || null
        });
      })
      .catch((err) => {
        storeSubmission(token, {
          stdout: null,
          stderr: err instanceof Error ? err.message : 'Execution error',
          status: { id: 13, description: 'Internal Error' },
          time: '0.000',
          memory: 0,
          token
        });
      });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error submitting code:', error);
    return NextResponse.json(
      { error: 'Failed to submit code' },
      { status: 500 }
    );
  }
}
