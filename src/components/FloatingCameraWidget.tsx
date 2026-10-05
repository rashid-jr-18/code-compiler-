'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface FloatingCameraWidgetProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  violationCount: number;
  violationLimit: number;
}

export default function FloatingCameraWidget({
  videoRef,
  isStreaming,
  violationCount,
  violationLimit
}: FloatingCameraWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isStreaming) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-40 shadow-2xl rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-900/90 backdrop-blur-md text-white select-none transition-all duration-200"
      style={{ width: isCollapsed ? 'auto' : '190px' }}
    >
      {/* Widget Header */}
      <div className="px-2.5 py-1.5 bg-slate-950/80 flex items-center justify-between gap-2 border-b border-slate-800 text-[11px] font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-200">
            {isCollapsed ? 'Camera Live' : 'Exam Monitoring'}
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          title={isCollapsed ? 'Expand camera' : 'Minimize camera'}
        >
          {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Video Preview Body */}
      {!isCollapsed && (
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[9px] bg-slate-950/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-slate-300">
            <span className="flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-400" />
              Secured
            </span>
            <span className={violationCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              Vio: {violationCount}/{violationLimit}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
