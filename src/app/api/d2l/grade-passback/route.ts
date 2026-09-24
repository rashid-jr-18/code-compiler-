import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { postGradeToBrightspace } from '@/lib/brightspace';

export async function POST(request: NextRequest) {
  // CRITICAL: Only Faculty or Admin can export grades to Brightspace Gradebook!
  const auth = requireRole(request, ['FACULTY', 'ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { assignmentLearnerId, assignmentLearnerIds } = body;

    const idsToProcess: string[] = assignmentLearnerIds || (assignmentLearnerId ? [assignmentLearnerId] : []);

    if (idsToProcess.length === 0) {
      return NextResponse.json({
        error: 'assignmentLearnerId or assignmentLearnerIds array is required'
      }, { status: 400 });
    }

    const results = [];

    for (const id of idsToProcess) {
      // Find assignment learner record
      const al = Array.from(db.assignmentLearners.values()).find(item => item.id === id);
      if (!al) {
        results.push({ id, success: false, error: 'Record not found' });
        continue;
      }

      // Check review status
      if (!al.reviewed) {
        results.push({
          id,
          success: false,
          error: 'Result must be reviewed and approved by faculty before exporting to Brightspace'
        });
        continue;
      }

      const assignment = db.getAssignmentById(al.assignmentId);
      if (!assignment) {
        results.push({ id, success: false, error: 'Assignment not found' });
        continue;
      }

      const learner = db.getUserById(al.learnerId);
      const brightspaceUserId = learner?.ltiSubject || learner?.email || al.learnerId;

      try {
        // Send grade to Brightspace AGS
        const exportRes = await postGradeToBrightspace({
          lineItemUrl: assignment.lineItemUrl,
          userId: brightspaceUserId,
          scoreGiven: al.score,
          scoreMaximum: assignment.maxPoints,
          comment: `Graded on EduTech Compiler (${al.score}/${assignment.maxPoints}) - Reviewed by ${auth.user.name}`
        });

        if (exportRes.success) {
          db.updateAssignmentLearner(al.id, {
            exported: true,
            exportedAt: exportRes.timestamp,
            exportedBy: auth.user.id,
            passbackStatus: 'SUCCESS',
            passbackError: undefined,
            status: 'EXPORTED'
          });

          results.push({
            id,
            success: true,
            gradeId: exportRes.gradeId,
            message: `Successfully exported grade (${al.score}/${assignment.maxPoints}) to Brightspace`
          });
        } else {
          db.updateAssignmentLearner(al.id, {
            passbackStatus: 'FAILED',
            passbackError: exportRes.error || 'AGS error'
          });

          results.push({
            id,
            success: false,
            error: exportRes.error || 'Failed to export grade to Brightspace'
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        db.updateAssignmentLearner(al.id, {
          passbackStatus: 'FAILED',
          passbackError: errMsg
        });

        results.push({ id, success: false, error: errMsg });
      }
    }

    const allSuccessful = results.every(r => r.success);
    return NextResponse.json({
      success: allSuccessful,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Grade passback endpoint error:', error);
    return NextResponse.json({
      error: 'Failed to process grade passback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-role',
    },
  });
}
