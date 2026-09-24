import { NextResponse } from 'next/server';
import { EXECUTION_LANGUAGES } from '@/lib/execution-languages';
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
  const languagesList = Object.entries(EXECUTION_LANGUAGES).map(([idStr, config]) => {
    const id = Number(idStr);
    const pistonInfo = LANGUAGE_ID_TO_PISTON[id];
    return {
      id,
      name: config.name,
      extension: config.extension,
      pistonLanguage: pistonInfo?.language || config.extension,
      pistonVersion: pistonInfo?.version || '*',
      compile_cmd: config.compile_cmd || null,
      run_cmd: config.run_cmd
    };
  });

  return NextResponse.json(languagesList, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

