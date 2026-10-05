'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProctoringEventType } from '@/types';
import toast from 'react-hot-toast';

interface UseKioskModeOptions {
  enabled: boolean;
  isActive: boolean; // True once learner enters assessment after pre-check
  allowCopyPaste?: boolean;
  violationLimit: number;
  onViolation: (eventType: ProctoringEventType, severity: 'WARNING' | 'CRITICAL', message: string) => void;
  onLimitExceeded?: () => void;
}

export function useKioskMode({
  enabled,
  isActive,
  allowCopyPaste = false,
  violationLimit,
  onViolation,
  onLimitExceeded
}: UseKioskModeOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const isEnforcing = enabled && isActive;

  // Use refs to avoid stale closures in event listeners
  const violationCountRef = useRef(violationCount);
  violationCountRef.current = violationCount;

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const onLimitExceededRef = useRef(onLimitExceeded);
  onLimitExceededRef.current = onLimitExceeded;

  const triggerViolation = useCallback((eventType: ProctoringEventType, severity: 'WARNING' | 'CRITICAL', message: string) => {
    const nextCount = violationCountRef.current + 1;
    setViolationCount(nextCount);
    toast.error(`⚠️ Security Warning (${nextCount}/${violationLimit}): ${message}`, {
      duration: 5000,
      id: `violation_${eventType}`
    });

    onViolationRef.current(eventType, severity, message);

    if (nextCount >= violationLimit) {
      if (onLimitExceededRef.current) {
        onLimitExceededRef.current();
      }
    }
  }, [violationLimit]);

  // Request fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('[Kiosk] Fullscreen request error:', err);
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('[Kiosk] Fullscreen exit error:', err);
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    if (!isEnforcing) return;

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        triggerViolation(
          'FULLSCREEN_EXIT',
          'CRITICAL',
          'Exiting Fullscreen is strictly disallowed during proctored assessment.'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isEnforcing, triggerViolation]);

  // Tab switch & Window Blur listeners
  useEffect(() => {
    if (!isEnforcing) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(
          'TAB_SWITCH',
          'CRITICAL',
          'Tab switching or minimizing assessment window is recorded as a violation.'
        );
      }
    };

    const handleWindowBlur = () => {
      // Debounce window blur to prevent false alarms from internal iframe clicks
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          triggerViolation(
            'WINDOW_BLUR',
            'WARNING',
            'Focus lost from assessment window. Please keep the exam active.'
          );
        }
      }, 500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isEnforcing, triggerViolation]);

  // Copy / Paste / Cut & Context Menu Restriction
  useEffect(() => {
    if (!isEnforcing) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast('Right-click context menu is disabled in Kiosk Mode.', { icon: '🛡️' });
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (!allowCopyPaste) {
        e.preventDefault();
        triggerViolation(
          'COPY_PASTE_ATTEMPT',
          'WARNING',
          'Copying text is restricted during this proctored examination.'
        );
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!allowCopyPaste) {
        e.preventDefault();
        triggerViolation(
          'COPY_PASTE_ATTEMPT',
          'WARNING',
          'Pasting text is restricted during this proctored examination.'
        );
      }
    };

    // Keyboard shortcuts (F12, Inspect, Print)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+U (DevTools & Source)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        triggerViolation('COPY_PASTE_ATTEMPT', 'CRITICAL', 'Developer tools inspection is prohibited.');
      }
      // Ctrl+P (Print)
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnforcing, allowCopyPaste, triggerViolation]);

  // Before unload warning
  useEffect(() => {
    if (!isEnforcing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Assessment is in progress. Leaving this page will submit or terminate your session.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEnforcing]);

  // Immediately exit fullscreen when component unmounts or exam finishes
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  return {
    isFullscreen,
    violationCount,
    setViolationCount,
    enterFullscreen,
    exitFullscreen
  };
}
