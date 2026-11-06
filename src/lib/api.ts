/**
 * Centralized API Configuration for EduTech Compiler
 * 
 * Standardizes all frontend API calls under the dedicated /compiler/api namespace.
 * Prevents routing collisions with other applications (e.g. Medical Logbook) on the same domain.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/compiler/api';

/**
 * Normalizes an API path to always resolve under /compiler/api
 * e.g.,
 *   apiUrl('/assignments') -> '/compiler/api/assignments'
 *   apiUrl('/api/assignments') -> '/compiler/api/assignments'
 *   apiUrl('/compiler/api/assignments') -> '/compiler/api/assignments'
 */
export function apiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const endpoint = clean.replace(/^\/(compiler\/)?api\/?/, '');
  return `${API_BASE.replace(/\/$/, '')}/${endpoint}`;
}

