import axios from 'axios';
import { EXECUTION_LANGUAGES, getExecutionConfig } from '@/lib/execution-languages';
import {
  PistonExecuteRequest,
  PistonExecuteResponse,
  ExecutionResult
} from '@/types';

export const PISTON_DEFAULT_URL = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2';

// Map numeric language IDs or names to Piston language identifiers
export const LANGUAGE_ID_TO_PISTON: Record<number, { language: string; version: string; extension: string }> = {
  // Python
  71: { language: 'python', version: '3.10.0', extension: 'py' },
  70: { language: 'python', version: '2.7.18', extension: 'py' },
  10: { language: 'python', version: '3.10.0', extension: 'py' },

  // JavaScript & TypeScript
  63: { language: 'javascript', version: '18.15.0', extension: 'js' },
  74: { language: 'typescript', version: '5.0.3', extension: 'ts' },

  // Java
  62: { language: 'java', version: '15.0.2', extension: 'java' },
  4: { language: 'java', version: '15.0.2', extension: 'java' },

  // C++
  54: { language: 'c++', version: '10.2.0', extension: 'cpp' },
  53: { language: 'c++', version: '10.2.0', extension: 'cpp' },
  52: { language: 'c++', version: '10.2.0', extension: 'cpp' },
  76: { language: 'c++', version: '10.2.0', extension: 'cpp' },
  14: { language: 'c++', version: '10.2.0', extension: 'cpp' },
  2: { language: 'c++', version: '10.2.0', extension: 'cpp' },

  // C
  50: { language: 'c', version: '10.2.0', extension: 'c' },
  49: { language: 'c', version: '10.2.0', extension: 'c' },
  48: { language: 'c', version: '10.2.0', extension: 'c' },
  75: { language: 'c', version: '10.2.0', extension: 'c' },
  13: { language: 'c', version: '10.2.0', extension: 'c' },
  1: { language: 'c', version: '10.2.0', extension: 'c' },

  // C#
  51: { language: 'csharp', version: '6.12.0', extension: 'cs' },
  22: { language: 'csharp', version: '6.12.0', extension: 'cs' },
  21: { language: 'csharp', version: '6.12.0', extension: 'cs' },

  // Go, Rust, PHP, Ruby
  60: { language: 'go', version: '1.16.2', extension: 'go' },
  73: { language: 'rust', version: '1.68.2', extension: 'rs' },
  68: { language: 'php', version: '8.2.3', extension: 'php' },
  72: { language: 'ruby', version: '3.0.1', extension: 'rb' },

  // Scripting
  46: { language: 'bash', version: '5.2.0', extension: 'sh' },
  85: { language: 'perl', version: '5.36.0', extension: 'pl' },
  64: { language: 'lua', version: '5.4.4', extension: 'lua' },
  80: { language: 'r', version: '4.1.1', extension: 'r' },
  82: { language: 'sqlite3', version: '3.36.0', extension: 'sql' },

  // Others
  78: { language: 'kotlin', version: '1.8.20', extension: 'kt' },
  83: { language: 'swift', version: '5.3.3', extension: 'swift' },
  81: { language: 'scala', version: '3.2.2', extension: 'scala' },
  61: { language: 'haskell', version: '9.0.1', extension: 'hs' },
  57: { language: 'elixir', version: '1.11.3', extension: 'ex' },
  58: { language: 'erlang', version: '23.0', extension: 'erl' },
  86: { language: 'clojure', version: '1.10.3', extension: 'clj' },
  90: { language: 'dart', version: '2.19.6', extension: 'dart' },

  // Additional Compilers & Interpreters (58 languages total)
  87: { language: 'fsharp', version: '5.0.201', extension: 'fs' },
  24: { language: 'fsharp', version: '5.0.201', extension: 'fsx' },
  59: { language: 'fortran', version: '10.2.0', extension: 'f90' },
  67: { language: 'pascal', version: '3.2.2', extension: 'pas' },
  56: { language: 'd', version: '2.102.2', extension: 'd' },
  9: { language: 'nim', version: '1.6.12', extension: 'nim' },
  88: { language: 'groovy', version: '3.0.9', extension: 'groovy' },
  79: { language: 'objective-c', version: '10.2.0', extension: 'm' },
  84: { language: 'visual-basic.net', version: '0.0.0.5943', extension: 'vb' },
  20: { language: 'visual-basic.net', version: '0.0.0.5943', extension: 'vb' },
  89: { language: 'prolog', version: '1.4.5', extension: 'pro' },
  77: { language: 'cobol', version: '3.1.2', extension: 'cob' },
  55: { language: 'lisp', version: '2.1.2', extension: 'lisp' },
  45: { language: 'nasm', version: '2.15.5', extension: 'asm' },
  47: { language: 'basic', version: '1.08.1', extension: 'bas' },
  65: { language: 'ocaml', version: '4.12.0', extension: 'ml' },
  66: { language: 'octave', version: '6.2.0', extension: 'm' },
  11: { language: 'bosque', version: 'latest', extension: 'bsq' },
  100: { language: 'html', version: '*', extension: 'html' },
  69: { language: 'plaintext', version: 'latest', extension: 'txt' }
};

export interface UnifiedExecutionResult extends ExecutionResult {
  pistonResponse?: PistonExecuteResponse;
}

/**
 * Resolve language details from either language ID, language name, or extension
 */
export function resolveLanguage(langInput: number | string): { language: string; version: string; extension: string; languageId: number } {
  if (typeof langInput === 'number') {
    if (LANGUAGE_ID_TO_PISTON[langInput]) {
      return { ...LANGUAGE_ID_TO_PISTON[langInput], languageId: langInput };
    }
    const conf = getExecutionConfig(langInput);
    return {
      language: conf.extension === 'py' ? 'python' : conf.extension,
      version: '*',
      extension: conf.extension,
      languageId: langInput
    };
  }

  const normalized = langInput.toLowerCase().trim();
  for (const [id, val] of Object.entries(LANGUAGE_ID_TO_PISTON)) {
    if (val.language === normalized || val.extension === normalized || normalized.includes(val.language)) {
      return { ...val, languageId: Number(id) };
    }
  }

  return {
    language: normalized,
    version: '*',
    extension: normalized === 'python' ? 'py' : (normalized === 'javascript' ? 'js' : normalized),
    languageId: 71
  };
}

/**
 * Main execution function:
 * Strictly executes code via Piston API (default http://localhost:2000/api/v2/execute).
 * No code is ever executed locally on the host machine.
 */
export async function executeWithPiston(
  sourceCode: string,
  languageInput: number | string,
  stdin: string = '',
  customApiUrl?: string
): Promise<UnifiedExecutionResult> {
  const langInfo = resolveLanguage(languageInput);

  // Web / HTML execution is rendered live via the browser viewport
  if (langInfo.language === 'html' || langInfo.extension === 'html' || langInfo.languageId === 100) {
    return {
      stdout: 'Interactive HTML/CSS/JavaScript rendered in Live Web Preview.',
      stderr: null,
      compile_output: null,
      status: { id: 3, description: 'Accepted' },
      time: '0.001',
      memory: 0
    };
  }

  const apiUrl = customApiUrl || PISTON_DEFAULT_URL;

  try {
    const pistonPayload: PistonExecuteRequest = {
      language: langInfo.language,
      version: '*', // Using '*' allows Piston to auto-match whatever installed version exists in the container
      files: [
        {
          name: `Main.${langInfo.extension}`,
          content: sourceCode
        }
      ],
      stdin: stdin || ''
    };

    const startTime = Date.now();
    const response = await axios.post<PistonExecuteResponse>(
      `${apiUrl.replace(/\/$/, '')}/execute`,
      pistonPayload,
      {
        timeout: 25000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const data = response.data;
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(3);

    // Check compilation status
    if (data.compile && data.compile.code !== 0) {
      return {
        stdout: null,
        stderr: data.compile.stderr || data.compile.output,
        compile_output: data.compile.stderr || data.compile.output,
        status: { id: 6, description: 'Compilation Error' },
        time: executionTime,
        memory: 0,
        pistonResponse: data
      };
    }

    // Check runtime status
    const run = data.run;
    let statusId = 3;
    let statusDesc = 'Accepted';

    if (run.signal === 'SIGTERM' || run.signal === 'SIGKILL') {
      statusId = 5;
      statusDesc = 'Time Limit Exceeded';
    } else if (run.code !== 0) {
      statusId = 11;
      statusDesc = 'Runtime Error (NZEC)';
    }

    return {
      stdout: run.stdout || null,
      stderr: run.stderr || null,
      compile_output: data.compile?.output || null,
      status: { id: statusId, description: statusDesc },
      time: executionTime,
      memory: 0,
      pistonResponse: data
    };
  } catch (error: any) {
    const errorMsg = error?.code === 'ECONNREFUSED'
      ? `Piston engine is not reachable at ${apiUrl}. Please ensure the Piston container is running (sudo docker compose up -d).`
      : (error?.response?.data?.message || error?.message || 'Piston execution failed');

    console.error(`[Piston] Execution error:`, errorMsg);
    return {
      stdout: null,
      stderr: errorMsg,
      compile_output: errorMsg,
      status: { id: 13, description: 'Internal Error' },
      time: '0.000',
      memory: 0
    };
  }
}

