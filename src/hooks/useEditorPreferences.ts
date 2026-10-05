'use client';

import { useState, useEffect } from 'react';

export interface EditorPreferences {
  colorTheme: string;
  fontSize: number;
  wordWrap: 'on' | 'off';
  disableAutocomplete: boolean;
  preserveErrorLog: boolean;
  avoidAutoScrolling: boolean;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  colorTheme: 'tokyo-night',
  fontSize: 14,
  wordWrap: 'on',
  disableAutocomplete: false,
  preserveErrorLog: false,
  avoidAutoScrolling: false,
};

const STORAGE_KEY = 'edutech_editor_preferences_v1';

export function useEditorPreferences() {
  const [preferences, setPreferences] = useState<EditorPreferences>(DEFAULT_EDITOR_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('[useEditorPreferences] Failed to load preferences:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updatePreference = <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('[useEditorPreferences] Failed to save preferences:', e);
      }
      return next;
    });
  };

  const updateAll = (next: Partial<EditorPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('[useEditorPreferences] Failed to save preferences:', e);
      }
      return updated;
    });
  };

  return {
    preferences,
    updatePreference,
    updateAll,
    isLoaded,
  };
}

export function getEffectiveEditorTheme(colorTheme: string, resolvedTheme?: string): string {
  if (!colorTheme || colorTheme === 'system') {
    return resolvedTheme === 'dark' ? 'vs-dark' : 'light';
  }
  return colorTheme;
}

