import {
  LanguageAdapter,
  HarnessOptions,
  GeneratedHarness,
  ParsedHarnessResult,
  TestCaseInput
} from './types';
import { FunctionParameter } from '@/types';

export class PythonAdapter implements LanguageAdapter {
  languageId = 71;
  languageName = 'Python 3';
  extension = 'py';

  generateStarterCode(
    functionName: string,
    parameters: (string | FunctionParameter)[],
    returnType: string
  ): string {
    const paramNames = parameters
      .map(p => (typeof p === 'string' ? p.trim() : p.name.trim()))
      .join(', ');

    return `def ${functionName}(${paramNames}):
    # Write your logic here
    pass
`;
  }

  generateHarness(options: HarnessOptions): GeneratedHarness {
    const { functionName, returnType, studentCode, testCases } = options;

    // Encode student code and test case data in base64 to avoid string escaping issues
    const studentCodeB64 = Buffer.from(studentCode, 'utf-8').toString('base64');
    const testCasesB64 = Buffer.from(JSON.stringify(testCases), 'utf-8').toString('base64');

    const harnessPythonScript = `import sys
import json
import ast
import base64
import time
import copy
import io
import builtins
import traceback

STUDENT_CODE_B64 = "${studentCodeB64}"
TEST_CASES_B64 = "${testCasesB64}"
FUNCTION_NAME = ${JSON.stringify(functionName)}
RETURN_TYPE = ${JSON.stringify(returnType || 'any')}

DELIMITER_START = "__EVAL_START__"
DELIMITER_END = "__EVAL_END__"

def output_result(payload):
    sys.stdout.write("\\n" + DELIMITER_START + "\\n")
    sys.stdout.write(json.dumps(payload))
    sys.stdout.write("\\n" + DELIMITER_END + "\\n")
    sys.stdout.flush()

class TypeAwareJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (set, frozenset)):
            return list(obj)
        if isinstance(obj, tuple):
            return list(obj)
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return str(obj)

def run_evaluation():
    try:
        student_code = base64.b64decode(STUDENT_CODE_B64).decode('utf-8')
    except Exception as e:
        output_result({
            "hasCompileError": True,
            "compileError": f"Failed to decode submission: {str(e)}",
            "cases": []
        })
        return

    try:
        test_cases_json = base64.b64decode(TEST_CASES_B64).decode('utf-8')
        test_cases = json.loads(test_cases_json)
    except Exception as e:
        output_result({
            "hasCompileError": True,
            "compileError": f"Failed to parse test cases: {str(e)}",
            "cases": []
        })
        return

    # 1. AST Validation & Syntax Inspection
    try:
        parsed_ast = ast.parse(student_code)
    except SyntaxError as se:
        line_num = getattr(se, 'lineno', '?')
        offset = getattr(se, 'offset', '?')
        text_preview = (getattr(se, 'text', '') or '').strip()
        syntax_err_msg = f"SyntaxError at line {line_num}: {se.msg}\\n  {text_preview}"
        output_result({
            "hasCompileError": True,
            "compileError": syntax_err_msg,
            "cases": []
        })
        return

    # 2. Function Signature & Existence Validation
    found_function = False
    is_method = False
    class_name = None

    for node in parsed_ast.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == FUNCTION_NAME:
            found_function = True
            break
        elif isinstance(node, ast.ClassDef):
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name == FUNCTION_NAME:
                    found_function = True
                    is_method = True
                    class_name = node.name
                    break
            if found_function:
                break

    if not found_function:
        output_result({
            "hasCompileError": True,
            "compileError": f"Required function '{FUNCTION_NAME}' was not found.\\nPlease implement the expected function.",
            "cases": []
        })
        return

    # 3. Safe Execution of Student Code in Isolated Namespace
    # Prevent top-level input() calls from freezing execution
    original_input = builtins.input
    builtins.input = lambda *args: ""

    exec_globals = {
        "__name__": "__main__",
        "__builtins__": __builtins__,
        "math": __import__("math"),
        "collections": __import__("collections"),
        "itertools": __import__("itertools"),
        "re": __import__("re"),
        "heapq": __import__("heapq"),
        "bisect": __import__("bisect")
    }

    try:
        exec(student_code, exec_globals)
    except Exception as e:
        builtins.input = original_input
        tb = traceback.format_exc()
        clean_lines = [l for l in tb.splitlines() if 'exec(student_code' not in l and '<string>' not in l]
        error_msg = f"Runtime Error during code initialization: {type(e).__name__}: {str(e)}\\n" + "\\n".join(clean_lines[-4:])
        output_result({
            "hasCompileError": True,
            "compileError": error_msg.strip(),
            "cases": []
        })
        return
    finally:
        builtins.input = original_input

    # Locate the target function or method
    target_func = None
    if FUNCTION_NAME in exec_globals and callable(exec_globals[FUNCTION_NAME]):
        target_func = exec_globals[FUNCTION_NAME]
    elif is_method and class_name and class_name in exec_globals:
        try:
            cls = exec_globals[class_name]
            instance = cls()
            if hasattr(instance, FUNCTION_NAME):
                target_func = getattr(instance, FUNCTION_NAME)
        except Exception:
            pass

    if target_func is None or not callable(target_func):
        output_result({
            "hasCompileError": True,
            "compileError": f"Required function '{FUNCTION_NAME}' was not found.\\nPlease implement the expected function.",
            "cases": []
        })
        return

    # 4. Independent Test Case Execution with Deep Copy and Output Redirection
    case_results = []
    real_stdout = sys.stdout
    real_stderr = sys.stderr

    for tc in test_cases:
        tc_id = tc.get("id", "case")
        raw_input = tc.get("input", [])

        # Normalize raw_input into list of arguments
        if isinstance(raw_input, list):
            args = copy.deepcopy(raw_input)
        elif isinstance(raw_input, str):
            try:
                parsed = json.loads(raw_input)
                args = copy.deepcopy(parsed) if isinstance(parsed, list) else [parsed]
            except Exception:
                args = [raw_input]
        else:
            args = [copy.deepcopy(raw_input)]

        # Redirect stdout and stderr during test execution to prevent debug print collision
        captured_out = io.StringIO()
        captured_err = io.StringIO()
        sys.stdout = captured_out
        sys.stderr = captured_err

        t0 = time.perf_counter()
        call_error = None
        result_value = None
        result_type = None

        try:
            result_value = target_func(*args)
            result_type = type(result_value).__name__
        except Exception as e:
            tb = traceback.format_exc()
            clean_lines = [l.strip() for l in tb.splitlines() if 'target_func(*args)' not in l]
            call_error = f"{type(e).__name__}: {str(e)}"
            if len(clean_lines) > 1:
                call_error += f" ({clean_lines[-2]})" if clean_lines[-2] != clean_lines[-1] else ""
        finally:
            elapsed = time.perf_counter() - t0
            sys.stdout = real_stdout
            sys.stderr = real_stderr

        stdout_text = captured_out.getvalue().strip()

        if call_error is not None:
            case_results.append({
                "testCaseId": tc_id,
                "status": "ERROR",
                "actualOutput": None,
                "actualType": "error",
                "executionTime": round(elapsed, 4),
                "error": call_error,
                "stdout": stdout_text if stdout_text else None
            })
        else:
            # Serialize result with JSON encoder
            # Notice: Valid False is preserved as JSON boolean false (never mistaken for None)
            try:
                serialized = json.loads(json.dumps(result_value, cls=TypeAwareJsonEncoder))
            except Exception:
                serialized = str(result_value)

            case_results.append({
                "testCaseId": tc_id,
                "status": "SUCCESS",
                "actualOutput": serialized,
                "actualType": result_type,
                "executionTime": round(elapsed, 4),
                "error": None,
                "stdout": stdout_text if stdout_text else None
            })

    output_result({
        "hasCompileError": False,
        "cases": case_results
    })

if __name__ == "__main__":
    run_evaluation()
`;

    return {
      code: harnessPythonScript,
      filename: 'Main.py'
    };
  }

  parseHarnessOutput(
    rawStdout: string,
    rawStderr: string,
    testCases: TestCaseInput[]
  ): ParsedHarnessResult {
    const stdout = rawStdout || '';
    const stderr = rawStderr || '';

    // Check for delimiter block
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
        // Fall through to error extraction
      }
    }

    // If delimiter was not found, check if Python printed a SyntaxError or compiler traceback
    if (stderr.includes('SyntaxError') || stdout.includes('SyntaxError')) {
      const syntaxError = (stderr || stdout).trim();
      return {
        hasCompileError: true,
        compileError: syntaxError,
        hasRuntimeError: false,
        cases: []
      };
    }

    if (stderr.includes('IndentationError') || stdout.includes('IndentationError')) {
      return {
        hasCompileError: true,
        compileError: (stderr || stdout).trim(),
        hasRuntimeError: false,
        cases: []
      };
    }

    // Default runtime failure / process crash
    const errorOutput = stderr || stdout || 'Execution produced no output.';
    return {
      hasCompileError: false,
      hasRuntimeError: true,
      runtimeError: errorOutput,
      cases: testCases.map(tc => ({
        testCaseId: tc.id,
        actualOutput: null,
        actualType: 'error',
        status: 'ERROR',
        executionTime: 0,
        error: errorOutput
      }))
    };
  }
}
