import { NextResponse } from 'next/server';
import { LANGUAGE_ID_TO_PISTON } from '@/lib/piston';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function GET() {
  const runtimesMap = new Map<string, { language: string; version: string; aliases: string[] }>();

  for (const item of Object.values(LANGUAGE_ID_TO_PISTON)) {
    if (!runtimesMap.has(item.language)) {
      runtimesMap.set(item.language, {
        language: item.language,
        version: item.version,
        aliases: [item.extension]
      });
    } else {
      const existing = runtimesMap.get(item.language)!;
      if (!existing.aliases.includes(item.extension)) {
        existing.aliases.push(item.extension);
      }
    }
  }

  return NextResponse.json(Array.from(runtimesMap.values()), {
    status: 200,
    headers: getCorsHeaders(),
  });
}

