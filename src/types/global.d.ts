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

declare global {
  var submissionsMap: Map<string, ExecutionResult> | undefined;
}

declare module 'canvas-confetti';
declare module 'particles.js';

export {};
