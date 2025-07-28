import { NextRequest, NextResponse } from 'next/server';
import { Judge0Api, judge0Config } from '@/lib/judge0';

export async function POST(request: NextRequest) {
  try {
    const { source_code, language_id, stdin } = await request.json();

    const judge0 = new Judge0Api(judge0Config);
    const result = await judge0.submit(source_code, language_id, stdin);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting code:', error);
    return NextResponse.json(
      { error: 'Failed to submit code' },
      { status: 500 }
    );
  }
}
