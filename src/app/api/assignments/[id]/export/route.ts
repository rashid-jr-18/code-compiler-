import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assignmentId } = await params;
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Strict role check: Only Faculty and Admin can export assessment results
  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Faculty or Admin role required to export results' }, { status: 403 });
  }

  const assignment = db.getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const learners = db.getAssignmentLearners(assignmentId);

  // Build CSV rows
  const headers = [
    'Learner ID',
    'Full Name',
    'Email',
    'Status',
    'Score',
    'Max Points',
    'Percentage (%)',
    'Faculty Reviewed',
    'Exported To Brightspace',
    'Passback Status',
    'Submitted At'
  ];

  const rows = learners.map(al => {
    const user = al.learner || db.getUserById(al.learnerId);
    const score = Number(al.score) || 0;
    const maxPoints = Number(assignment.maxPoints) || 100;
    const percentage = maxPoints > 0 ? ((score / maxPoints) * 100).toFixed(1) : '0.0';

    // Get latest submission timestamp if available
    const submissions = db.getSubmissionsByAssignmentAndLearner(assignmentId, al.learnerId);
    const latestSub = submissions.length > 0 ? submissions[submissions.length - 1] : null;
    const submittedAt = latestSub ? latestSub.submittedAt : (al.status !== 'ASSIGNED' ? al.createdAt : '');

    const escapeCsv = (val: unknown) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    return [
      escapeCsv(al.learnerId),
      escapeCsv(user?.name || 'Unknown Learner'),
      escapeCsv(user?.email || ''),
      escapeCsv(al.status),
      score,
      maxPoints,
      percentage,
      al.reviewed ? 'Yes' : 'No',
      al.exported ? 'Yes' : 'No',
      escapeCsv(al.passbackStatus || (al.exported ? 'SUCCESS' : 'NOT_EXPORTED')),
      escapeCsv(submittedAt)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const safeFilename = assignment.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="assessment_${safeFilename}_results.csv"`,
      'Cache-Control': 'no-cache'
    }
  });
}

