'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment, Question, Language } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTheme } from '@/components/ThemeProvider';
import { getMonacoLanguage, LANGUAGES, getLanguageById } from '@/config/languages';
import { 
  ArrowLeft, 
  Play, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Code2, 
  Award, 
  ShieldCheck, 
  Clock, 
  MemoryStick,
  Settings,
  Globe,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditorPreferences } from '@/hooks/useEditorPreferences';
import EditorSettingsModal from '@/components/EditorSettingsModal';
import { registerMonacoThemes } from '@/lib/monaco-themes';
import WebPreview from '@/components/WebPreview';
import SqlResultTable from '@/components/SqlResultTable';

interface LearnerAssignmentSolverProps {
  assignment: Assignment;
  learnerId: string;
  onBack: () => void;
}

export default function LearnerAssignmentSolver({
  assignment,
  learnerId,
  onBack
}: LearnerAssignmentSolverProps) {
  const { resolvedTheme } = useTheme();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
  const question = currentAssignmentQuestion?.question;

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
    const input = fs.readFileSync(0, 'utf-8').trim();
    // Process input and output result
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
      font-family: system-ui, -apple-system, sans-serif;
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

  // Sync selected language when question changes if question restricts languages
  useEffect(() => {
    if (question?.supportedLanguages && question.supportedLanguages.length > 0) {
      if (!question.supportedLanguages.includes(selectedLanguage.id)) {
        const fallbackLang = getLanguageById(question.supportedLanguages[0]);
        if (fallbackLang) {
          setSelectedLanguage(fallbackLang);
        }
      }
    }
  }, [question, selectedLanguage.id]);

  useEffect(() => {
    if (question?.sampleInput) {
      setSampleInput(question.sampleInput);
    }
    // Set clean problem-focused starter code (no confusing example boilerplate)
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
      toast.success('Run complete!', { id: toastId });
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

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={15} /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {assignment.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assessment • Total Marks: {assignment.maxPoints} pts
            </p>
          </div>
        </div>

        {/* Multi-Problem Selector */}
        {assignment.questions && assignment.questions.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Problem:</span>
            {assignment.questions.map((aq, idx) => (
              <button
                key={aq.id || idx}
                onClick={() => setActiveQuestionIndex(idx)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeQuestionIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                P{idx + 1}: {aq.question?.title || `Problem ${idx + 1}`} ({aq.points} pts)
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Solver Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Problem & Instructions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-sm max-h-[700px] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {question?.title || 'Problem Description'}
                </h2>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {question?.difficulty || 'Medium'} • {currentAssignmentQuestion?.points || 10} pts
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1"><Clock size={13} /> Time: {question?.timeLimit || 5}s</span>
                <span className="flex items-center gap-1"><MemoryStick size={13} /> Memory: {question?.memoryLimit || 128}MB</span>
              </div>
            </div>

            <div className="prose dark:prose-invert text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
              {question?.description}
            </div>

            {question?.sampleInput && (
              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sample Input
                </label>
                <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                  {question.sampleInput}
                </pre>
              </div>
            )}

            {question?.sampleOutput && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sample Expected Output
                </label>
                <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                  {question.sampleOutput}
                </pre>
              </div>
            )}

            {/* Authoritative Submission Result Card */}
            {submissionFeedback && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
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

                {/* Important LMS notification banner */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Submission Saved Locally:</strong> Your score is securely recorded. Your faculty instructor will review and export the grade to Brightspace Gradebook.
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Output */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="text-blue-600 dark:text-blue-400" /> Solution Editor
              </h3>
              <LanguageSwitcher
                className="w-56"
                supportedLanguages={question?.supportedLanguages}
                selectedLanguage={selectedLanguage}
                onLanguageSelect={setSelectedLanguage}
              />
              <div className="flex items-center gap-2">
                <LanguageSwitcher
                  className="w-56"
                  supportedLanguages={question?.supportedLanguages}
                  selectedLanguage={selectedLanguage}
                  onLanguageSelect={setSelectedLanguage}
                />
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  title="Editor Settings"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-inner">
              <Editor
                height="340px"
                language={getMonacoLanguage(selectedLanguage.id)}
                value={code}
                onChange={value => setCode(value || '')}
                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
                beforeMount={registerMonacoThemes}
                theme={preferences.colorTheme || (resolvedTheme === 'dark' ? 'vs-dark' : 'vs')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
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

            {/* Run / Submit Action Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                onClick={handleRunSample}
                disabled={isRunning || isSubmitting}
                variant="outline"
                className="border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
              >
                {isRunning ? <Zap className="animate-spin" size={15} /> : <Play size={15} />}
                <span>Run Sample</span>
                <span>{selectedLanguage.id === 100 || selectedLanguage.extension === 'html' ? 'Update Preview' : selectedLanguage.id === 82 || selectedLanguage.extension === 'sql' ? 'Run SQL Query' : 'Run Sample'}</span>
              </Button>

              <Button
                onClick={handleSubmitAuthoritative}
                disabled={isRunning || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 px-6 shadow-sm"
              >
                {isSubmitting ? <Zap className="animate-spin" size={15} /> : <Send size={15} />}
                <span>Submit Assessment</span>
              </Button>
            </div>

            {/* Run Sample Output Drawer */}
            {runOutput && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2 max-h-48 overflow-y-auto shadow-inner transition-colors"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                  <span className="font-semibold">Execution Output: {runOutput.status}</span>
            {/* Adaptive Output Modes */}
            {selectedLanguage.id === 100 || selectedLanguage.extension === 'html' ? (
              <div className="mt-4">
                <WebPreview htmlCode={code} />
              </div>
            ) : selectedLanguage.id === 82 || selectedLanguage.extension === 'sql' ? (
              runOutput && (
                <div className="mt-4">
                  <SqlResultTable output={runOutput.stdout} error={runOutput.stderr} isLoading={isRunning} />
                </div>
                {runOutput.stdout && <pre className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap font-mono">{runOutput.stdout}</pre>}
                {runOutput.stderr && <pre className="text-rose-700 dark:text-rose-400 whitespace-pre-wrap font-mono">{runOutput.stderr}</pre>}
                {!runOutput.stdout && !runOutput.stderr && <span className="text-slate-400 dark:text-slate-500">Program produced no output.</span>}
              </motion.div>
              )
            ) : (
              /* Run Sample Output Drawer */
              runOutput && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2 max-h-48 overflow-y-auto shadow-inner transition-colors"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="font-semibold">Execution Output: {runOutput.status}</span>
                  </div>
                  {runOutput.stdout && <pre className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap font-mono">{runOutput.stdout}</pre>}
                  {runOutput.stderr && <pre className="text-rose-700 dark:text-rose-400 whitespace-pre-wrap font-mono">{runOutput.stderr}</pre>}
                  {!runOutput.stdout && !runOutput.stderr && <span className="text-slate-400 dark:text-slate-500">Program produced no output.</span>}
                </motion.div>
              )
            )}
          </div>
        </div>
      </div>

      <EditorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={updatePreference}
        resolvedTheme={resolvedTheme}
        setSystemTheme={setTheme}
      />
    </div>
  );
}

