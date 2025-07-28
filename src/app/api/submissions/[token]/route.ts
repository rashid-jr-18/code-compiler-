import { NextRequest, NextResponse } from 'next/server';
import { Judge0Api, judge0Config } from '@/lib/judge0';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const judge0 = new Judge0Api(judge0Config);
    const result = await judge0.getSubmission(token);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting submission:', error);
    return NextResponse.json(
      { error: 'Failed to get submission' },
      { status: 500 }
    );
  }
}
