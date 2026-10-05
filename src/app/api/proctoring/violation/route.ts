import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      assignmentId,
      learnerId,
      eventType,
      severity = 'WARNING',
      snapshotBase64,
      notes
    } = body;

    if (!assignmentId || !learnerId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: assignmentId, learnerId, eventType' },
        { status: 400 }
      );
    }

    let evidenceImageUrl: string | undefined = undefined;

    // If a snapshot frame is provided (JPEG base64), write it securely to the persistent data volume
    if (snapshotBase64 && typeof snapshotBase64 === 'string') {
      try {
        const base64Data = snapshotBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Sanitized directory structure: data/proctoring/<assignmentId>/<learnerId>/
        const safeAssignmentId = assignmentId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeLearnerId = learnerId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeEventType = eventType.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');

        const proctoringDir = path.join(
          process.cwd(),
          'data',
          'proctoring',
          safeAssignmentId,
          safeLearnerId
        );

        if (!fs.existsSync(proctoringDir)) {
          fs.mkdirSync(proctoringDir, { recursive: true });
        }

        const fileName = `${Date.now()}_${safeEventType}.jpg`;
        const filePath = path.join(proctoringDir, fileName);

        fs.writeFileSync(filePath, buffer);
        evidenceImageUrl = `/api/proctoring/evidence/${safeAssignmentId}/${safeLearnerId}/${fileName}`;
      } catch (fileErr) {
        console.error('[Proctoring API] Error saving snapshot image:', fileErr);
      }
    }

    // Record the event in persistent database
    const { session, event } = db.recordProctoringEvent(assignmentId, learnerId, {
      eventType,
      severity,
      evidenceImageUrl,
      notes
    });

    // Determine if violation limit is reached based on assignment's proctoring config
    const assignment = db.assignments.get(assignmentId);
    const proctoringConfig = assignment?.proctoringConfig;

    let limitReached = false;
    let actionRequired: string | null = null;

    if (proctoringConfig && eventType !== 'PERIODIC_SNAPSHOT') {
      const limit = proctoringConfig.violationLimit || 3;
      if (session.totalViolations >= limit) {
        limitReached = true;
        actionRequired = proctoringConfig.actionOnLimit;

        if (actionRequired === 'AUTO_SUBMIT') {
          db.updateProctoringSessionStatus(session.id, 'AUTO_SUBMITTED');
        } else if (actionRequired === 'FLAG_REVIEW') {
          db.updateProctoringSessionStatus(session.id, 'FLAGGED_FOR_REVIEW');
        }
      }
    }

    return NextResponse.json({
      success: true,
      event,
      totalViolations: session.totalViolations,
      limitReached,
      actionRequired,
      sessionStatus: session.status
    });
  } catch (error: unknown) {
    console.error('[Proctoring Violation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record proctoring event' },
      { status: 500 }
    );
  }
}
