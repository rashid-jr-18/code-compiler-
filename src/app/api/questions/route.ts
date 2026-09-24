import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, sanitizeQuestionForLearner } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  const questions = db.getQuestions();

  // If learner, strip hidden test cases
  if (auth && !(auth instanceof NextResponse) && auth.user.role === 'LEARNER') {
    return NextResponse.json(questions.map(sanitizeQuestionForLearner));
  }

  return NextResponse.json(questions);
}

export async function POST(request: NextRequest) {
  // Creating a Problem is restricted to Faculty or Admin
  // IMPORTANT: Creating a problem does NOT create an assignment!
  const auth = requireRole(request, ['FACULTY', 'ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      title,
      description,
      difficulty,
      category,
      supportedLanguages,
      timeLimit,
      memoryLimit,
      sampleInput,
      sampleOutput,
      testCases,
      tags
    } = body;

    if (!title?.trim() || !description?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'Title, description, and category are required' }, { status: 400 });
    }

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json({ error: 'At least one test case is required' }, { status: 400 });
    }

    const question = db.createQuestion({
      title: title.trim(),
      description: description.trim(),
      difficulty: difficulty || 'Easy',
      category: category.trim(),
      supportedLanguages: supportedLanguages || [71],
      timeLimit: Number(timeLimit) || 5,
      memoryLimit: Number(memoryLimit) || 128,
      sampleInput,
      sampleOutput,
      tags: tags || [],
      createdBy: auth.user.id,
      testCases: testCases.map((tc: { input: string; expectedOutput: string; points?: number; description?: string; isHidden?: boolean }, idx: number) => ({
        id: `tc_${Date.now()}_${idx}`,
        questionId: '',
        input: tc.input.trim(),
        expectedOutput: tc.expectedOutput.trim(),
        points: Number(tc.points) || 10,
        description: tc.description?.trim(),
        isHidden: Boolean(tc.isHidden)
      }))
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Question creation error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Only Faculty or Admin can delete questions from Problem Library
  const auth = requireRole(request, ['FACULTY', 'ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const success = db.deleteQuestion(id);
    if (!success) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
      id
    });
  } catch (error) {
    console.error('Question deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete question', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

