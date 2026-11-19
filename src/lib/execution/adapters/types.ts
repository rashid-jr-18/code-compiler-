import { FunctionParameter } from '@/types';

export interface TestCaseInput {
  id: string;
  input: any; // Array of arguments, or single value, or JSON string
  expectedOutput: any;
  points?: number;
  description?: string;
  isHidden?: boolean;
}

export interface HarnessOptions {
  functionName: string;
  parameters: (string | FunctionParameter)[];
  returnType: string;
  studentCode: string;
  testCases: TestCaseInput[];
  timeoutSeconds?: number;
}

export interface GeneratedHarness {
  code: string;
  filename: string;
}

export interface ParsedCaseOutput {
  testCaseId: string;
  actualOutput: any;
  actualType?: string;
  status: 'SUCCESS' | 'ERROR' | 'MISSING_FUNCTION';
  executionTime: number; // seconds
  error?: string;
  stdout?: string;
}

export interface ParsedHarnessResult {
  hasCompileError: boolean;
  compileError?: string;
  hasRuntimeError: boolean;
  runtimeError?: string;
  cases: ParsedCaseOutput[];
}

export interface LanguageAdapter {
  languageId: number;
  languageName: string;
  extension: string;
  generateStarterCode(
    functionName: string,
    parameters: (string | FunctionParameter)[],
    returnType: string
  ): string;
  generateHarness(options: HarnessOptions): GeneratedHarness;
  parseHarnessOutput(
    rawStdout: string,
    rawStderr: string,
    testCases: TestCaseInput[]
  ): ParsedHarnessResult;
}
