'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Camera, Lock, CheckCircle2, AlertTriangle, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProctoringConfig } from '@/types';

interface ProctoringPreCheckModalProps {
  isOpen: boolean;
  assignmentTitle: string;
  config: ProctoringConfig;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  cameraError: string | null;
  onStartCamera: () => Promise<boolean>;
  onConsentAndStart: () => void;
  onCancel: () => void;
}

export default function ProctoringPreCheckModal({
  isOpen,
  assignmentTitle,
  config,
  videoRef,
  isStreaming,
  cameraError,
  onStartCamera,
  onConsentAndStart,
  onCancel
}: ProctoringPreCheckModalProps) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);

  if (!isOpen) return null;

  const handleTestCamera = async () => {
    setIsRequestingCamera(true);
    await onStartCamera();
    setIsRequestingCamera(false);
  };

  const isReadyToStart =
    consentGiven &&
    (!config.enableCamera || isStreaming);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Secure Exam Pre-Check Gate</h2>
                <p className="text-xs text-blue-100 opacity-90">{assignmentTitle}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/20 rounded-full border border-white/30 uppercase tracking-wider">
              Verification
            </span>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Exam Security Policies Explained */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {config.enableKiosk && (
                <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">Kiosk Mode Enforced</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Runs in full screen. Tab switches, minimizing windows, and copy-pasting are strictly recorded.
                    </p>
                  </div>
                </div>
              )}

              {config.enableCamera && (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-start gap-2.5">
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">Camera Proctoring</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Periodic verification snapshots are captured automatically. Audio is NOT recorded.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Violation Policy Info */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Violation Threshold: </span>
                <span>
                  Maximum {config.violationLimit} warnings permitted. Exceeding this limit will trigger{' '}
                  <strong>
                    {config.actionOnLimit === 'AUTO_SUBMIT'
                      ? 'Immediate Auto-Submission of your test'
                      : config.actionOnLimit === 'FLAG_REVIEW'
                      ? 'Flagging your attempt for Faculty Review'
                      : 'Security Warning Logs'}
                  </strong>
                  .
                </span>
              </div>
            </div>

            {/* Camera Preview Section */}
            {config.enableCamera && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    Webcam Alignment & Lighting Check
                  </label>
                  {isStreaming ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Camera Ready
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Permission Required
                    </span>
                  )}
                </div>

                <div className="relative aspect-video w-full max-w-md mx-auto bg-slate-950 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover mirror-mode ${isStreaming ? 'block' : 'hidden'}`}
                    style={{ transform: 'scaleX(-1)' }}
                  />

                  {!isStreaming && (
                    <div className="text-center p-6 space-y-3">
                      <Camera className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                      <p className="text-xs text-slate-400 max-w-xs">
                        Click below to grant camera access and align your face in frame before proceeding.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleTestCamera}
                        disabled={isRequestingCamera}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4"
                      >
                        {isRequestingCamera ? 'Requesting...' : 'Grant Camera Access'}
                      </Button>
                    </div>
                  )}

                  {isStreaming && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-medium">
                    ⚠️ {cameraError}
                  </p>
                )}
              </div>
            )}

            {/* Consent Agreement */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  I acknowledge and consent to the automated exam proctoring conditions, including fullscreen lockdown,
                  tab activity tracking, and periodic camera verification snapshots.
                </span>
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Exit to Dashboard
            </Button>

            <Button
              size="sm"
              disabled={!isReadyToStart}
              onClick={onConsentAndStart}
              className={`text-xs font-semibold px-5 flex items-center gap-2 ${
                isReadyToStart
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Consent & Enter Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
