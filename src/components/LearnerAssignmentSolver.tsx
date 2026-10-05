'use client';

import { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle
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
}

export default function LearnerAssignmentSolver({
  assignment,
  learnerId,
  onBack,
  onOpenCommunity
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
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    score: number;
    maxScore: number;
    passedTests: number;
    totalTests: number;
    overallStatus: string;
    testResults: Array<{ passed: boolean; points: number; maxPoints: number; isHidden: boolean }>;
  } | null>(null);

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
      toast.success(isWebMode ? 'Preview updated!' : 'Run complete!', { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Execution failed', { id: toastId });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitAuthoritative = async () => {
    if (!question) return;

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
          questionId: question.id,
          sourceCode: code,
          languageId: selectedLanguage.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSubmissionFeedback(data.result);
      toast.success('Submitted successfully! Score stored locally.', { id: toastId });

      // Record Streak for this learner
      const isFullScore = data.result?.score != null && data.result?.maxScore != null && data.result.score >= data.result.maxScore;
      fetch('/api/users/streak', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': learnerId,
          'x-user-role': 'LEARNER'
        },
        body: JSON.stringify({ isSolved: isFullScore })
      }).catch(() => {});

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

  const handleLimitExceeded = useCallback(() => {
    setIsLimitReached(true);
    setIsViolationModalOpen(true);

    if (proctoringConfig?.actionOnLimit === 'AUTO_SUBMIT') {
      toast.error('Maximum security violation limit reached (3/3)! Exam auto-submitting...', {
        duration: 8000
      });
      // 1.5s delay so the learner clearly sees the Auto-Submit modal before submission completes
      setTimeout(() => {
        handleSubmitAuthoritative();
      }, 1500);
    } else if (proctoringConfig?.actionOnLimit === 'FLAG_REVIEW') {
      toast.error('Violation limit exceeded! Your exam attempt has been flagged for faculty review.', {
        duration: 6000
      });
    }
  }, [proctoringConfig?.actionOnLimit]);

  const handleAcknowledgeViolation = async () => {
    setIsViolationModalOpen(false);
    if (proctoringConfig?.enableKiosk) {
      await enterFullscreen();
    }
  };

  const { violationCount, enterFullscreen } = useKioskMode({
    enabled: proctoringConfig?.enableKiosk || false,
    isActive: isPreCheckDone,
    violationLimit: proctoringConfig?.violationLimit || 3,
    onViolation: handleViolation,
    onLimitExceeded: handleLimitExceeded
  });

  const handleConsentAndStart = async () => {
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

  // Left Panel (Description, Constraints, Sample Inputs, Scores)
  const leftPanel = (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm h-[720px] overflow-y-auto p-6 space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {question?.title || 'Problem Description'}
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            {question?.difficulty || 'Medium'} • {currentAssignmentQuestion?.points || 10} pts
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
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
          className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Submission Score</h3>
            </div>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {submissionFeedback.score} / {submissionFeedback.maxScore} pts
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
  );

  // Right Panel (Solution Editor + Adaptive Output)
  const rightPanel = (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm h-[720px] flex flex-col overflow-hidden">
      {/* Editor Header Bar */}
      <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Code2 size={16} className="text-blue-600 dark:text-blue-400" /> Solution Editor
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunSample}
            disabled={isRunning || isSubmitting}
            variant="success"
            size="sm"
            className="h-9 px-3.5 text-xs flex items-center gap-1.5 font-semibold cursor-pointer shadow-xs text-white"
          >
            {isRunning ? <Zap className="animate-spin" size={13} /> : <Play size={13} fill="currentColor" />}
            <span>Run</span>
          </Button>

          <Button
            onClick={() => setIsDebugOpen(true)}
            variant="debug"
            size="sm"
            className="h-9 px-3.5 text-xs flex items-center gap-1.5 font-semibold cursor-pointer shadow-xs text-white"
          >
            <Bug size={13} />
            <span>Debug</span>
          </Button>
          <LanguageSwitcher
            className="w-48"
            supportedLanguages={allowedLanguages || question?.supportedLanguages}
            selectedLanguage={selectedLanguage}
            onLanguageSelect={setSelectedLanguage}
          />
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Editor Settings"
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
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

      {/* Action Footer */}
      <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-300 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsDebugOpen(true)}
            variant="debug"
            size="sm"
            className="flex items-center gap-1.5 font-medium cursor-pointer text-white"
          >
            <Bug size={14} />
            <span>Debug</span>
          </Button>

          <Button
            onClick={handleRunSample}
            disabled={isRunning || isSubmitting}
            variant="success"
            size="sm"
            className="flex items-center gap-1.5 font-medium cursor-pointer"
          >
            {isRunning ? <Zap className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
            <span>Run</span>
          </Button>
        </div>

        <Button
          onClick={handleSubmitAuthoritative}
          disabled={isRunning || isSubmitting}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 px-5 shadow-sm"
        >
          {isSubmitting ? <Zap className="animate-spin" size={14} /> : <Send size={14} />}
          <span>Submit Assessment</span>
        </Button>
      </div>

      {/* Adaptive Output Modes */}
      {isWebMode ? (
        <div className="p-3 border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 flex-1 max-h-60 overflow-hidden">
          <WebPreview htmlCode={code} />
        </div>
      ) : isSqlMode ? (
        runOutput && (
          <div className="p-3 border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 flex-1 max-h-60 overflow-hidden">
            <SqlResultTable output={runOutput.stdout} error={runOutput.stderr} isLoading={isRunning} />
          </div>
        )
      ) : (
        /* Run Sample Output Drawer */
        runOutput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 border-t border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 border-b border-slate-300 dark:border-slate-800 pb-1">
              <span className="font-semibold">Output: {runOutput.status}</span>
            </div>
            {runOutput.stdout && <pre className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap font-mono">{runOutput.stdout}</pre>}
            {runOutput.stderr && <pre className="text-rose-700 dark:text-rose-400 whitespace-pre-wrap font-mono">{runOutput.stderr}</pre>}
            {!runOutput.stdout && !runOutput.stderr && <span className="text-slate-400 dark:text-slate-500">Program produced no output.</span>}
          </motion.div>
        )
      )}
    </div>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
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
        {isSecurityEnabled && (
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        )}

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

          {/* Top Run & Debug Buttons */}
          {onOpenCommunity && question && (
            <Button
              onClick={() => onOpenCommunity(question.id, question.title)}
              variant="outline"
              size="sm"
              className="h-9 flex items-center gap-1.5 px-3 text-xs shadow-xs font-semibold cursor-pointer border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <MessageSquare size={13} />
              <span>Discuss</span>
            </Button>
          )}

          <Button
            onClick={() => setIsDebugOpen(true)}
            variant="debug"
            size="sm"
            className="h-9 flex items-center gap-1.5 px-3.5 text-xs shadow-xs font-semibold cursor-pointer text-white"
          >
            <Bug size={13} />
            <span>Debug</span>
          </Button>

          <Button
            onClick={handleRunSample}
            disabled={isRunning || isSubmitting}
            variant="success"
            size="sm"
            className="h-9 flex items-center gap-1.5 px-3.5 text-xs shadow-xs font-semibold cursor-pointer"
          >
            {isRunning ? <Zap className="animate-spin" size={13} /> : <Play size={13} fill="currentColor" />}
            <span>Run</span>
          </Button>
        </div>
      </div>

      {/* LeetCode-style Resizable Split Pane */}
      <ResizableSplitPane
        left={leftPanel}
        right={rightPanel}
        initialLeftPercent={45}
        minLeftPercent={25}
        maxLeftPercent={75}
        storageKey="edutech_split_ratio_learner"
      />

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
        />
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
        onAcknowledgeAndReturn={handleAcknowledgeViolation}
      />
    </div>
  );
}
