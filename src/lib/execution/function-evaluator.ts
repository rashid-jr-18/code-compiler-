import { executeWithPiston, UnifiedExecutionResult } from '@/lib/piston';
import { getLanguageAdapter } from './adapters/registry';
import { HarnessOptions, TestCaseInput } from './adapters/types';
import { compareValues, ComparisonResult } from './comparison';
import { FunctionParameter } from '@/types';

export interface EvaluatedCaseResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: any;
  expectedOutput: any;
  actualType?: string;
  expectedType?: string;
  executionTime: number;
  points: number;
  maxPoints: number;
  error?: string;
  message?: string;
  stdout?: string;
  isHidden?: boolean;
}

export interface FunctionEvaluationResponse {
  overallStatus: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded';
  status: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalScore: number;
  maxScore: number;
  executionTime: number;
  compileError?: string;
  runtimeError?: string;
  testResults: EvaluatedCaseResult[];
}

export interface EvaluateFunctionOptions {
  functionName: string;
  parameters: (string | FunctionParameter)[];
  returnType: string;
  sourceCode: string;
  languageId: number;
  testCases: TestCaseInput[];
  maxPoints?: number;
  timeoutSeconds?: number;
}

/**
 * Authoritative Function-Based Evaluation Service
 * Evaluates function-based submissions in an isolated sandbox and validates results with type-awareness.
 */
export async function evaluateFunctionSubmission(
  options: EvaluateFunctionOptions
): Promise<FunctionEvaluationResponse> {
  const {
    functionName,
    parameters = [],
    returnType = 'any',
    sourceCode,
    languageId,
    testCases = [],
    maxPoints = 100,
    timeoutSeconds = 10
  } = options;

  if (!sourceCode || !sourceCode.trim()) {
    return {
      overallStatus: 'Compilation Error',
      status: 'Compilation Error',
      totalTests: testCases.length,
      passedTests: 0,
      failedTests: testCases.length,
      totalScore: 0,
      maxScore,
      executionTime: 0,
      compileError: 'Submitted code is empty. Please provide an implementation for ' + functionName,
      testResults: []
    };
  }

  const adapter = getLanguageAdapter(languageId);
  if (!adapter) {
    return {
      overallStatus: 'Compilation Error',
      status: 'Compilation Error',
      totalTests: testCases.length,
      passedTests: 0,
      failedTests: testCases.length,
      totalScore: 0,
      maxScore,
      executionTime: 0,
      compileError: `Function-based evaluation is currently supported for Python and JavaScript. Language ID ${languageId} is not yet supported in function mode.`,
      testResults: []
    };
  }

  // 1. Generate execution harness
  const harnessOptions: HarnessOptions = {
    functionName: functionName.trim(),
    parameters,
    returnType: returnType.trim(),
    studentCode: sourceCode,
    testCases,
    timeoutSeconds
  };

  const harness = adapter.generateHarness(harnessOptions);

  // 2. Execute harness strictly inside Piston isolated sandbox
  const pistonResult: UnifiedExecutionResult = await executeWithPiston(
    harness.code,
    languageId,
    ''
  );

  // 3. Check for execution timeout
  if (pistonResult.status.id === 5) {
    return {
      overallStatus: 'Time Limit Exceeded',
      status: 'Time Limit Exceeded',
      totalTests: testCases.length,
      passedTests: 0,
      failedTests: testCases.length,
      totalScore: 0,
      maxScore,
      executionTime: parseFloat(pistonResult.time || '0'),
      runtimeError: 'Execution Timed Out. Please check for infinite loops or high time complexity.',
      testResults: testCases.map(tc => ({
        testCaseId: tc.id,
        passed: false,
        actualOutput: null,
        expectedOutput: tc.expectedOutput,
        executionTime: parseFloat(pistonResult.time || '0'),
        points: 0,
        maxPoints: Number(tc.points) || Math.round(maxPoints / (testCases.length || 1)),
        error: 'Time Limit Exceeded',
        isHidden: tc.isHidden
      }))
    };
  }

  // 4. Parse harness output
  const rawStdout = pistonResult.stdout || '';
  const rawStderr = pistonResult.stderr || pistonResult.compile_output || '';
  const parsedHarness = adapter.parseHarnessOutput(rawStdout, rawStderr, testCases);

  // 5. Handle compilation / missing function errors
  if (parsedHarness.hasCompileError) {
    const compileMsg = parsedHarness.compileError || 'Compilation Error';
    return {
      overallStatus: 'Compilation Error',
      status: 'Compilation Error',
      totalTests: testCases.length,
      passedTests: 0,
      failedTests: testCases.length,
      totalScore: 0,
      maxScore,
      executionTime: parseFloat(pistonResult.time || '0'),
      compileError: compileMsg,
      testResults: testCases.map(tc => ({
        testCaseId: tc.id,
        passed: false,
        actualOutput: null,
        expectedOutput: tc.expectedOutput,
        executionTime: 0,
        points: 0,
        maxPoints: Number(tc.points) || Math.round(maxPoints / (testCases.length || 1)),
        error: compileMsg,
        isHidden: tc.isHidden
      }))
    };
  }

  // 6. Evaluate each test case using type-aware comparison
  const rawSumPoints = testCases.reduce((sum, c) => sum + (Number(c.points) || 0), 0);
  const defaultPerCasePoints = testCases.length > 0 ? (maxPoints / testCases.length) : 0;

  let totalScore = 0;
  let passedCount = 0;
  let hasRuntimeError = false;
  const evaluatedCases: EvaluatedCaseResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const caseMaxPoints = rawSumPoints > 0
      ? Math.round(((Number(tc.points) || 0) / rawSumPoints) * maxPoints)
      : Math.round(defaultPerCasePoints);

    const harnessCase = parsedHarness.cases.find(c => c.testCaseId === tc.id) || parsedHarness.cases[i];

    if (!harnessCase || harnessCase.status === 'ERROR') {
      hasRuntimeError = true;
      evaluatedCases.push({
        testCaseId: tc.id,
        passed: false,
        actualOutput: harnessCase?.actualOutput ?? null,
        expectedOutput: tc.expectedOutput,
        actualType: harnessCase?.actualType || 'error',
        executionTime: harnessCase?.executionTime || 0,
        points: 0,
        maxPoints: caseMaxPoints,
        error: harnessCase?.error || 'Runtime Error during test execution',
        stdout: harnessCase?.stdout,
        isHidden: tc.isHidden
      });
      continue;
    }

    // Type-aware comparison
    const comp: ComparisonResult = compareValues(harnessCase.actualOutput, tc.expectedOutput, {
      returnType
    });

    if (comp.passed) {
      passedCount++;
      totalScore += caseMaxPoints;
    }

    evaluatedCases.push({
      testCaseId: tc.id,
      passed: comp.passed,
      actualOutput: comp.actualNormalized,
      expectedOutput: comp.expectedNormalized,
      actualType: comp.actualType,
      expectedType: comp.expectedType,
      executionTime: harnessCase.executionTime,
      points: comp.passed ? caseMaxPoints : 0,
      maxPoints: caseMaxPoints,
      message: comp.message,
      error: comp.passed ? undefined : comp.message,
      stdout: harnessCase.stdout,
      isHidden: tc.isHidden
    });
  }

  // Cap / scale final score
  if (passedCount === testCases.length && testCases.length > 0) {
    totalScore = maxPoints;
  } else {
    totalScore = Math.min(maxPoints, Math.round(totalScore));
  }

  let overallStatus: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' = 'Accepted';
  if (passedCount === testCases.length) {
    overallStatus = 'Accepted';
  } else if (hasRuntimeError && passedCount === 0) {
    overallStatus = 'Runtime Error';
  } else {
    overallStatus = 'Wrong Answer';
  }

  return {
    overallStatus,
    status: overallStatus,
    totalTests: testCases.length,
    passedTests: passedCount,
    failedTests: testCases.length - passedCount,
    totalScore,
    maxScore,
    executionTime: parseFloat(pistonResult.time || '0'),
    testResults: evaluatedCases
  };
}
