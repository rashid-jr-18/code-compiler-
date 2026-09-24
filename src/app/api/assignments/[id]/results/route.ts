import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assignmentId } = await params;
  // Faculty or Admin only
  const auth = requireRole(request, ['FACULTY', 'ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const assignment = db.getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const learners = db.getAssignmentLearners(assignmentId);

  // Attach latest submission data for each learner
  const results = learners.map(al => {
    const submissions = db.getSubmissionsByAssignmentAndLearner(assignmentId, al.learnerId);
    const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;

    return {
      ...al,
      latestSubmission
    };
  });

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      title: assignment.title,
      maxPoints: assignment.maxPoints,
      courseId: assignment.courseId,
      lineItemUrl: assignment.lineItemUrl
    },
    results
  });
}

// Action to toggle reviewed status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assignmentId } = await params;
  const auth = requireRole(request, ['FACULTY', 'ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { assignmentLearnerId, reviewed } = body;

    if (!assignmentLearnerId) {
      return NextResponse.json({ error: 'assignmentLearnerId is required' }, { status: 400 });
    }

    const updated = db.updateAssignmentLearner(assignmentLearnerId, {
      reviewed: Boolean(reviewed),
      reviewedAt: reviewed ? new Date().toISOString() : undefined,
      reviewedBy: reviewed ? auth.user.id : undefined,
      status: reviewed ? 'REVIEWED' : 'SUBMITTED'
    });

    if (!updated) {
      return NextResponse.json({ error: 'Assignment learner record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Result ${reviewed ? 'marked as reviewed' : 'unmarked'}`,
      record: updated
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
  }
}

