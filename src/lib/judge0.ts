import axios from 'axios';
import { ExecutionResult, SubmissionResponse, Judge0Config } from '@/types';

export class Judge0Api {
  private config: Judge0Config;

  constructor(config: Judge0Config) {
    this.config = config;
  }

  async submit(
    source_code: string,
    language_id: number,
    stdin: string = ''
  ): Promise<SubmissionResponse> {
    const response = await axios.post(
      `${this.config.apiUrl}/submissions`,
      {
        source_code,
        language_id,
        stdin,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.config.rapidApiKey,
          'X-RapidAPI-Host': this.config.rapidApiHost,
        },
      }
    );
    return response.data;
  }

  async getSubmission(token: string): Promise<ExecutionResult> {
    const response = await axios.get(
      `${this.config.apiUrl}/submissions/${token}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.config.rapidApiKey,
          'X-RapidAPI-Host': this.config.rapidApiHost,
        },
      }
    );
    return response.data;
  }
}

export const judge0Config: Judge0Config = {
  apiUrl: 'http://localhost:2358', // Adjust based on your Judge0 local setup
};
