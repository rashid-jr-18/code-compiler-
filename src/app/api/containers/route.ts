import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const courseId = searchParams.get('courseId');
  const resourceLinkId = searchParams.get('resourceLinkId');
  const dynamicName = searchParams.get('name') || searchParams.get('title') || 'Assessments';

  // If resourceLinkId is provided (e.g. from an LTI launch)
  if (resourceLinkId) {
    let container = db.getContainerByResourceLink(resourceLinkId);

    // If it doesn't exist yet, auto-create it dynamically from launch parameters!
    if (!container && courseId) {
      container = db.createContainer({
        courseId,
        name: dynamicName,
        description: `Assessment container for ${dynamicName}`,
        resourceLinkId,
        createdBy: auth.user.id
      });
    }

    if (container) {
      const childAssessments = db.getAssignmentsByContainer(container.id);
      return NextResponse.json({
        container,
        assessmentCount: childAssessments.length
      });
    }
  }

  if (!courseId) {
    return NextResponse.json({ error: 'courseId or resourceLinkId is required' }, { status: 400 });
  }

  // Get all containers for course
  let containers = db.getContainersByCourse(courseId);

  // If no containers exist for this course yet, dynamically provision a default one
  if (containers.length === 0) {
    const defaultContainer = db.createContainer({
      courseId,
      name: dynamicName || 'Programming',
      description: 'Default assessment container',
      createdBy: auth.user.id
    });
    containers = [defaultContainer];
  }

  const enriched = containers.map(c => ({
    ...c,
    assessmentCount: db.getAssignmentsByContainer(c.id).length
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  // Only Faculty or Admin can create assessment containers
  const auth = requireRole(request, ['FACULTY', 'ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { courseId, name, description, resourceLinkId } = body;

    if (!courseId || !name?.trim()) {
      return NextResponse.json({ error: 'courseId and name are required' }, { status: 400 });
    }

    const container = db.createContainer({
      courseId,
      name: name.trim(),
      description: description?.trim() || '',
      resourceLinkId: resourceLinkId?.trim() || undefined,
      createdBy: auth.user.id
    });

    return NextResponse.json(container, { status: 201 });
  } catch (error) {
    console.error('Create container error:', error);
    return NextResponse.json({ error: 'Failed to create container' }, { status: 500 });
  }
}

