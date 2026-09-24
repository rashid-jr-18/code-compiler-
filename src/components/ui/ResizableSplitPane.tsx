'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ResizableSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftPercent?: number; // e.g. 45
  minLeftPercent?: number; // e.g. 20
  maxLeftPercent?: number; // e.g. 80
  className?: string;
  storageKey?: string;
}

export default function ResizableSplitPane({
  left,
  right,
  initialLeftPercent = 45,
  minLeftPercent = 22,
  maxLeftPercent = 78,
  className = '',
  storageKey,
}: ResizableSplitPaneProps) {
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
    <div 
      ref={containerRef} 
      className={`flex flex-col lg:flex-row w-full relative select-none-during-drag ${className}`}
    >
      {/* Left Panel */}
      <div 
        style={{ width: `${leftPercent}%` }} 
        className="w-full lg:w-auto h-full flex flex-col min-w-0 transition-[width] duration-0"
      >
        {left}
      </div>

      {/* Draggable Divider (LeetCode Style) */}
      <div
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        title="Drag to resize panels"
        className="hidden lg:flex items-center justify-center w-3 -mx-1.5 z-20 cursor-col-resize group relative select-none hover:bg-blue-500/15 active:bg-blue-500/25 transition-colors"
      >
        {/* Visual Handle Line */}
        <div className="w-[2px] h-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 group-active:bg-blue-600 transition-colors" />
        
        {/* Center Grab Indicator */}
        <div className="absolute w-4 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-md flex items-center justify-center gap-0.5 group-hover:border-blue-500 group-hover:scale-105 transition-all">
          <div className="w-0.5 h-3 bg-slate-500 dark:bg-slate-400 rounded-full" />
          <div className="w-0.5 h-3 bg-slate-500 dark:bg-slate-400 rounded-full" />
        </div>
      </div>

      {/* Right Panel */}
      <div 
        style={{ width: `${100 - leftPercent}%` }} 
        className="w-full lg:w-auto h-full flex flex-col min-w-0 transition-[width] duration-0"
      >
        {right}
      </div>

      {/* Invisible Overlay while dragging to prevent iframes/monaco from intercepting pointer */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      )}
    </div>
  );
}

