import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const users = db.getAllUsers();
    
    // Enrich each user with enrolled courses and stats
    const enrichedUsers = users.map(user => {
      const courses = db.getUserCourses(user.id);
      
      let completedSubmissions = 0;
      let totalAssignments = 0;
      
      if (user.role === 'LEARNER') {
        const userAssignments = Array.from(db.assignmentLearners.values()).filter(al => al.learnerId === user.id);
        totalAssignments = userAssignments.length;
        completedSubmissions = userAssignments.filter(al => al.status === 'SUBMITTED' || al.status === 'REVIEWED' || al.status === 'EXPORTED').length;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ltiSubject: user.ltiSubject || null,
        courses: courses.map(c => ({ id: c.id, code: c.code || c.title.split(':')[0], title: c.title })),
        stats: {
          totalAssignments,
          completedSubmissions
        },
        createdAt: user.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedUsers.length,
      users: enrichedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

