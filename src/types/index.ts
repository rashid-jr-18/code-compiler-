export interface Language {
  id: number;
  name: string;
  mime: string;
  extension: string;
  defaultCode: string;
}

export interface ExecutionResult {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  time?: string;
  memory?: number;
  status: {
    id: number;
    description: string;
  };
}

export interface SubmissionResponse {
  token: string;
}

export interface Judge0Config {
  apiUrl: string;
  rapidApiKey?: string;
  rapidApiHost?: string;
}
