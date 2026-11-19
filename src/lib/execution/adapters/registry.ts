import { LanguageAdapter } from './types';
import { PythonAdapter } from './python-adapter';
import { JavaScriptAdapter } from './javascript-adapter';

const pythonAdapter = new PythonAdapter();
const jsAdapter = new JavaScriptAdapter();

const ADAPTER_REGISTRY: Map<number | string, LanguageAdapter> = new Map();

// Register Python (IDs 71, 70, 10, 'python', 'py')
[71, 70, 10, 'python', 'py'].forEach(key => {
  ADAPTER_REGISTRY.set(key, pythonAdapter);
});

// Register JavaScript (IDs 63, 74, 'javascript', 'js', 'node', 'typescript', 'ts')
[63, 74, 'javascript', 'js', 'node', 'typescript', 'ts'].forEach(key => {
  ADAPTER_REGISTRY.set(key, jsAdapter);
});

/**
 * Retrieve a language adapter by numeric languageId, language name, or extension
 */
export function getLanguageAdapter(lang: number | string): LanguageAdapter | null {
  if (typeof lang === 'number') {
    return ADAPTER_REGISTRY.get(lang) || null;
  }

  const normalized = String(lang).toLowerCase().trim();
  if (ADAPTER_REGISTRY.has(normalized)) {
    return ADAPTER_REGISTRY.get(normalized)!;
  }

  for (const [key, adapter] of ADAPTER_REGISTRY.entries()) {
    if (typeof key === 'string' && normalized.includes(key)) {
      return adapter;
    }
  }

  return null;
}

/**
 * Check if a language supports function-based evaluation
 */
export function isFunctionModeSupported(lang: number | string): boolean {
  return getLanguageAdapter(lang) !== null;
}
