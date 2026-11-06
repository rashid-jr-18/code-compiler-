import { NextRequest, NextResponse } from 'next/server';
import { executeWithPiston } from '@/lib/piston';
import { normalizeOutput } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceCode, languageId, stdin = '', expectedOutput, testCases } = body;

    if (!sourceCode || !languageId) {
      return NextResponse.json({ error: 'sourceCode and languageId are required' }, { status: 400 });
    }

    // If multi-testcases or explicit expectedOutput are provided, evaluate each testcase
    const cases = Array.isArray(testCases) && testCases.length > 0
      ? testCases
      : (expectedOutput !== undefined ? [{ id: 'sample', input: stdin, expectedOutput }] : null);

    if (cases && cases.length > 0) {
      const results: Array<{
        id: string;
        passed: boolean;
        input: string;
        expectedOutput: string;
        actualOutput: string;
        error?: string;
        time?: number;
      }> = [];

      let passedCount = 0;
      let hasCompileError = false;
      let hasRuntimeError = false;

      for (let i = 0; i < cases.length; i++) {
        const tc = cases[i];
        const res = await executeWithPiston(sourceCode, Number(languageId), tc.input || '');

        if (res.status.id === 6) { // Compilation Error
          hasCompileError = true;
          const errOutput = res.compile_output || res.stderr || 'Compilation failed';
          results.push({
            id: tc.id || `tc_${i + 1}`,
            passed: false,
            input: tc.input || '',
            expectedOutput: tc.expectedOutput || '',
            actualOutput: res.stdout || '',
            error: errOutput,
            time: parseFloat(res.time || '0')
          });
          break;
        }

        const actualNorm = normalizeOutput(res.stdout || '');
        const expectedNorm = normalizeOutput(tc.expectedOutput || '');
        const isPassed = res.status.id === 3 && actualNorm === expectedNorm;

        if (isPassed) {
          passedCount++;
        } else if (res.status.id !== 3) {
          hasRuntimeError = true;
        }

        results.push({
          id: tc.id || `tc_${i + 1}`,
          passed: isPassed,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          actualOutput: res.stdout || '',
          error: res.stderr || (res.status.id !== 3 ? res.status.description : undefined),
          time: parseFloat(res.time || '0')
        });
      }

      // If stopped early by compilation failure, fill remaining cases
      while (results.length < cases.length) {
        const tc = cases[results.length];
        results.push({
          id: tc.id || `tc_${results.length + 1}`,
          passed: false,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          actualOutput: '',
          error: 'Compilation Error'
        });
      }

      let overallStatus: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' = 'Accepted';
      if (hasCompileError) {
        overallStatus = 'Compilation Error';
      } else if (passedCount === cases.length) {
        overallStatus = 'Accepted';
      } else if (hasRuntimeError && passedCount === 0) {
        overallStatus = 'Runtime Error';
      } else {
        overallStatus = 'Wrong Answer';
      }

      return NextResponse.json({
        overallStatus,
        status: overallStatus,
        passedTests: passedCount,
        totalTests: cases.length,
        stdout: results[0]?.actualOutput || null,
        stderr: results.find(r => r.error)?.error || null,
        testResults: results,
        executionTime: results[0]?.time || 0
      });
    }

    // Default raw code execution when no test cases or expected output are supplied
    const result = await executeWithPiston(sourceCode, Number(languageId), stdin);
    const hasError = result.status.id !== 3 || Boolean(result.stderr);

    return NextResponse.json({
      stdout: result.stdout || null,
      stderr: result.stderr || null,
      compileOutput: result.compile_output || null,
      status: hasError ? (result.stderr ? 'Runtime Error' : result.status.description) : 'Executed',
      overallStatus: hasError ? 'Runtime Error' : 'Executed',
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
