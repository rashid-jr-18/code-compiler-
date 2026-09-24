// Authoritative Server-Side Grading Engine
// Executes submitted code against all test cases (including hidden ones)
// Calculates official scores and persists results locally.
// CRITICAL: Does NOT send grades to Brightspace!

import { db } from '@/lib/db';
import { Question, TestCase, TestResult, AuthoritativeSubmission } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { EXECUTION_LANGUAGES, getExecutionConfig } from '@/lib/execution-languages';
import { executeCode } from '@/lib/execution/piston-adapter';
import { normalizeOutput } from '@/lib/utils';

export interface GradingResult {
  submissionId: string;
  totalScore: number;
  maxScore: number;
  passedTests: number;
  totalTests: number;
  overallStatus: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  testResults: Array<{
    testCaseId: string;
    passed: boolean;
    points: number;
    maxPoints: number;
    executionTime?: number;
    error?: string;
    actualOutput?: string; // only for non-hidden tests
    expectedOutput?: string; // only for non-hidden tests
    isHidden: boolean;
  }>;
}

export async function gradeSubmission(
  assignmentId: string,
  questionId: string,
  learnerId: string,
  sourceCode: string,
  languageId: number
): Promise<GradingResult> {
  const question = db.getQuestionById(questionId);
  if (!question) {
    throw new Error(`Question with ID ${questionId} not found`);
  }

  const language = getExecutionConfig(languageId);
  const submissionToken = `sub_${Date.now()}_${uuidv4().substring(0, 8)}`;
  const workDir = path.join('/tmp', `grading_${submissionToken}`);
  await mkdir(workDir, { recursive: true });

  const sourceFile = path.join(workDir, `Main.${language.extension}`);
  await writeFile(sourceFile, sourceCode);

  // 1. First test execution to check compilation and runtime
  const testResults: TestResult[] = [];
  let totalScore = 0;
  let maxScore = 0;
  let passedCount = 0;
  let hasRuntimeError = false;
  let hasTimeLimit = false;

  for (let i = 0; i < question.testCases.length; i++) {
    const tc = question.testCases[i];
    maxScore += tc.points;

    const execRes = await executeCode(sourceCode, languageId, tc.input);

    if (execRes.status.id === 6) { // Compilation Error
      const compileError = execRes.compile_output || execRes.stderr || 'Compilation failed';
      const allResults: TestResult[] = question.testCases.map(c => ({
        testCaseId: c.id,
        passed: false,
        actualOutput: '',
        expectedOutput: c.expectedOutput,
        points: 0,
        maxPoints: c.points,
        error: compileError
      }));

      const submission: AuthoritativeSubmission = {
        id: submissionToken,
        assignmentId,
        questionId,
        learnerId,
        code: sourceCode,
        languageId,
        status: 'Compilation Error',
        score: 0,
        submittedAt: new Date().toISOString(),
        testResults: allResults
      };

      db.createSubmission(submission);

      const al = db.getAssignmentLearner(assignmentId, learnerId);
      if (al) {
        db.updateAssignmentLearner(al.id, {
          status: 'SUBMITTED',
          score: 0,
          reviewed: false,
          exported: false
        });
      }

      return {
        submissionId: submissionToken,
        totalScore: 0,
        maxScore: question.testCases.reduce((sum, c) => sum + c.points, 0),
        passedTests: 0,
        totalTests: question.testCases.length,
        overallStatus: 'Compilation Error',
        testResults: question.testCases.map(c => ({
          testCaseId: c.id,
          passed: false,
          points: 0,
          maxPoints: c.points,
          error: 'Compilation Error',
          isHidden: !!c.isHidden
        }))
      };
    }

    const actual = normalizeOutput(execRes.stdout || '');
    const expected = normalizeOutput(tc.expectedOutput);
    const passed = (execRes.status.id === 3) && (actual === expected);

    if (passed) {
      totalScore += tc.points;
      passedCount++;
    } else if (execRes.status.id === 5) {
      hasTimeLimit = true;
    } else if (execRes.status.id !== 3) {
      hasRuntimeError = true;
    }

    testResults.push({
      testCaseId: tc.id,
      passed,
      actualOutput: actual,
      expectedOutput: expected,
      executionTime: parseFloat(execRes.time || '0'),
      points: passed ? tc.points : 0,
      maxPoints: tc.points,
      error: execRes.status.id !== 3 ? (execRes.stderr || 'Execution failed') : undefined
    });
  }

  // Determine overall status
  let overallStatus: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error' = 'Accepted';
  if (passedCount === question.testCases.length) {
    overallStatus = 'Accepted';
  } else if (hasTimeLimit) {
    overallStatus = 'Time Limit Exceeded';
  } else if (hasRuntimeError) {
    overallStatus = 'Runtime Error';
  } else {
    overallStatus = 'Wrong Answer';
  }

  // 3. Persist official submission in DB
  const submission: AuthoritativeSubmission = {
    id: submissionToken,
    assignmentId,
    questionId,
    learnerId,
    code: sourceCode,
    languageId,
    status: overallStatus,
    score: totalScore,
    submittedAt: new Date().toISOString(),
    testResults
  };
  db.createSubmission(submission);

  // 4. Update AssignmentLearner state locally
  // NOTICE: Does NOT call Brightspace grade passback!
  const al = db.getAssignmentLearner(assignmentId, learnerId);
  if (al) {
    db.updateAssignmentLearner(al.id, {
      status: 'SUBMITTED',
      score: totalScore,
      reviewed: false,
      exported: false
    });
  }

  // 5. Return sanitized result for learner (hide hidden test case details)
  return {
    submissionId: submissionToken,
    totalScore,
    maxScore,
    passedTests: passedCount,
    totalTests: question.testCases.length,
    overallStatus,
    testResults: testResults.map(tr => {
      const tc = question.testCases.find(c => c.id === tr.testCaseId);
      const isHidden = !!tc?.isHidden;

      return {
        testCaseId: tr.testCaseId,
        passed: tr.passed,
        points: tr.points,
        maxPoints: tr.maxPoints,
        executionTime: tr.executionTime,
        error: isHidden ? undefined : tr.error,
        actualOutput: isHidden ? undefined : tr.actualOutput,
        expectedOutput: isHidden ? undefined : tr.expectedOutput,
        isHidden
      };
    })
  };
}

