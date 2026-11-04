'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Assignment, Language, ProctoringEventType, Question } from '@/types';
import { sampleQuestions } from '@/store/questionStore';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTheme } from '@/components/ThemeProvider';
import { getMonacoLanguage, LANGUAGES, getLanguageById } from '@/config/languages';
import { 
  ArrowLeft, 
  Play, 
  Send, 
  Zap, 
  Code2, 
  Award, 
  ShieldCheck, 
  Clock, 
  MemoryStick,
  Settings,
  Bug,
  MessageSquare,
  Lock,
  Camera,
  AlertTriangle,
  CheckCircle,
  Eye,
  Columns,
  Terminal,
  ChevronDown,
  ChevronUp,
  Trash2,
  LogOut,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditorPreferences, getEffectiveEditorTheme } from '@/hooks/useEditorPreferences';
import EditorSettingsModal from '@/components/EditorSettingsModal';
import DebugModal from '@/components/DebugModal';
import { registerMonacoThemes } from '@/lib/monaco-themes';
import WebPreview from '@/components/WebPreview';
import SqlResultTable from '@/components/SqlResultTable';
import ResizableSplitPane from '@/components/ui/ResizableSplitPane';
import { useCameraProctoring } from '@/hooks/useCameraProctoring';
import { useKioskMode } from '@/hooks/useKioskMode';
import ProctoringPreCheckModal from '@/components/ProctoringPreCheckModal';
import FloatingCameraWidget from '@/components/FloatingCameraWidget';
import ViolationWarningModal from '@/components/ViolationWarningModal';

interface LearnerAssignmentSolverProps {
  assignment: Assignment;
  learnerId: string;
  onBack: () => void;
  onOpenCommunity?: (questionId: string, questionTitle: string) => void;
  isDirectLaunch?: boolean;
}

export default function LearnerAssignmentSolver({
  assignment,
  learnerId,
  onBack,
  onOpenCommunity,
  isDirectLaunch = false
}: LearnerAssignmentSolverProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const { preferences, updatePreference } = useEditorPreferences();

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => getLanguageById(71) || LANGUAGES[0]);
  const [code, setCode] = useState<string>('');
  const [sampleInput, setSampleInput] = useState<string>('');
  const [runOutput, setRunOutput] = useState<{ stdout?: string | null; stderr?: string | null; status?: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    score: number;
    totalScore?: number;
    maxScore: number;
    passedTests: number;
    totalTests: number;
    overallStatus: string;
    testResults?: Array<{ passed: boolean; points: number; maxPoints: number; isHidden: boolean }>;
  } | null>(null);
  const [showReviewMode, setShowReviewMode] = useState(false);
  const [webModeView, setWebModeView] = useState<'code' | 'preview' | 'split'>('code');
  const [isOutputDrawerOpen, setIsOutputDrawerOpen] = useState(false);
  const [solverPaneMode, setSolverPaneMode] = useState<'split' | 'left' | 'right'>('split');

  const currentAssignmentQuestion = assignment.questions?.[activeQuestionIndex];

  // Robust Question Resolver: ensures title & full description always load
  const [resolvedQuestion, setResolvedQuestion] = useState<Question | undefined>(() => {
    if (currentAssignmentQuestion?.question) return currentAssignmentQuestion.question;
    const qId = currentAssignmentQuestion?.questionId;
    if (!qId) return undefined;
    return sampleQuestions.find(sq => sq.id === qId || `q_${sq.id}` === qId || sq.id === qId.replace(/^q_/, ''));
  });

  useEffect(() => {
    if (currentAssignmentQuestion?.question) {
      setResolvedQuestion(currentAssignmentQuestion.question);
    } else if (currentAssignmentQuestion?.questionId) {
      const qId = currentAssignmentQuestion.questionId;
      const stripped = qId.replace(/^q_/, '');
      const found = sampleQuestions.find(sq => sq.id === qId || sq.id === stripped || `q_${sq.id}` === qId);
      if (found) {
        setResolvedQuestion(found);
      } else {
        fetch(`/api/questions/${qId}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setResolvedQuestion(data); })
          .catch(() => {});
      }
    }
  }, [currentAssignmentQuestion, activeQuestionIndex]);

  const question = resolvedQuestion || currentAssignmentQuestion?.question;
  const allowedLanguages = currentAssignmentQuestion?.allowedLanguages || question?.supportedLanguages;

  const isWebMode = selectedLanguage.id === 100 || selectedLanguage.extension === 'html';
  const isSqlMode = selectedLanguage.id === 82 || selectedLanguage.extension === 'sql';

  const getStarterCodeForAssignment = (questionTitle: string | undefined, languageId: number): string => {
    const title = questionTitle?.toLowerCase() || '';

    // Python (71)
    if (languageId === 71) {
      if (title.includes('two sum')) {
        return `def two_sum(nums, target):
    # Write your solution here
    pass

# Read input
import json
try:
    nums = json.loads(input().strip())
    target = int(input().strip())
    result = two_sum(nums, target)
    print(json.dumps(result))
except Exception:
    pass
`;
      }
      if (title.includes('palindrome')) {
        return `def is_palindrome(x):
    # Write your solution here
    pass

try:
    x = int(input().strip())
    print(str(is_palindrome(x)).lower())
except Exception:
    pass
`;
      }
      return `# Write your Python solution below
import sys

def solve():
    # Read input from stdin and write output to stdout
    pass

if __name__ == '__main__':
    solve()
`;
    }

    // JavaScript (Node.js) (63)
    if (languageId === 63) {
      if (title.includes('two sum')) {
        return `function twoSum(nums, target) {
    // Write your solution here
    return [];
}

const fs = require('fs');
try {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length >= 2) {
        const nums = JSON.parse(lines[0]);
        const target = parseInt(lines[1]);
        console.log(JSON.stringify(twoSum(nums, target)));
    }
} catch (e) {}
`;
      }
      if (title.includes('palindrome')) {
        return `function isPalindrome(x) {
    // Write your solution here
    return false;
}

const fs = require('fs');
try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (input) {
        console.log(isPalindrome(parseInt(input)));
    }
} catch (e) {}
`;
      }
      return `// Write your JavaScript solution below
const fs = require('fs');

function solve() {
    // Read input from stdin and write output to stdout
}

solve();
`;
    }

    // TypeScript (74)
    if (languageId === 74) {
      return `// Write your TypeScript solution below
function solve(): void {
    // Read input from stdin and write output to stdout
}

solve();
`;
    }

    // Java (62)
    if (languageId === 62) {
      return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
    }
}
`;
    }

    // C++ (54)
    if (languageId === 54) {
      return `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`;
    }

    // C (50)
    if (languageId === 50) {
      return `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`;
    }

    // HTML / CSS / JS (100)
    if (languageId === 100) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${questionTitle || 'Interactive Preview'}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 1.5rem;
      background: #f8fafc;
      color: #0f172a;
    }
    .container {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      max-width: 480px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>${questionTitle || 'Solution'}</h2>
    <p>Build your UI implementation here.</p>
  </div>

  <script>
    console.log('Solution loaded.');
  </script>
</body>
</html>
`;
    }

    // SQL (82)
    if (languageId === 82) {
      return `-- SQL Solution for: ${questionTitle || 'Database Query'}
SELECT * FROM table_name;
`;
    }

    const lang = getLanguageById(languageId);
    return lang?.defaultCode || `// Write your solution here\n`;
  };

  // Sync selected language when question changes if question or assignment restricts languages
  useEffect(() => {
    if (allowedLanguages && allowedLanguages.length > 0) {
      if (!allowedLanguages.includes(selectedLanguage.id)) {
        const fallbackLang = getLanguageById(allowedLanguages[0]);
        if (fallbackLang) {
          setSelectedLanguage(fallbackLang);
        }
      }
    }
  }, [allowedLanguages, selectedLanguage.id]);

  useEffect(() => {
    if (question?.sampleInput) {
      setSampleInput(question.sampleInput);
    }
    const starter = getStarterCodeForAssignment(question?.title, selectedLanguage?.id || 71);
    setCode(starter);
    setRunOutput(null);
    setSubmissionFeedback(null);
  }, [activeQuestionIndex, question, selectedLanguage]);

  const handleRunSample = async () => {
    setIsRunning(true);
    setRunOutput(null);
    const toastId = toast.loading('Running sample test...');

    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode: code,
          languageId: selectedLanguage.id,
          stdin: sampleInput
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      setRunOutput(data);
      if (isWebMode) {
        setWebModeView('preview');
      } else {
        setIsOutputDrawerOpen(true);
      }
      toast.success(isWebMode ? 'Preview updated!' : 'Run complete!', { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Execution failed', { id: toastId });
    } finally {
      setIsRunning(false);
    }
  };

  // Refs to avoid stale closures in timeouts and kiosk callbacks
  const codeRef = useRef(code);
  codeRef.current = code;

  const questionRef = useRef(question);
  questionRef.current = question;

  const selectedLanguageRef = useRef(selectedLanguage);
  selectedLanguageRef.current = selectedLanguage;

  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;

  const handleSubmitAuthoritative = async () => {
    const curQ = questionRef.current;
    if (!curQ || isSubmittingRef.current) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Evaluating authoritative test cases...');

    try {
      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': learnerId,
          'x-user-role': 'LEARNER'
        },
        body: JSON.stringify({
          questionId: curQ.id,
          sourceCode: codeRef.current,
          languageId: selectedLanguageRef.current.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      const resultScore = data.result?.score ?? data.result?.totalScore ?? 0;
      const resultMax = data.result?.maxScore ?? assignment.maxPoints ?? 100;
      setLatestScore(resultScore);
      setSubmissionFeedback({
        ...data.result,
        score: resultScore,
        maxScore: resultMax
      });
      toast.success('Submitted successfully! Score stored locally.', { id: toastId });

      // Clean up proctoring & exit fullscreen once submitted
      stopCamera();
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Record Streak for this learner
      const isFullScore = resultScore >= resultMax && resultMax > 0;
      fetch('/api/users/streak', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': learnerId,
          'x-user-role': 'LEARNER'
        },
        body: JSON.stringify({ isSolved: isFullScore })
      }).catch(() => {});

      // Clear timed exam state on successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`exam_start_${assignment.id}_${learnerId}`);
      }

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Proctoring & Kiosk Security Logic
  const proctoringConfig = assignment.proctoringConfig;
  const isSecurityEnabled = Boolean(
    proctoringConfig && (proctoringConfig.enableCamera || proctoringConfig.enableKiosk)
  );
  const [isPreCheckDone, setIsPreCheckDone] = useState(!isSecurityEnabled);

  // Timed Assessment Logic
  const isTimed = Boolean(assignment.durationMinutes && assignment.durationMinutes > 0);
  const durationSeconds = (assignment.durationMinutes || 0) * 60;
  const timerStorageKey = `exam_start_${assignment.id}_${learnerId}`;

  // Check if exam already started previously
  const [hasStartedExam, setHasStartedExam] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (!isTimed && !isSecurityEnabled) return true;
    return Boolean(localStorage.getItem(timerStorageKey));
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    if (!isTimed) return 0;
    if (typeof window === 'undefined') return durationSeconds;
    const storedStart = localStorage.getItem(timerStorageKey);
    if (!storedStart) return durationSeconds;
    const elapsed = Math.floor((Date.now() - Number(storedStart)) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  });

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimedExam = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(timerStorageKey, Date.now().toString());
    }
    setHasStartedExam(true);
  };

  // Camera Proctoring Hook
  const {
    videoRef,
    stream,
    isStreaming,
    cameraError,
    startCamera,
    stopCamera,
    captureFrame
  } = useCameraProctoring({
    assignmentId: assignment.id,
    learnerId,
    enabled: isPreCheckDone && (proctoringConfig?.enableCamera || false),
    snapshotIntervalSeconds: proctoringConfig?.snapshotIntervalSeconds || 30
  });

  const handleSafeExit = () => {
    setIsViolationModalOpen(false);
    stopCamera();
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onBack();
  };

  // Interactive Violation Warning Modal States
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [lastViolationReason, setLastViolationReason] = useState('');
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Handle recorded violations from Kiosk or camera events
  const handleViolation = useCallback(
    async (eventType: ProctoringEventType, severity: 'WARNING' | 'CRITICAL', message: string) => {
      // Pop open the warning modal for learner attention
      setLastViolationReason(message);
      setIsViolationModalOpen(true);

      const frameBase64 = captureFrame();

      try {
        await fetch('/api/proctoring/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: assignment.id,
            learnerId,
            eventType,
            severity,
            snapshotBase64: frameBase64,
            notes: message
          })
        });
      } catch (err) {
        console.warn('[Proctoring Solver] Violation sync error:', err);
      }
    },
    [assignment.id, learnerId, captureFrame]
  );

  // Automatically execute test evaluation and submission when violation limit reached or time expires
  const triggerAutoSubmit = useCallback(async (reason: string = 'Security violation limit reached (3/3)') => {
    if (isSubmittingRef.current) return;
    const curQ = questionRef.current;
    if (!curQ) return;

    setIsSubmitting(true);
    if (reason.toLowerCase().includes('violation')) {
      setIsLimitReached(true);
      setIsViolationModalOpen(true);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(timerStorageKey);
    }

    // Stop camera and release fullscreen immediately
    stopCamera();
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const toastId = toast.loading(`${reason}. Auto-submitting test...`);

    try {
      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': learnerId,
          'x-user-role': 'LEARNER'
        },
        body: JSON.stringify({
          questionId: curQ.id,
          sourceCode: codeRef.current,
          languageId: selectedLanguageRef.current.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auto-submission failed');

      setSubmissionFeedback(data.result);
      toast.success('Assessment auto-submitted successfully!', { id: toastId });

      // Mark proctoring session as TERMINATED_VIOLATION or COMPLETED
      fetch('/api/proctoring/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          learnerId,
          status: reason.toLowerCase().includes('violation') ? 'TERMINATED_VIOLATION' : 'COMPLETED'
        })
      }).catch(() => {});

    } catch (err: unknown) {
      console.error('Auto submit error:', err);
      toast.error(err instanceof Error ? err.message : 'Auto-submission failed', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }, [assignment.id, learnerId, stopCamera, timerStorageKey]);

  const handleLimitExceeded = useCallback(() => {
    setIsLimitReached(true);
    setIsViolationModalOpen(true);

    toast.error('Maximum security violation limit reached (3/3)! Exam auto-submitting now...', {
      duration: 8000
    });

    // Automatically trigger test submission after a short visual pause
    setTimeout(() => {
      triggerAutoSubmit();
    }, 800);
  }, [triggerAutoSubmit]);

  const handleAcknowledgeViolation = async () => {
    setIsViolationModalOpen(false);
    if (proctoringConfig?.enableKiosk) {
      await enterFullscreen();
    }
  };

  const { violationCount, enterFullscreen } = useKioskMode({
    enabled: proctoringConfig?.enableKiosk || false,
    isActive: isPreCheckDone && !submissionFeedback,
    violationLimit: proctoringConfig?.violationLimit || 3,
    onViolation: handleViolation,
    onLimitExceeded: handleLimitExceeded
  });

  const handleConsentAndStart = async () => {
    if (isTimed && typeof window !== 'undefined') {
      const stored = localStorage.getItem(timerStorageKey);
      if (!stored) {
        localStorage.setItem(timerStorageKey, Date.now().toString());
      }
      setHasStartedExam(true);
    }

    try {
      await fetch('/api/proctoring/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          learnerId,
          consentAcceptedAt: new Date().toISOString()
        })
      });
    } catch (err) {
      console.warn('[PreCheck] Session create error:', err);
    }

    if (proctoringConfig?.enableKiosk) {
      await enterFullscreen();
    }
    setIsPreCheckDone(true);
  };

  // Live Countdown Timer Interval
  const warned5MinRef = useRef(false);
  const warned1MinRef = useRef(false);

  useEffect(() => {
    if (!isTimed || !hasStartedExam || submissionFeedback || isSubmitting) return;

    const interval = setInterval(() => {
      const storedStart = localStorage.getItem(timerStorageKey);
      if (!storedStart) return;

      const elapsed = Math.floor((Date.now() - Number(storedStart)) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeRemaining(remaining);

      // 5-minute warning alert
      if (remaining <= 300 && remaining > 60 && !warned5MinRef.current) {
        warned5MinRef.current = true;
        toast('⚠️ 5 minutes remaining! Finish your code and prepare to submit.', {
          icon: '⏳',
          duration: 6000
        });
      }

      // 1-minute warning alert
      if (remaining <= 60 && remaining > 0 && !warned1MinRef.current) {
        warned1MinRef.current = true;
        toast.error('🚨 1 minute remaining! Final auto-submission will trigger shortly.', {
          duration: 6000
        });
      }

      // Time expired! Auto-submit
      if (remaining === 0) {
        clearInterval(interval);
        toast.error('⏱️ Time has expired! Automatically submitting your solution...', {
          duration: 8000
        });
        triggerAutoSubmit('Exam time limit expired (00:00)');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimed, hasStartedExam, durationSeconds, timerStorageKey, submissionFeedback, isSubmitting, triggerAutoSubmit]);

  // Left Panel (Description, Constraints, Sample Inputs, Scores)
  const leftPanel = (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {question?.title || 'Problem Description'}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shrink-0">
              {question?.difficulty || 'Medium'} • {currentAssignmentQuestion?.points || 10} pts
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            <span className="flex items-center gap-1"><Clock size={13} /> Time: {question?.timeLimit || 5}s</span>
            <span className="flex items-center gap-1"><MemoryStick size={13} /> Memory: {question?.memoryLimit || 128}MB</span>
            {allowedLanguages && allowedLanguages.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Required: {allowedLanguages.map(id => getLanguageById(id)?.name || id).join(', ')}
              </span>
            )}
          </div>
        </div>

        <div className="prose dark:prose-invert text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-3">
          {question?.description}
        </div>

        {/* Display separate Sample Input/Output only if description does not already include example blocks */}
        {(!question?.description?.toLowerCase().includes('example') && (question?.sampleInput || question?.sampleOutput)) && (
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            {question?.sampleInput && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sample Input
                </label>
                <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800">
                  {question.sampleInput}
                </pre>
              </div>
            )}

            {question?.sampleOutput && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sample Expected Output
                </label>
                <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800">
                  {question.sampleOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Authoritative Submission Result Card */}
        {submissionFeedback && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">Submission Score</h3>
              </div>
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {submissionFeedback.score ?? submissionFeedback.totalScore ?? 0} / {submissionFeedback.maxScore} pts
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span>Tests Passed: <strong>{submissionFeedback.passedTests}/{submissionFeedback.totalTests}</strong></span>
              <span>•</span>
              <span>Status: <strong>{submissionFeedback.overallStatus}</strong></span>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>Submission Recorded:</strong> Your score is securely saved. Your instructor can review and export the grade to Brightspace Gradebook.
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  // Right Panel (Solution Editor + Adaptive Output)
  const rightPanel = (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
      {/* Editor Header Bar */}
      <div className="px-3 sm:px-4 py-2 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Code2 size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Editor</span>
          </h3>

          {/* Web Mode Tabs: Code | Live Preview | Split */}
          {isWebMode && (
            <div className="inline-flex items-center p-0.5 bg-slate-200/90 dark:bg-slate-800 rounded-lg text-[11px] font-medium border border-slate-300/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setWebModeView('code')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  webModeView === 'code'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Code2 size={12} />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setWebModeView('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  webModeView === 'preview'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye size={12} />
                <span>Live Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setWebModeView('split')}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  webModeView === 'split'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns size={12} />
                <span>Split</span>
              </button>
            </div>
          )}

          <LanguageSwitcher
            className="w-40 sm:w-44"
            supportedLanguages={allowedLanguages || question?.supportedLanguages}
            selectedLanguage={selectedLanguage}
            onLanguageSelect={setSelectedLanguage}
          />

          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Editor Settings"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <Settings size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            onClick={() => setIsDebugOpen(true)}
            variant="debug"
            size="sm"
            className="h-8 px-2.5 sm:px-3 text-xs flex items-center gap-1 font-semibold cursor-pointer shadow-xs text-white"
          >
            <Bug size={13} />
            <span className="hidden sm:inline">Debug</span>
          </Button>

          <Button
            onClick={handleRunSample}
            disabled={isRunning || isSubmitting}
            variant="success"
            size="sm"
            className="h-8 px-3 text-xs flex items-center gap-1.5 font-semibold cursor-pointer shadow-xs text-white"
          >
            {isRunning ? <Zap className="animate-spin" size={13} /> : <Play size={13} fill="currentColor" />}
            <span>{isWebMode ? 'Preview' : 'Run'}</span>
          </Button>

          <Button
            onClick={handleSubmitAuthoritative}
            disabled={isRunning || isSubmitting}
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 px-3 sm:px-4 text-xs shadow-xs"
          >
            {isSubmitting ? <Zap className="animate-spin" size={13} /> : <Send size={13} />}
            <span>Submit</span>
          </Button>
        </div>
      </div>

      {/* Editor & Web Preview Viewport */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {isWebMode ? (
          <div className="flex-1 flex flex-row w-full h-full min-h-0 overflow-hidden">
            {/* Monaco Editor in Web Mode */}
            <div className={`h-full flex flex-col min-h-0 ${webModeView === 'code' ? 'w-full' : webModeView === 'split' ? 'w-1/2 border-r border-slate-300 dark:border-slate-800' : 'hidden'}`}>
              <Editor
                height="100%"
                language={getMonacoLanguage(selectedLanguage.id)}
                value={code}
                onChange={value => setCode(value || '')}
                beforeMount={registerMonacoThemes}
                theme={getEffectiveEditorTheme(preferences.colorTheme, resolvedTheme)}
                options={{
                  minimap: { enabled: false },
                  fontSize: preferences.fontSize,
                  wordWrap: preferences.wordWrap,
                  quickSuggestions: !preferences.disableAutocomplete,
                  suggestOnTriggerCharacters: !preferences.disableAutocomplete,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                }}
              />
            </div>

            {/* Web Preview in Web Mode */}
            <div className={`h-full flex flex-col min-h-0 ${webModeView === 'preview' ? 'w-full' : webModeView === 'split' ? 'w-1/2' : 'hidden'}`}>
              <WebPreview htmlCode={code} />
            </div>
          </div>
        ) : (
          /* Standard Monaco Editor */
          <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
              height="100%"
              language={getMonacoLanguage(selectedLanguage.id)}
              value={code}
              onChange={value => setCode(value || '')}
              beforeMount={registerMonacoThemes}
              theme={getEffectiveEditorTheme(preferences.colorTheme, resolvedTheme)}
              options={{
                minimap: { enabled: false },
                fontSize: preferences.fontSize,
                wordWrap: preferences.wordWrap,
                quickSuggestions: !preferences.disableAutocomplete,
                suggestOnTriggerCharacters: !preferences.disableAutocomplete,
                lineNumbers: 'on',
                automaticLayout: true,
                fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
              }}
            />
          </div>
        )}

        {/* Collapsible Output / Test Results Drawer (Non-Web mode) */}
        {!isWebMode && (runOutput || isRunning) && (
          <div className={`border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col transition-all duration-200 shrink-0 ${isOutputDrawerOpen ? 'h-48' : 'h-8'}`}>
            <div 
              onClick={() => setIsOutputDrawerOpen(prev => !prev)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 font-semibold">
                <Terminal size={12} className="text-blue-500" />
                <span>Execution Output</span>
                {runOutput && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    runOutput.status === 'Success' || runOutput.status === 'Accepted'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {runOutput.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRunOutput(null);
                  }}
                  className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Clear output"
                >
                  <Trash2 size={12} />
                </button>
                {isOutputDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            </div>

            {isOutputDrawerOpen && (
              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-950">
                {isSqlMode ? (
                  <SqlResultTable output={runOutput?.stdout} error={runOutput?.stderr} isLoading={isRunning} />
                ) : (
                  <>
                    {runOutput?.stdout && (
                      <pre className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap font-mono leading-relaxed">
                        {runOutput.stdout}
                      </pre>
                    )}
                    {runOutput?.stderr && (
                      <pre className="text-rose-700 dark:text-rose-400 whitespace-pre-wrap font-mono leading-relaxed">
                        {runOutput.stderr}
                      </pre>
                    )}
                    {!runOutput?.stdout && !runOutput?.stderr && (
                      <span className="text-slate-400 italic">Program produced no output.</span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const myRecord = assignment.learners?.find(l => l.learnerId === learnerId) || assignment.learners?.[0];
  const isAlreadySubmitted = (myRecord?.status === 'SUBMITTED' || myRecord?.status === 'REVIEWED' || myRecord?.status === 'EXPORTED');
  const isFinished = isAlreadySubmitted || Boolean(submissionFeedback);

  if (isFinished) {
    const finalScore = latestScore ?? submissionFeedback?.score ?? myRecord?.score ?? 0;
    const finalMax = submissionFeedback?.maxScore ?? assignment.maxPoints ?? 100;
    const passed = submissionFeedback?.passedTests ?? (myRecord?.status === 'SUBMITTED' ? (assignment.questions?.length || 1) : 0);
    const total = submissionFeedback?.totalTests ?? (assignment.questions?.length || 1);

    const handleExitCourse = () => {
      if (typeof window !== 'undefined') {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'D2L_EXIT' }, '*');
          }
        } catch {
          // ignore cross-origin restrictions
        }
      }
      onBack();
    };

    return (
      <div className="max-w-xl mx-auto my-10 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={36} />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            Assessment Completed & Locked
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Your assessment &quot;{assignment.title}&quot; is submitted!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your solution and test scores have been securely submitted to your instructor. The examination session is now closed.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-around">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Your Score</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {finalScore} <span className="text-sm font-normal text-slate-400">/ {finalMax} pts</span>
            </p>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</p>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
              SUBMITTED
            </p>
          </div>
          {submissionFeedback && (
            <>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tests Passed</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {passed} / {total}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Exit Assessment */}
        <div className="pt-2 flex items-center justify-center">
          <Button
            onClick={handleExitCourse}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={15} />
            <span>Exit Assessment</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${isDirectLaunch ? 'w-full' : 'max-w-7xl mx-auto'}`}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          {(!isSecurityEnabled || !isPreCheckDone) ? (
            <Button
              onClick={handleSafeExit}
              variant="outline"
              size="sm"
              className="border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={15} /> Back
            </Button>
          ) : submissionFeedback ? (
            <Button
              onClick={handleSafeExit}
              variant="outline"
              size="sm"
              className="border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <ArrowLeft size={15} /> Finish & Return
            </Button>
          ) : null}
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {assignment.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assessment • Total Marks: {assignment.maxPoints} pts
            </p>
          </div>
        </div>

        {/* Security & Proctoring Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {isTimed && hasStartedExam && !submissionFeedback && (
            <div
              className={`px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 text-xs font-mono font-bold shadow-xs ${
                timeRemaining <= 60
                  ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse'
                  : timeRemaining <= 300
                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}
              title="Time remaining for this assessment"
            >
              <Clock size={12} className={timeRemaining <= 300 ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400'} />
              <span>Time Left: {formatTime(timeRemaining)}</span>
            </div>
          )}

          {isSecurityEnabled && (
            <>
              {proctoringConfig?.enableKiosk && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Lock size={12} /> Kiosk Mode
                </span>
              )}
              {proctoringConfig?.enableCamera && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Camera size={12} /> Camera Live
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                  violationCount === 0
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    : violationCount >= (proctoringConfig?.violationLimit || 3)
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                <AlertTriangle size={12} /> Violations: {violationCount} / {proctoringConfig?.violationLimit || 3}
              </span>
            </>
          )}
        </div>

        {/* Multi-Problem Selector & Top Actions */}
        <div className="flex items-center gap-3">
          {assignment.questions && assignment.questions.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Problem:</span>
              {assignment.questions.map((aq, idx) => (
                <button
                  key={aq.id || idx}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`h-9 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center ${
                    activeQuestionIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  P{idx + 1}
                </button>
              ))}
            </div>
          )}

          {onOpenCommunity && question && (
            <Button
              onClick={() => onOpenCommunity(question.id, question.title)}
              variant="outline"
              size="sm"
              className="h-8 flex items-center gap-1.5 px-3 text-xs shadow-xs font-semibold cursor-pointer border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <MessageSquare size={13} />
              <span>Discuss</span>
            </Button>
          )}
        </div>
      </div>

      {/* Resizable Split Pane with Responsive Tabs */}
      <div className="h-[calc(100vh-140px)] min-h-[560px] w-full flex flex-col">
        <ResizableSplitPane
          left={leftPanel}
          right={rightPanel}
          initialLeftPercent={42}
          minLeftPercent={22}
          maxLeftPercent={78}
          storageKey="edutech_split_ratio_learner"
          leftTitle="Problem"
          rightTitle="Solution Editor"
          activeMode={solverPaneMode}
          onModeChange={setSolverPaneMode}
        />
      </div>

      <EditorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={updatePreference}
        resolvedTheme={resolvedTheme}
        setSystemTheme={setTheme}
      />

      <DebugModal
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        code={code}
        languageId={selectedLanguage.id}
        testCases={question?.testCases}
        defaultStdin={question?.sampleInput}
        problemTitle={question?.title}
      />

      {/* Secure Pre-Check Gate Modal */}
      {isSecurityEnabled && proctoringConfig && !isPreCheckDone && (
        <ProctoringPreCheckModal
          isOpen={!isPreCheckDone}
          assignmentTitle={assignment.title}
          config={proctoringConfig}
          videoRef={videoRef}
          isStreaming={isStreaming}
          cameraError={cameraError}
          onStartCamera={startCamera}
          onConsentAndStart={handleConsentAndStart}
          onCancel={onBack}
          durationMinutes={assignment.durationMinutes}
        />
      )}

      {/* Timed Exam Start Gate Modal (When proctoring is not active, but exam has duration) */}
      {isTimed && !hasStartedExam && !isSecurityEnabled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
              <Clock size={24} />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Timed Assessment
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {assignment.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Time Limit: <strong className="text-slate-800 dark:text-slate-200">{assignment.durationMinutes} Minutes</strong> • {assignment.questions?.length || 1} Problem{assignment.questions?.length !== 1 ? 's' : ''} • {assignment.maxPoints} pts
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <span>⏱️</span>
                <span>The countdown timer starts as soon as you click <strong>Start Assessment</strong> and cannot be paused.</span>
              </div>
              <div className="flex items-start gap-2">
                <span>🛑</span>
                <span>When the timer expires (00:00), your code will be automatically evaluated and submitted.</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex-1 h-9 text-xs border-slate-300 dark:border-slate-700"
              >
                Go Back
              </Button>
              <Button
                size="sm"
                onClick={handleStartTimedExam}
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
              >
                Start Assessment ({assignment.durationMinutes} Mins)
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mini Floating Live Webcam Widget */}
      {isSecurityEnabled && proctoringConfig?.enableCamera && isPreCheckDone && (
        <FloatingCameraWidget
          stream={stream}
          isStreaming={isStreaming}
          violationCount={violationCount}
          violationLimit={proctoringConfig.violationLimit || 3}
        />
      )}

      {/* Security Violation Warning & Auto-Submit Modal */}
      <ViolationWarningModal
        isOpen={isViolationModalOpen}
        violationCount={violationCount}
        violationLimit={proctoringConfig?.violationLimit || 3}
        reason={lastViolationReason}
        isLimitReached={isLimitReached}
        isSubmitting={isSubmitting}
        submissionResult={submissionFeedback}
        onAcknowledgeAndReturn={handleAcknowledgeViolation}
        onFinishAndExit={handleSafeExit}
      />
    </div>
  );
}
