import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'deprecated',
    message: 'Judge0 is no longer involved in this application. All execution routes use the Piston engine at /api/piston/execute.'
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({
    status: 'deprecated',
    message: 'Judge0 is no longer involved in this application. All execution routes use the Piston engine at /api/piston/execute.'
  }, { status: 410 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
