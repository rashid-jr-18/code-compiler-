import { NextRequest, NextResponse } from 'next/server';
import { getSubmission } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = getSubmission(token);

    if (!result) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting submission:', error);
    return NextResponse.json(
      { error: 'Failed to get submission' },
      { status: 500 }
    );
  }
}
