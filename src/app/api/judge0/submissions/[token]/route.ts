import { NextRequest, NextResponse } from 'next/server';
import { getSubmission } from '@/lib/storage';

interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
  token: string;
  compile_output?: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    console.log(`[${new Date().toISOString()}] Retrieving submission: ${token}`);
    
    // Check if submission exists
    const result = getSubmission(token);
    
    if (!result) {
      console.log(`[${new Date().toISOString()}] Submission not found: ${token}`);
      return NextResponse.json({
        error: 'Submission not found'
      }, { status: 404 });
    }
    
    console.log(`[${new Date().toISOString()}] Found submission: ${token}, status: ${result.status.description}`);
    
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('Error retrieving submission:', error);
    return NextResponse.json({
      error: 'Failed to retrieve submission',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
