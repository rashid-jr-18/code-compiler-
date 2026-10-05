import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const containerId = request.nextUrl.searchParams.get('containerId');
  const courseId = request.nextUrl.searchParams.get('courseId');

  if (!containerId && !courseId) {
    return NextResponse.json({ error: 'Either containerId or courseId query parameter is required' }, { status: 400 });
  }

  const { user } = auth;
  const assignments = containerId
    ? db.getAssignmentsByContainer(containerId)
    : db.getAssignmentsByCourse(courseId!);

  // If user is Admin or Faculty for this course, return all assignments with learner counts
  if (user.role === 'ADMIN' || user.role === 'FACULTY') {
    return NextResponse.json(assignments);
  }

  // If user is a Learner, return only assignments assigned to them, with their personal score status
  const learnerAssignments = assignments
    .filter(a => a.learners?.some(al => al.learnerId === user.id))
    .map(a => {
      const myRecord = a.learners?.find(al => al.learnerId === user.id);
      return {
        ...a,
        myStatus: myRecord?.status || 'ASSIGNED',
        myScore: myRecord?.score || 0,
        myReviewed: myRecord?.reviewed || false,
        // Strip other learners from payload
        learners: myRecord ? [myRecord] : []
      };
    });

  return NextResponse.json(learnerAssignments);
}

export async function POST(request: NextRequest) {
  // Only Faculty or Admin can create assignments
  const auth = requireRole(request, ['FACULTY', 'ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      containerId,
      courseId,
      title,
      instructions,
      maxPoints,
      startDate,
      dueDate,
      questions,
      learnerIds,
      proctoringConfig
    } = body;

    if (!courseId || !title?.trim() || !instructions?.trim() || !dueDate) {
      return NextResponse.json({ error: 'Missing required assignment fields' }, { status: 400 });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'At least one problem must be selected' }, { status: 400 });
    }

    // Resolve enrolled learners in the course
    const courseMembers = db.getCourseMembers(courseId);
    const enrolledCourseLearners = courseMembers
      .filter(cm => cm.role === 'LEARNER')
      .map(cm => cm.userId);

    let validLearners: string[] = [];
    if (learnerIds && Array.isArray(learnerIds) && learnerIds.length > 0) {
      validLearners = learnerIds.filter(lid => enrolledCourseLearners.includes(lid));
    } else {
      // Automatically assign all learners enrolled in the course
      validLearners = enrolledCourseLearners;
    }

    if (validLearners.length === 0) {
      // If no learners currently enrolled, default to demo learners or allow assignment creation
      validLearners = ['usr_student_alice', 'usr_student_bob', 'usr_student_charlie'];
    }

    const assignment = db.createAssignment(
      {
        containerId: containerId?.trim() || undefined,
        courseId,
        title: title.trim(),
        instructions: instructions.trim(),
        maxPoints: Number(maxPoints) || 100,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        dueDate: new Date(dueDate).toISOString(),
        createdBy: auth.user.id,
        status: 'PUBLISHED',
        proctoringConfig: proctoringConfig || undefined,
        questions: questions.map((q: { questionId: string; points: number; allowedLanguages?: number[] }, idx: number) => ({
          id: '',
          assignmentId: '',
          questionId: q.questionId,
          points: Number(q.points) || 10,
          order: idx + 1,
          allowedLanguages: Array.isArray(q.allowedLanguages) && q.allowedLanguages.length > 0 ? q.allowedLanguages : undefined
        }))
      },
      validLearners
    );

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

