'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Columns, FileText, Code2 } from 'lucide-react';

export type SplitPaneMode = 'split' | 'left' | 'right';

interface ResizableSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftPercent?: number; // e.g. 45
  minLeftPercent?: number; // e.g. 20
  maxLeftPercent?: number; // e.g. 80
  className?: string;
  storageKey?: string;
  leftTitle?: string; // e.g. "Problem"
  rightTitle?: string; // e.g. "Code Editor"
  activeMode?: SplitPaneMode;
  onModeChange?: (mode: SplitPaneMode) => void;
  hideModeSwitcher?: boolean;
}

export default function ResizableSplitPane({
  left,
  right,
  initialLeftPercent = 45,
  minLeftPercent = 20,
  maxLeftPercent = 80,
  className = '',
  storageKey,
  leftTitle = 'Problem',
  rightTitle = 'Code Editor',
  activeMode,
  onModeChange,
  hideModeSwitcher = false,
}: ResizableSplitPaneProps) {
  const [internalMode, setInternalMode] = useState<SplitPaneMode>('split');
  const currentMode = activeMode !== undefined ? activeMode : internalMode;

  const setMode = useCallback((newMode: SplitPaneMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  }, [onModeChange]);

  const [leftPercent, setLeftPercent] = useState<number>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= minLeftPercent && val <= maxLeftPercent) {
          return val;
        }
      }
    }
    return initialLeftPercent;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const offset = moveEvent.clientX - rect.left;
      const newPercent = (offset / rect.width) * 100;
      const clamped = Math.max(minLeftPercent, Math.min(maxLeftPercent, newPercent));

      setLeftPercent(clamped);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, clamped.toFixed(1));
        } catch (_) {}
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [minLeftPercent, maxLeftPercent, storageKey]);

  return (
    <div className="flex flex-col w-full h-full gap-2">
      {/* Responsive View Switcher Bar (Visible on mobile/narrow iframe or by default) */}
      {!hideModeSwitcher && (
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setMode('left')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentMode === 'left'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={13} />
              <span>{leftTitle}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('right')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentMode === 'right'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 size={13} />
              <span>{rightTitle}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns size={13} />
              <span>Split View</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {currentMode === 'split' ? 'Drag divider to resize' : `Viewing ${currentMode === 'left' ? leftTitle : rightTitle}`}
          </span>
        </div>
      )}

      {/* Pane Workspace */}
      <div 
        ref={containerRef} 
        className={`flex flex-row w-full flex-1 relative select-none-during-drag min-h-0 overflow-hidden ${className}`}
      >
        {/* Left Panel */}
        <div 
          style={currentMode === 'split' ? { width: `${leftPercent}%` } : {}} 
          className={`h-full flex flex-col min-w-0 transition-[width] duration-0 ${
            currentMode === 'left' ? 'w-full' : currentMode === 'split' ? '' : 'hidden'
          }`}
        >
          {left}
        </div>

        {/* Draggable Divider (Active only in Split View) */}
        {currentMode === 'split' && (
          <div
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
            title="Drag to resize panels"
            className="flex items-center justify-center w-3 -mx-1.5 z-20 cursor-col-resize group relative select-none hover:bg-blue-500/15 active:bg-blue-500/25 transition-colors shrink-0"
          >
            {/* Visual Handle Line */}
            <div className="w-[2px] h-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 group-active:bg-blue-600 transition-colors" />
            
            {/* Center Grab Indicator */}
            <div className="absolute w-4 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-md flex items-center justify-center gap-0.5 group-hover:border-blue-500 group-hover:scale-105 transition-all">
              <div className="w-0.5 h-3 bg-slate-500 dark:bg-slate-400 rounded-full" />
              <div className="w-0.5 h-3 bg-slate-500 dark:bg-slate-400 rounded-full" />
            </div>
          </div>
        )}

        {/* Right Panel */}
        <div 
          style={currentMode === 'split' ? { width: `${100 - leftPercent}%` } : {}} 
          className={`h-full flex flex-col min-w-0 transition-[width] duration-0 ${
            currentMode === 'right' ? 'w-full' : currentMode === 'split' ? '' : 'hidden'
          }`}
        >
          {right}
        </div>

        {/* Invisible Overlay while dragging to prevent iframes/monaco from intercepting pointer */}
        {isDragging && (
          <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
        )}
      </div>
    </div>
  );
}

