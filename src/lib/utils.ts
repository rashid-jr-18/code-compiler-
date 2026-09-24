import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeOutput(out: string): string {
  if (!out) return '';
  const trimmed = out.trim().replace(/\r\n/g, '\n').replace(/\s+$/gm, '');
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const normalizedArray = parsed.map(item => {
        if (Array.isArray(item)) {
          return [...item].sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
        }
        return item;
      });
      if (normalizedArray.every(item => Array.isArray(item))) {
        normalizedArray.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      }
      return JSON.stringify(normalizedArray);
    }
    return JSON.stringify(parsed);
  } catch {
    return trimmed;
  }
}


