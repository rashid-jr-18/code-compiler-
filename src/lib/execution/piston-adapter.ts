/**
 * Piston Execution Adapter
 * Decouples code execution from specific API contracts.
 * Normalizes Piston engine responses into an authoritative execution result schema.
 */

import { executeWithPiston, resolveLanguage } from '@/lib/piston';
import { ExecutionResult } from '@/types';

export interface NormalizedExecutionResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  exitCode: number;
  status: {
    id: 3 | 4 | 5 | 6 | 11;
    description: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error (NZEC)';
  };
  time: string;
  memory: number;
  token?: string;
}

/**
 * Execute code with Piston engine and return normalized execution details
 */
export async function executeCode(
  sourceCode: string,
  languageId: number,
  stdin: string = '',
  timeoutMs: number = 10000
): Promise<NormalizedExecutionResult> {
  const rawResult: ExecutionResult = await executeWithPiston(sourceCode, languageId, stdin);

  const stdout = rawResult.stdout || '';
  const stderr = rawResult.stderr || '';
  const compile_output = rawResult.compile_output || '';
  const time = rawResult.time || '0.000';
  const memory = rawResult.memory || 0;

  let statusId: 3 | 4 | 5 | 6 | 11 = 3;
  let statusDescription: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error (NZEC)' = 'Accepted';
  let exitCode = 0;

  if (rawResult.status.id === 6 || compile_output) {
    statusId = 6;
    statusDescription = 'Compilation Error';
    exitCode = 1;
  } else if (rawResult.status.id === 5 || stderr.toLowerCase().includes('time limit') || stderr.toLowerCase().includes('timed out')) {
    statusId = 5;
    statusDescription = 'Time Limit Exceeded';
    exitCode = 124;
  } else if (rawResult.status.id !== 3 || stderr.length > 0) {
    statusId = 11;
    statusDescription = 'Runtime Error (NZEC)';
    exitCode = 1;
  }

  return {
    stdout,
    stderr,
    compile_output,
    exitCode,
    status: {
      id: statusId,
      description: statusDescription,
    },
    time,
    memory,
  };
}

export { resolveLanguage };

