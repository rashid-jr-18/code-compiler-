import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'File not specified' }, { status: 400 });
    }

    // Sanitize path segments to prevent directory traversal
    const sanitizedSegments = pathSegments.map(seg => seg.replace(/[^a-zA-Z0-9_.-]/g, ''));
    const filePath = path.join(process.cwd(), 'data', 'proctoring', ...sanitizedSegments);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable'
      }
    });
  } catch (error) {
    console.error('[Evidence Route] Error serving file:', error);
    return NextResponse.json({ error: 'Failed to read evidence' }, { status: 500 });
  }
}
