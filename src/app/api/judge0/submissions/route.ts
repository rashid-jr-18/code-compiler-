import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storeSubmission, getSubmission, clearSubmission } from '@/lib/storage';
import { executeWithPiston } from '@/lib/piston';
interface SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
}

interface SubmissionResponse {
  token: string;
}

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

async function processSubmission(token: string, source_code: string, language_id: number, stdin: string = '') {
  try {
    storeSubmission(token, {
      stdout: null,
      stderr: null,
      status: { id: 1, description: 'In Queue' },
      time: "0.000",
      memory: 0,
      token
    });

    console.log(`[${new Date().toISOString()}] Processing submission ${token} via Piston engine (Language ${language_id})`);

    const result = await executeWithPiston(source_code, language_id, stdin);

    storeSubmission(token, {
      stdout: result.stdout || null,
      stderr: result.stderr || null,
      status: result.status,
      time: result.time || "0.000",
      memory: result.memory || 0,
      token,
      compile_output: result.compile_output || null
    });

    console.log(`[${new Date().toISOString()}] Piston execution completed for token ${token}`);
  } catch (error: any) {
    console.error('Submission processing error:', error);
    storeSubmission(token, {
      stdout: null,
      stderr: error instanceof Error ? error.message : 'Unknown error',
      status: { id: 13, description: 'Internal Error' },
      time: "0.000",
      memory: 0,
      token
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const textBody = await request.text();
    console.log(`[${new Date().toISOString()}] Received submission request with body:`, textBody);

    if (!textBody) {
      console.error(`[${new Date().toISOString()}] Empty request body received.`);
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const body: SubmissionRequest = JSON.parse(textBody);
    const { source_code, language_id, stdin = '' } = body;

    // Validate required fields
    if (!source_code || typeof source_code !== 'string') {
      console.error(`[${new Date().toISOString()}] Missing or invalid source_code`);
      return NextResponse.json({ error: 'source_code is required and must be a string' }, { status: 400 });
    }

    if (!language_id || typeof language_id !== 'number') {
      console.error(`[${new Date().toISOString()}] Missing or invalid language_id`);
      return NextResponse.json({ error: 'language_id is required and must be a number' }, { status: 400 });
    }

    console.log(`[${new Date().toISOString()}] New submission request for language ${language_id}`);

    // Generate unique token
    const token = uuidv4();

    // Start processing in background
    processSubmission(token, source_code, language_id, stdin);

    // Return submission token immediately
    const response: SubmissionResponse = {
      token
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Submission creation error:', error);
    return NextResponse.json({
      error: 'Failed to create submission',
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

