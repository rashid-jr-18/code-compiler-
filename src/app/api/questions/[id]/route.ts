import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, sanitizeQuestionForLearner } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const question = db.getQuestionById(id);

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const auth = requireAuth(request);
  if (auth && !(auth instanceof NextResponse) && auth.user.role === 'LEARNER') {
    return NextResponse.json(sanitizeQuestionForLearner(question));
  }

  return NextResponse.json(question);
}

