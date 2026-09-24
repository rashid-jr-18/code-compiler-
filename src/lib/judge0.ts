// Deprecated: Judge0 has been completely removed from the application pipeline.
// All executions are powered by the Piston engine (see @/lib/piston).
import { executeWithPiston } from '@/lib/piston';

export class Judge0Api {
  async submit(source_code: string, language_id: number, stdin: string = '') {
    return executeWithPiston(source_code, language_id, stdin);
  }

  async getSubmission() {
    return { message: 'Judge0 has been replaced by Piston.' };
  }
}

export const judge0Config = {
  apiUrl: '',
};
