import { ExecutionResult, SubmissionResponse } from '@/types';

export class Judge0ProxyClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/judge0') {
    this.baseUrl = baseUrl;
  }

  /**
   * Submit code for execution
   */
  async submit(
    source_code: string,
    language_id: number,
    stdin: string = '',
    additionalParams: Record<string, any> = {}
  ): Promise<SubmissionResponse> {
    const response = await fetch(`${this.baseUrl}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin,
        ...additionalParams,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get submission result by token
   */
  async getSubmission(token: string): Promise<ExecutionResult> {
    const response = await fetch(`${this.baseUrl}/submissions/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Poll for submission result until it's completed
   */
  async pollSubmission(
    token: string,
    maxAttempts: number = 30,
    interval: number = 1000
  ): Promise<ExecutionResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getSubmission(token);
      
      // Status ID meanings:
      // 1: In Queue, 2: Processing, 3: Accepted, 4: Wrong Answer, 5: Time Limit Exceeded,
      // 6: Compilation Error, 7: Runtime Error (SIGSEGV), 8: Runtime Error (SIGXFSZ),
      // 9: Runtime Error (SIGFPE), 10: Runtime Error (SIGABRT), 11: Runtime Error (NZEC),
      // 12: Runtime Error (Other), 13: Internal Error, 14: Exec Format Error
      
      if (result.status.id > 2) {
        return result;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Polling timeout after ${maxAttempts} attempts`);
  }

  /**
   * Submit and wait for result (convenience method)
   */
  async submitAndWait(
    source_code: string,
    language_id: number,
    stdin: string = '',
    additionalParams: Record<string, any> = {}
  ): Promise<ExecutionResult> {
    const submission = await this.submit(source_code, language_id, stdin, additionalParams);
    return this.pollSubmission(submission.token);
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/system_info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get languages
   */
  async getLanguages(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/languages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// Default instance
export const judge0Proxy = new Judge0ProxyClient();
