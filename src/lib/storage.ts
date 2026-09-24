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

// Global in-memory storage for submissions
// In production, this should be replaced with Redis or a database
// Use globalThis to persist across module reloads in development
if (!globalThis.submissionsMap) {
  globalThis.submissionsMap = new Map<string, ExecutionResult>();
}

export const submissions = globalThis.submissionsMap as Map<string, ExecutionResult>;

// Helper functions
export const storeSubmission = (token: string, result: ExecutionResult) => {
  submissions.set(token, result);
  console.log(`[${new Date().toISOString()}] Stored submission: ${token}`);
};

export const getSubmission = (token: string): ExecutionResult | undefined => {
  const result = submissions.get(token);
  console.log(`[${new Date().toISOString()}] Retrieved submission: ${token}, found: ${!!result}`);
  return result;
};

export const clearSubmission = (token: string) => {
  submissions.delete(token);
  console.log(`[${new Date().toISOString()}] Cleared submission: ${token}`);
};

export const getSubmissionCount = () => {
  return submissions.size;
};
