'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Maximize2, Zap, Lock, CheckCircle2, Home, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SubmissionResultSummary {
  score: number;
  maxScore: number;
  passedTests?: number;
  totalTests?: number;
  overallStatus?: string;
}

interface ViolationWarningModalProps {
  isOpen: boolean;
  violationCount: number;
  violationLimit: number;
  reason: string;
  isLimitReached: boolean;
  isSubmitting: boolean;
  submissionResult?: SubmissionResultSummary | null;
  onAcknowledgeAndReturn: () => void;
  onFinishAndExit?: () => void;
}

export default function ViolationWarningModal({
  isOpen,
  violationCount,
  violationLimit,
  reason,
  isLimitReached,
  isSubmitting,
  submissionResult,
  onAcknowledgeAndReturn,
  onFinishAndExit
}: ViolationWarningModalProps) {
  const [countdown, setCountdown] = useState(8);

  const isCompleted = Boolean(submissionResult);

  // Auto-redirect countdown once submitted
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCompleted && isOpen) {
      setCountdown(8);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            onFinishAndExit?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCompleted, isOpen, onFinishAndExit]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col ${
            isCompleted
              ? 'border-emerald-500 shadow-emerald-500/20'
              : isLimitReached
              ? 'border-rose-500 shadow-rose-500/20'
              : 'border-amber-500 shadow-amber-500/20'
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 text-white flex items-center justify-between ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                : isLimitReached
                ? 'bg-gradient-to-r from-rose-600 to-red-700'
                : 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : isLimitReached ? (
                  <ShieldAlert className="w-5 h-5 text-white" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {isCompleted
                    ? 'Assessment Auto-Submitted!'
                    : isLimitReached
                    ? 'Security Limit Exceeded (3/3)!'
                    : 'Security Violation Warning!'}
                </h3>
                <p className="text-xs text-white/90">
                  {isCompleted
                    ? 'All Test Cases Evaluated & Saved'
                    : isLimitReached
                    ? 'Auto-Submitting Examination'
                    : 'Action Required to Continue'}
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
            {!isCompleted && (
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
            )}

            {/* Violation Meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Violations Recorded</span>
                <span className={isCompleted ? 'text-emerald-600 font-bold' : isLimitReached ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'}>
                  {violationCount} of {violationLimit} Limit
                </span>
              </div>

              {/* Progress segments */}
              <div className="grid grid-cols-3 gap-1.5 h-2.5">
                {Array.from({ length: violationLimit }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`rounded-full transition-all duration-300 ${
                      idx < violationCount
                        ? isCompleted
                          ? 'bg-emerald-600'
                          : isLimitReached
                          ? 'bg-rose-600 animate-pulse'
                          : 'bg-amber-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Post-submission Result Card or Warnings */}
            {isCompleted && submissionResult ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      Recorded Score
                    </span>
                  </div>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {submissionResult.score} / {submissionResult.maxScore} pts
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-800/60 pt-2">
                  <span>Tests Passed: <strong>{submissionResult.passedTests ?? 0} / {submissionResult.totalTests ?? 0}</strong></span>
                  <span>Status: <strong className="uppercase">{submissionResult.overallStatus || 'SUBMITTED'}</strong></span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                  Your code has been evaluated and locked. Fullscreen and webcam monitoring have been released.
                </p>

                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Redirecting to the main page automatically in {countdown}s...
                </p>
              </div>
            ) : !isLimitReached ? (
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
              <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed bg-rose-50 dark:bg-rose-950/60 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 font-medium space-y-2">
                <p>
                  You have reached the maximum allowed limit of {violationLimit} violations. As per institutional security policy, your test is now being automatically evaluated and submitted.
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  Please wait a moment while your submission is finalized...
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            {isCompleted ? (
              <Button
                type="button"
                onClick={onFinishAndExit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 cursor-pointer transition-all"
              >
                <Home size={15} />
                <span>Return to Main Page ({countdown}s)</span>
              </Button>
            ) : !isLimitReached ? (
              <Button
                type="button"
                onClick={onAcknowledgeAndReturn}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-5 flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Maximize2 size={13} />
                <span>I Understand & Return to Fullscreen</span>
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs py-1">
                  <Zap className="animate-spin" size={14} />
                  <span>Auto-submitting test now (Evaluating test cases)...</span>
                </div>
                {/* Fallback button if server evaluation takes too long */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onFinishAndExit}
                  className="text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  <Home size={13} className="mr-1" />
                  Exit to Main Page
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

