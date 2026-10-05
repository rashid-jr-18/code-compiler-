'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Maximize2, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViolationWarningModalProps {
  isOpen: boolean;
  violationCount: number;
  violationLimit: number;
  reason: string;
  isLimitReached: boolean;
  isSubmitting: boolean;
  onAcknowledgeAndReturn: () => void;
}

export default function ViolationWarningModal({
  isOpen,
  violationCount,
  violationLimit,
  reason,
  isLimitReached,
  isSubmitting,
  onAcknowledgeAndReturn
}: ViolationWarningModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col ${
            isLimitReached
              ? 'border-rose-500 shadow-rose-500/20'
              : 'border-amber-500 shadow-amber-500/20'
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 text-white flex items-center justify-between ${
              isLimitReached
                ? 'bg-gradient-to-r from-rose-600 to-red-700'
                : 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                {isLimitReached ? <ShieldAlert className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {isLimitReached ? 'Security Limit Exceeded!' : 'Security Violation Warning!'}
                </h3>
                <p className="text-xs text-white/90">
                  {isLimitReached ? 'Auto-Submitting Examination' : 'Action Required to Continue'}
                </p>
              </div>
            </div>

            <span className="text-xs font-black px-2.5 py-1 bg-white/20 rounded-full border border-white/30">
              {violationCount} / {violationLimit}
            </span>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            {/* Reason Pill */}
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isLimitReached
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Lock size={13} />
                <span>Detected Violation:</span>
              </div>
              <p className="font-medium">{reason || 'Exiting fullscreen or switching active tabs/windows is prohibited.'}</p>
            </div>

            {/* Violation Meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Violations Incurred</span>
                <span className={isLimitReached ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'}>
                  {violationCount} of {violationLimit} Warnings
                </span>
              </div>

              {/* Progress segments */}
              <div className="grid grid-cols-3 gap-1.5 h-2.5">
                {Array.from({ length: violationLimit }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`rounded-full transition-all duration-300 ${
                      idx < violationCount
                        ? isLimitReached
                          ? 'bg-rose-600 animate-pulse'
                          : 'bg-amber-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Explanation / Warning Note */}
            {!isLimitReached ? (
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  ⚠️ Important Exam Rule:
                </p>
                <p>
                  You are taking a proctored assessment. Please remain in <strong>Fullscreen Mode</strong> and do not press <code>Alt + Tab</code>, <code>Esc</code>, or switch browser tabs.
                </p>
                <p className="text-rose-600 dark:text-rose-400 font-bold pt-1">
                  Reaching {violationLimit} violations will automatically terminate and submit your assessment!
                </p>
              </div>
            ) : (
              <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed bg-rose-50 dark:bg-rose-950/60 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 font-medium">
                You have reached the maximum allowed limit of {violationLimit} violations. As per institutional security policy, your test is now being automatically evaluated and submitted.
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
            {!isLimitReached ? (
              <Button
                type="button"
                onClick={onAcknowledgeAndReturn}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-5 flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Maximize2 size={13} />
                <span>I Understand & Return to Fullscreen</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                {isSubmitting && <Zap className="animate-spin" size={14} />}
                <span>Auto-submitting test now...</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
