import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { gradeSubmission } from '@/lib/grading';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assignmentId } = await params;
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;

  try {
    const body = await request.json();
    const { questionId, sourceCode, languageId } = body;

    if (!questionId || !sourceCode || !languageId) {
      return NextResponse.json({
        error: 'questionId, sourceCode, and languageId are required'
      }, { status: 400 });
    }

    const assignment = db.getAssignmentById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Ensure learner is tracked on this assignment
    db.ensureAssignmentLearner(assignmentId, user.id);

    // Check assignment due date
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    if (now > dueDate) {
      return NextResponse.json({ error: 'Assessment is closed: Due date has passed' }, { status: 400 });
    }

    // Perform authoritative server-side evaluation against all test cases
    const gradingResult = await gradeSubmission(
      assignmentId,
      questionId,
      user.id,
      sourceCode,
      Number(languageId)
    );

    // Update proctoring session to COMPLETED if active
    const session = db.getProctoringSession(assignmentId, user.id);
    if (session && session.status === 'IN_PROGRESS') {
      db.updateProctoringSessionStatus(session.id, 'COMPLETED');
    }

    // CRITICAL REQUIREMENT ENFORCEMENT:
    // Notice: We do NOT call Brightspace AGS grade passback here!
    // The score is stored locally. Only Faculty can review and export the grade.

    return NextResponse.json({
      success: true,
      message: 'Submission evaluated and recorded locally. Grade pending faculty review.',
      result: gradingResult
    }, { status: 201 });

  } catch (error) {
    console.error('Authoritative submit error:', error);
    return NextResponse.json({
      error: 'Failed to process submission',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

