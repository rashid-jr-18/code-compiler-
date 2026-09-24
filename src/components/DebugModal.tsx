'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bug, 
  Play, 
  Loader2, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  ArrowRight, 
  FileCode2, 
  Copy, 
  Check, 
  RotateCcw
} from 'lucide-react';
import { TestCase, ExecutionResult } from '@/types';
import { getLanguageById } from '@/config/languages';
import { normalizeOutput } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  languageId: number;
  testCases?: TestCase[];
  defaultStdin?: string;
  problemTitle?: string;
}

export default function DebugModal({
  isOpen,
  onClose,
  code,
  languageId,
  testCases = [],
  defaultStdin = '',
  problemTitle
}: DebugModalProps) {
  const [activeCaseIndex, setActiveCaseIndex] = useState<number>(testCases.length > 0 ? 0 : -1);
  const [customStdin, setCustomStdin] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [debugResult, setDebugResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'stderr' | 'diff' | 'profile'>('console');
  const [copied, setCopied] = useState<boolean>(false);

  const currentLanguage = getLanguageById(languageId);

  // Initialize input when modal opens or testCases change
  useEffect(() => {
    if (isOpen) {
      if (testCases.length > 0) {
        setActiveCaseIndex(0);
        setCustomStdin(testCases[0].input || '');
      } else {
        setActiveCaseIndex(-1);
        setCustomStdin(defaultStdin || '');
      }
      setDebugResult(null);
      setActiveTab('console');
    }
  }, [isOpen, testCases, defaultStdin]);

  if (!isOpen) return null;

  const handleSelectCase = (index: number) => {
    setActiveCaseIndex(index);
    if (index >= 0 && index < testCases.length) {
      setCustomStdin(testCases[index].input || '');
    }
  };

  const handleSelectCustom = () => {
    setActiveCaseIndex(-1);
  };

  const currentExpectedOutput = activeCaseIndex >= 0 && activeCaseIndex < testCases.length 
    ? testCases[activeCaseIndex].expectedOutput 
    : null;

  const handleRunDebug = async () => {
    setIsRunning(true);
    setDebugResult(null);

    try {
      const response = await fetch('/api/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: customStdin,
        }),
      });

      if (!response.ok) {
        throw new Error('Debug execution failed');
      }

      const result: ExecutionResult = await response.json();
      setDebugResult(result);

      if (result.stderr || (result.status && result.status.id !== 3)) {
        setActiveTab('stderr');
      } else if (currentExpectedOutput) {
        setActiveTab('console');
      } else {
        setActiveTab('console');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Debug execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actualNormalized = debugResult ? normalizeOutput(debugResult.stdout || '') : '';
  const expectedNormalized = currentExpectedOutput ? normalizeOutput(currentExpectedOutput) : '';
  const isMatch = currentExpectedOutput && debugResult ? actualNormalized === expectedNormalized : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-300 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Bug size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Interactive Debugger</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Diagnostics Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {problemTitle ? `${problemTitle} • ` : ''}
                {currentLanguage?.name || 'Code Runner'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRunDebug}
              disabled={isRunning}
              className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs h-8 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Tracing...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>Execute Debug</span>
                </>
              )}
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Test Case / Custom Input Selector Bar */}
          {testCases.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
                  Test Case:
                </span>
                {testCases.map((tc, idx) => (
                  <button
                    key={tc.id || idx}
                    onClick={() => handleSelectCase(idx)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                      activeCaseIndex === idx
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
                <button
                  onClick={handleSelectCustom}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    activeCaseIndex === -1
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  Custom Input
                </button>
              </div>

              {activeCaseIndex >= 0 && (
                <button
                  onClick={() => setCustomStdin(testCases[activeCaseIndex]?.input || '')}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 px-2"
                >
                  <RotateCcw size={12} />
                  <span>Reset Input</span>
                </button>
              )}
            </div>
          )}

          {/* Stdin Input Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Terminal size={13} className="text-amber-600 dark:text-amber-400" />
                <span>Standard Input (stdin)</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                  — Edit to test specific values & edge cases
                </span>
              </label>
              {currentExpectedOutput && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Expected: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{currentExpectedOutput}</code>
                </span>
              )}
            </div>
            <textarea
              value={customStdin}
              onChange={e => setCustomStdin(e.target.value)}
              placeholder="Enter input passed to program..."
              rows={3}
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y"
            />
          </div>

          {/* Output & Trace Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-2">
              {/* Output Tabs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('console')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'console'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Terminal size={13} />
                  <span>Output (stdout)</span>
                </button>
                <button
                  onClick={() => setActiveTab('stderr')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'stderr'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <AlertCircle size={13} className={debugResult?.stderr ? 'text-rose-500' : ''} />
                  <span>Traceback / Errors</span>
                  {debugResult?.stderr && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
                {currentExpectedOutput && (
                  <button
                    onClick={() => setActiveTab('diff')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'diff'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CheckCircle2 size={13} className={isMatch ? 'text-emerald-500' : 'text-amber-500'} />
                    <span>Diff Check</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'profile'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Cpu size={13} />
                  <span>Diagnostics</span>
                </button>
              </div>

              {/* Status Badge */}
              {debugResult && (
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Clock size={12} />
                    <span>{debugResult.time || '<0.01'}s</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Cpu size={12} />
                    <span>{debugResult.memory ? `${(debugResult.memory / 1024).toFixed(1)}MB` : 'N/A'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    debugResult.status.id === 3
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    {debugResult.status.description || (debugResult.status.id === 3 ? 'Exit 0' : 'Error')}
                  </span>
                </div>
              )}
            </div>

            {/* Output Panels */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 min-h-[160px] max-h-[260px] overflow-y-auto font-mono text-xs relative">
              {!debugResult && !isRunning && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-600">
                  <Terminal size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Ready for Debug Execution</p>
                  <p className="text-[11px] mt-0.5">Click &quot;Execute Debug&quot; above to run code against the provided stdin and inspect diagnostics.</p>
                </div>
              )}

              {isRunning && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
                  <Loader2 size={24} className="animate-spin text-amber-500" />
                  <p className="text-xs font-semibold">Executing with live trace capture...</p>
                </div>
              )}

              {debugResult && !isRunning && (
                <>
                  {/* Console stdout Tab */}
                  {activeTab === 'console' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-400 pb-1 border-b border-slate-300 dark:border-slate-800">
                        <span>Standard Output</span>
                        <button
                          onClick={() => copyOutput(debugResult.stdout || '')}
                          className="hover:text-slate-200 flex items-center gap-1"
                        >
                          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      {debugResult.stdout ? (
                        <pre className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap">{debugResult.stdout}</pre>
                      ) : (
                        <span className="text-slate-400 italic">Program produced no standard output.</span>
                      )}
                    </div>
                  )}

                  {/* Stderr Traceback Tab */}
                  {activeTab === 'stderr' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-400 pb-1 border-b border-slate-300 dark:border-slate-800">
                        <span>Error Traceback & Compile Output</span>
                        {debugResult.stderr && (
                          <button
                            onClick={() => copyOutput(debugResult.stderr || '')}
                            className="hover:text-slate-200 flex items-center gap-1"
                          >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                      {debugResult.stderr || debugResult.compile_output ? (
                        <pre className="text-rose-700 dark:text-rose-400 whitespace-pre-wrap">
                          {debugResult.stderr || debugResult.compile_output}
                        </pre>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 py-4">
                          <CheckCircle2 size={16} />
                          <span>No errors or warnings recorded. Execution completed cleanly.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diff Check Tab */}
                  {activeTab === 'diff' && currentExpectedOutput && (
                    <div className="space-y-3">
                      <div className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-semibold ${
                        isMatch
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        {isMatch ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        <span>{isMatch ? 'Exact Match with Expected Output!' : 'Output Mismatch Detected'}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Your Program Output:
                          </span>
                          <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{actualNormalized || '(empty)'}</pre>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Expected Output:
                          </span>
                          <pre className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap">{expectedNormalized}</pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Diagnostics Profile Tab */}
                  {activeTab === 'profile' && (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Status ID</span>
                          <span className="font-bold">{debugResult.status.id}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Status Description</span>
                          <span className="font-bold">{debugResult.status.description}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Time</span>
                          <span className="font-bold">{debugResult.time || '0'}s</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Memory</span>
                          <span className="font-bold">{debugResult.memory || 0} KB</span>
                        </div>
                      </div>
                      {debugResult.message && (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                          <strong>Execution Note:</strong> {debugResult.message}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-300 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <FileCode2 size={13} className="text-amber-500" />
            <span>Monaco Buffer ({code.length} chars)</span>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
