import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
  time: string;
  memory: number;
  token: string;
  compile_output?: string | null;
}

// Language configurations
const LANGUAGES: Record<number, {
  name: string;
  extension: string;
  compile_cmd?: string;
  run_cmd: string;
}> = {
  71: { // Python 3
    name: 'Python (3.8.1)',
    extension: 'py',
    run_cmd: 'python3'
  },
  63: { // JavaScript (Node.js)
    name: 'JavaScript (Node.js 12.14.0)',
    extension: 'js',
    run_cmd: 'node'
  },
  50: { // C (GCC 9.2.0)
    name: 'C (GCC 9.2.0)',
    extension: 'c',
    compile_cmd: 'gcc -o program',
    run_cmd: './program'
  },
  54: { // C++ (GCC 9.2.0)
    name: 'C++ (GCC 9.2.0)',
    extension: 'cpp',
    compile_cmd: 'g++ -o program',
    run_cmd: './program'
  },
  62: { // Java (OpenJDK 13.0.1)
    name: 'Java (OpenJDK 13.0.1)',
    extension: 'java',
    compile_cmd: 'javac',
    run_cmd: 'java Main'
  }
};

// In-memory storage for results (in production, use Redis or database)
const submissions = new Map<string, ExecutionResult>();

function executeCommand(command: string, cwd: string, input?: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const child = exec(command, {
      cwd,
      timeout: 10000, // 10 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    }, (error, stdout, stderr) => {
      const executionTime = (Date.now() - startTime) / 1000;
      
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: error?.code || 0,
        executionTime
      });
    });

    // Send input to stdin if provided
    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

async function processSubmission(token: string, source_code: string, language_id: number, stdin: string = '') {
  try {
    const language = LANGUAGES[language_id];
    if (!language) {
      submissions.set(token, {
        stdout: null,
        stderr: `Language with ID ${language_id} is not supported`,
        status: { id: 13, description: 'Internal Error' },
        time: "0.000",
        memory: 0,
        token
      });
      return;
    }

    // Create working directory in /tmp
    const workDir = path.join('/tmp', `submission_${token}`);
    await mkdir(workDir, { recursive: true });

    // Write source code to file
    const sourceFile = path.join(workDir, `main.${language.extension}`);
    await writeFile(sourceFile, source_code);

    let stdout = '';
    let stderr = '';
    let status = { id: 3, description: 'Accepted' };
    let executionTime = 0;
    let compile_output = null;

    // Compile if needed
    if (language.compile_cmd) {
      const compileCmd = `${language.compile_cmd} main.${language.extension}`;
      const compileResult = await executeCommand(compileCmd, workDir);
      
      if (compileResult.exitCode !== 0) {
        status = { id: 6, description: 'Compilation Error' };
        stderr = compileResult.stderr;
        compile_output = compileResult.stderr;
        
        submissions.set(token, {
          stdout: null,
          stderr,
          status,
          time: compileResult.executionTime.toFixed(3),
          memory: 0,
          token,
          compile_output
        });

        // Clean up
        exec(`rm -rf ${workDir}`);
        return;
      }
    }

    // Execute the code
    const runCmd = language.extension === 'java' 
      ? `${language.run_cmd}` 
      : `${language.run_cmd} main.${language.extension}`;
    
    const result = await executeCommand(runCmd, workDir, stdin);
    
    stdout = result.stdout;
    stderr = result.stderr;
    executionTime = result.executionTime;

    // Determine status based on exit code
    if (result.exitCode !== 0) {
      if (result.exitCode === 124) { // timeout
        status = { id: 5, description: 'Time Limit Exceeded' };
      } else {
        status = { id: 11, description: 'Runtime Error (NZEC)' };
      }
    }

    // Store the result
    submissions.set(token, {
      stdout: stdout || null,
      stderr: stderr || null,
      status,
      time: executionTime.toFixed(3),
      memory: 0,
      token,
      compile_output
    });

    // Clean up working directory
    exec(`rm -rf ${workDir}`);

  } catch (error) {
    console.error('Submission processing error:', error);
    submissions.set(token, {
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
    const body: SubmissionRequest = await request.json();
    const { source_code, language_id, stdin = '' } = body;

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

// submissions map is internal to this route

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
