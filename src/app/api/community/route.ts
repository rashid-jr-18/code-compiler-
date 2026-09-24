import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || 'crs_cs101';
  const questionId = searchParams.get('questionId') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const search = searchParams.get('search') || undefined;

  const posts = db.getCommunityPosts(courseId, { questionId, tag, search });

  return NextResponse.json({
    success: true,
    posts
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;

  try {
    const body = await request.json();
    const { courseId, questionId, questionTitle, title, content, codeSnippet, language, tags } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const post = db.createCommunityPost({
      courseId: courseId || 'crs_cs101',
      questionId: questionId || undefined,
      questionTitle: questionTitle || undefined,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role as 'FACULTY' | 'LEARNER' | 'ADMIN',
      title: title.trim(),
      content: content.trim(),
      codeSnippet: codeSnippet?.trim() || undefined,
      language: language || undefined,
      tags: Array.isArray(tags) ? tags : []
    });

    // Award streak activity for participating in the community
    db.recordUserActivity(user.id, false);

    return NextResponse.json({
      success: true,
      post
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create discussion post' }, { status: 500 });
  }
}

