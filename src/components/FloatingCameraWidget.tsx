'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ShieldCheck, Move } from 'lucide-react';

interface FloatingCameraWidgetProps {
  stream: MediaStream | null;
  isStreaming: boolean;
  violationCount: number;
  violationLimit: number;
}

export default function FloatingCameraWidget({
  stream,
  isStreaming,
  violationCount,
  violationLimit
}: FloatingCameraWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Directly attach the live MediaStream to this widget's video element
  useEffect(() => {
    if (internalVideoRef.current && stream) {
      internalVideoRef.current.srcObject = stream;
      internalVideoRef.current.play().catch(e => console.warn('[FloatingWidget] Play error:', e));
    }
  }, [stream, isCollapsed]);

  if (!isStreaming || !stream) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileDrag={{ scale: 1.03 }}
      className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/95 backdrop-blur-md text-white select-none transition-shadow hover:shadow-blue-500/20"
      style={{ width: isCollapsed ? 'auto' : '210px' }}
    >
      {/* Widget Header & Drag Handle */}
      <div className="px-3 py-2 bg-slate-950/90 flex items-center justify-between gap-2 border-b border-slate-800 text-[11px] font-semibold cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5 min-w-0">
          <Move size={12} className="text-slate-400 shrink-0" />
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-200 truncate">
            {isCollapsed ? 'Camera Live' : 'Exam Monitoring'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand camera' : 'Minimize camera'}
        >
          {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Video Preview Body */}
      {!isCollapsed && (
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          <video
            ref={internalVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
          />

          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] bg-slate-950/70 backdrop-blur-xs px-2 py-0.5 rounded-md text-slate-300 pointer-events-none">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck size={11} className="text-emerald-400" />
              Secured
            </span>
            <span className={violationCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400 font-medium'}>
              Vio: {violationCount}/{violationLimit}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
