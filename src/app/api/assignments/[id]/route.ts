import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, sanitizeQuestionForLearner } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const assignment = db.getAssignmentById(id);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const { user } = auth;

  // Learner access verification
  if (user.role === 'LEARNER') {
    const isAssigned = assignment.learners?.some(al => al.learnerId === user.id);
    if (!isAssigned) {
      return NextResponse.json({ error: 'Forbidden: You are not assigned to this assessment' }, { status: 403 });
    }

    // Sanitize questions so hidden test cases are never exposed
    const sanitizedQuestions = assignment.questions.map(aq => ({
      ...aq,
      question: aq.question ? sanitizeQuestionForLearner(aq.question) : undefined
    }));

    const myRecord = assignment.learners?.find(al => al.learnerId === user.id);

    return NextResponse.json({
      ...assignment,
      questions: sanitizedQuestions,
      learners: myRecord ? [myRecord] : []
    });
  }

  // Faculty and Admin can view full assignment with all test cases and learner progress
  return NextResponse.json(assignment);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Faculty or Admin role required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, instructions, maxPoints, startDate, dueDate, status } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (instructions !== undefined) updates.instructions = instructions.trim();
    if (maxPoints !== undefined) updates.maxPoints = Number(maxPoints);
    if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate).toISOString() : undefined;
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate).toISOString();
    if (status !== undefined) updates.status = status;

    const updated = db.updateAssignment(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Faculty or Admin role required' }, { status: 403 });
  }

  const success = db.deleteAssignment(id);
  if (!success) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
}


