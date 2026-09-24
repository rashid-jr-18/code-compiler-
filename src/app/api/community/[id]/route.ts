import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const post = db.getCommunityPostById(id);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const sort = (searchParams.get('sort') === 'newest' ? 'newest' : 'best') as 'best' | 'newest';

  const replies = db.getCommunityReplies(id, sort);

  return NextResponse.json({
    success: true,
    post,
    replies
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { user } = auth;

  try {
    const body = await request.json();
    const action = body.action || 'reply';

    if (action === 'upvote') {
      const updatedPost = db.togglePostUpvote(id, user.id);
      return NextResponse.json({ success: true, post: updatedPost });
    }

    if (action === 'downvote') {
      const updatedPost = db.togglePostDownvote(id, user.id);
      return NextResponse.json({ success: true, post: updatedPost });
    }

    if (action === 'upvote_reply') {
      const replyId = body.replyId;
      if (!replyId) {
        return NextResponse.json({ error: 'replyId is required' }, { status: 400 });
      }
      const updatedReply = db.toggleReplyUpvote(replyId, user.id);
      return NextResponse.json({ success: true, reply: updatedReply });
    }

    if (action === 'downvote_reply') {
      const replyId = body.replyId;
      if (!replyId) {
        return NextResponse.json({ error: 'replyId is required' }, { status: 400 });
      }
      const updatedReply = db.toggleReplyDownvote(replyId, user.id);
      return NextResponse.json({ success: true, reply: updatedReply });
    }

    if (action === 'accept_reply') {
      const replyId = body.replyId;
      const isAccepted = Boolean(body.isAccepted);
      const post = db.getCommunityPostById(id);

      // Only faculty or post author can mark accepted
      if (user.role !== 'FACULTY' && user.role !== 'ADMIN' && post?.authorId !== user.id) {
        return NextResponse.json({ error: 'Only instructors or the question author can accept answers' }, { status: 403 });
      }

      const updatedReply = db.markReplyAccepted(replyId, isAccepted);
      return NextResponse.json({ success: true, reply: updatedReply });
    }

    // Default action: 'reply'
    const { content, codeSnippet, language, parentReplyId, replyToAuthorName } = body;
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    const reply = db.createCommunityReply({
      postId: id,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role as 'FACULTY' | 'LEARNER' | 'ADMIN',
      content: content.trim(),
      codeSnippet: codeSnippet?.trim() || undefined,
      language: language || undefined,
      parentReplyId: parentReplyId || undefined,
      replyToAuthorName: replyToAuthorName || undefined
    });

    // Record activity for author
    db.recordUserActivity(user.id, false);

    return NextResponse.json({
      success: true,
      reply
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}

