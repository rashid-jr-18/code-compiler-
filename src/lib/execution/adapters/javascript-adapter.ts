import {
  LanguageAdapter,
  HarnessOptions,
  GeneratedHarness,
  ParsedHarnessResult,
  TestCaseInput
} from './types';
import { FunctionParameter } from '@/types';

export class JavaScriptAdapter implements LanguageAdapter {
  languageId = 63;
  languageName = 'JavaScript (Node.js)';
  extension = 'js';

  generateStarterCode(
    functionName: string,
    parameters: (string | FunctionParameter)[],
    returnType: string
  ): string {
    const paramNames = parameters
      .map(p => (typeof p === 'string' ? p.trim() : p.name.trim()))
      .join(', ');

    return `/**
 * @return {${returnType || 'any'}}
 */
function ${functionName}(${paramNames}) {
    // Write your logic here
}
`;
  }

  generateHarness(options: HarnessOptions): GeneratedHarness {
    const { functionName, returnType, studentCode, testCases } = options;

    const studentCodeB64 = Buffer.from(studentCode, 'utf-8').toString('base64');
    const testCasesB64 = Buffer.from(JSON.stringify(testCases), 'utf-8').toString('base64');

    const harnessScript = `const vm = require('vm');

const STUDENT_CODE_B64 = "${studentCodeB64}";
const TEST_CASES_B64 = "${testCasesB64}";
const FUNCTION_NAME = ${JSON.stringify(functionName)};
const RETURN_TYPE = ${JSON.stringify(returnType || 'any')};

const DELIMITER_START = "__EVAL_START__";
const DELIMITER_END = "__EVAL_END__";

function outputResult(payload) {
    process.stdout.write("\\n" + DELIMITER_START + "\\n");
    process.stdout.write(JSON.stringify(payload));
    process.stdout.write("\\n" + DELIMITER_END + "\\n");
}

function runEvaluation() {
    let studentCode, testCases;
    try {
        studentCode = Buffer.from(STUDENT_CODE_B64, 'base64').toString('utf8');
        testCases = JSON.parse(Buffer.from(TEST_CASES_B64, 'base64').toString('utf8'));
    } catch (err) {
        outputResult({
            hasCompileError: true,
            compileError: "Failed to decode input data: " + err.message,
            cases: []
        });
        return;
    }

    const sandbox = {
        console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite
    };

    const context = vm.createContext(sandbox);

    try {
        const script = new vm.Script(studentCode);
        script.runInContext(context);
    } catch (err) {
        outputResult({
            hasCompileError: true,
            compileError: "Syntax/Initialization Error: " + err.message,
            cases: []
        });
        return;
    }

    const targetFunc = sandbox[FUNCTION_NAME];
    if (typeof targetFunc !== 'function') {
        outputResult({
            hasCompileError: true,
            compileError: "Required function '" + FUNCTION_NAME + "' was not found.\\nPlease implement the expected function.",
            cases: []
        });
        return;
    }

    const caseResults = [];

    for (const tc of testCases) {
        const tcId = tc.id || 'case';
        let args = tc.input;
        if (!Array.isArray(args)) {
            if (typeof args === 'string') {
                try {
                    const parsed = JSON.parse(args);
                    args = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    args = [args];
                }
            } else {
                args = [args];
            }
        }

        // Deep clone arguments to avoid mutation between test cases
        const clonedArgs = JSON.parse(JSON.stringify(args));
        const startTime = process.hrtime.bigint();
        let resultVal = null;
        let callError = null;

        try {
            resultVal = targetFunc(...clonedArgs);
        } catch (err) {
            callError = (err.name || 'Error') + ": " + err.message;
        }

        const endTime = process.hrtime.bigint();
        const elapsedSec = Number(endTime - startTime) / 1e9;

        if (callError) {
            caseResults.push({
                testCaseId: tcId,
                status: "ERROR",
                actualOutput: null,
                actualType: "error",
                executionTime: parseFloat(elapsedSec.toFixed(4)),
                error: callError
            });
        } else {
            caseResults.push({
                testCaseId: tcId,
                status: "SUCCESS",
                actualOutput: resultVal === undefined ? null : resultVal,
                actualType: typeof resultVal,
                executionTime: parseFloat(elapsedSec.toFixed(4)),
                error: null
            });
        }
    }

    outputResult({
        hasCompileError: false,
        cases: caseResults
    });
}

runEvaluation();
`;

    return {
      code: harnessScript,
      filename: 'Main.js'
    };
  }

  parseHarnessOutput(
    rawStdout: string,
    rawStderr: string,
    testCases: TestCaseInput[]
  ): ParsedHarnessResult {
    const stdout = rawStdout || '';
    const stderr = rawStderr || '';

    const startIdx = stdout.indexOf('__EVAL_START__');
    const endIdx = stdout.indexOf('__EVAL_END__');

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = stdout.substring(startIdx + '__EVAL_START__'.length, endIdx).trim();
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.hasCompileError) {
          return {
            hasCompileError: true,
            compileError: parsed.compileError || 'Compilation Error',
            hasRuntimeError: false,
            cases: []
          };
        }

        const cases = Array.isArray(parsed.cases) ? parsed.cases : [];
        return {
          hasCompileError: false,
          hasRuntimeError: cases.some((c: any) => c.status === 'ERROR'),
          cases: cases.map((c: any) => ({
            testCaseId: c.testCaseId,
            actualOutput: c.actualOutput,
            actualType: c.actualType,
            status: c.status,
            executionTime: c.executionTime || 0,
            error: c.error,
            stdout: c.stdout
          }))
        };
      } catch (e) {
        // Fall through
      }
    }

    const err = stderr || stdout || 'Execution produced no output.';
    return {
      hasCompileError: false,
      hasRuntimeError: true,
      runtimeError: err,
      cases: testCases.map(tc => ({
        testCaseId: tc.id,
        actualOutput: null,
        actualType: 'error',
        status: 'ERROR',
        executionTime: 0,
        error: err
      }))
    };
  }
}
