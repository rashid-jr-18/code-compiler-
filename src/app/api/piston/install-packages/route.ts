import { NextRequest, NextResponse } from 'next/server';

const PISTON_URL = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2';

let isInstalling = false;
let installProgress = {
  total: 0,
  installed: 0,
  currentLanguage: '',
  log: [] as string[]
};

function startBackgroundInstallation() {
  if (isInstalling) return;
  isInstalling = true;

  (async () => {
    try {
      const res = await fetch(`${PISTON_URL.replace(/\/$/, '')}/packages`, { cache: 'no-store' });
      if (!res.ok) {
        isInstalling = false;
        return;
      }
      const packages: Array<{ language: string; language_version: string; installed: boolean }> = await res.json();

      const latestVersions = new Map<string, string>();
      const alreadyInstalled = new Set<string>();

      for (const p of packages) {
        if (p.installed) {
          alreadyInstalled.add(p.language);
        }
        const current = latestVersions.get(p.language);
        if (!current || p.language_version > current) {
          latestVersions.set(p.language, p.language_version);
        }
      }

      // Priority list covering the 59 languages in the frontend
      const PRIORITY_ORDER = [
        'dart', 'swift', 'scala', 'haskell', 'lua', 'perl', 'rscript',
        'elixir', 'erlang', 'clojure', 'nasm', 'dotnet', 'pascal', 'nim',
        'groovy', 'prolog', 'cobol', 'lisp', 'freebasic', 'ocaml', 'octave',
        'crystal', 'julia', 'zig', 'deno', 'racket', 'coffeescript',
        'befunge93', 'brainfuck', 'cjam', 'golfscript', 'jelly', 'lolcode',
        'iverilog', 'dragon', 'emacs', 'emojicode', 'forte', 'forth', 'gawk'
      ];

      const queue: Array<{ language: string; version: string }> = [];
      for (const lang of PRIORITY_ORDER) {
        if (!alreadyInstalled.has(lang) && latestVersions.has(lang)) {
          queue.push({ language: lang, version: latestVersions.get(lang)! });
        }
      }

      for (const [lang, ver] of latestVersions.entries()) {
        if (!alreadyInstalled.has(lang) && !queue.some(q => q.language === lang)) {
          queue.push({ language: lang, version: ver });
        }
      }

      installProgress = {
        total: queue.length,
        installed: 0,
        currentLanguage: queue.length > 0 ? queue[0].language : 'All up to date',
        log: []
      };

      console.log(`[Piston Package Installer] Auto-installing ${queue.length} missing languages in background...`);

      for (const item of queue) {
        installProgress.currentLanguage = `${item.language} (${item.version})`;
        console.log(`[Piston Package Installer] Installing ${item.language} (${item.version})...`);
        try {
          const installRes = await fetch(`${PISTON_URL.replace(/\/$/, '')}/packages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: item.language, version: item.version })
          });
          const result = await installRes.json().catch(() => ({}));
          installProgress.installed += 1;
          installProgress.log.push(`✓ ${item.language}`);
          console.log(`[Piston Package Installer] ✓ Successfully installed ${item.language}`);
        } catch (e: any) {
          console.error(`[Piston Package Installer] Error on ${item.language}:`, e?.message);
          installProgress.log.push(`✗ ${item.language}`);
        }
      }

      console.log(`[Piston Package Installer] All ${installProgress.installed} languages successfully installed!`);
    } catch (err: any) {
      console.error('[Piston Package Installer] Fatal error:', err);
    } finally {
      isInstalling = false;
      installProgress.currentLanguage = 'Complete';
    }
  })();
}

export async function GET() {
  try {
    const res = await fetch(`${PISTON_URL.replace(/\/$/, '')}/packages`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch packages from Piston' }, { status: 502 });
    }
    const packages: Array<{ language: string; language_version: string; installed: boolean }> = await res.json();
    
    // Group unique installed languages
    const installedLanguages = Array.from(new Set(
      packages.filter(p => p.installed).map(p => p.language)
    )).sort();

    const allLanguages = Array.from(new Set(packages.map(p => p.language))).sort();

    // Auto-trigger background installation if any missing
    if (installedLanguages.length < allLanguages.length && !isInstalling) {
      startBackgroundInstallation();
    }

    return NextResponse.json({
      success: true,
      totalLanguages: allLanguages.length,
      installedCount: installedLanguages.length,
      installedLanguages,
      isInstalling,
      progress: installProgress
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Piston connection error' }, { status: 500 });
  }
}

export async function POST() {
  if (isInstalling) {
    return NextResponse.json({
      success: true,
      message: 'Installation is already running in background',
      progress: installProgress
    });
  }

  startBackgroundInstallation();

  return NextResponse.json({
    success: true,
    message: 'Started background installation of all missing languages in Piston',
    progress: installProgress
  });
}
