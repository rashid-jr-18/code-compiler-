'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@/store/editorStore';
import { useQuestionStore } from '@/store/questionStore';
import { Question, TestResult, SubmissionResult, ExecutionResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTheme } from '@/components/ThemeProvider';
import { getMonacoLanguage, getLanguageById, LANGUAGES } from '@/config/languages';
import { normalizeOutput } from '@/lib/utils';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MemoryStick, 
  Target,
  Code2,
  Zap,
  Settings,
  Bug,
  Lock,
  MessageSquare
} from 'lucide-react';
import ResizableSplitPane from '@/components/ui/ResizableSplitPane';
import { useEditorPreferences } from '@/hooks/useEditorPreferences';
import EditorSettingsModal from '@/components/EditorSettingsModal';
import DebugModal from '@/components/DebugModal';
import { registerMonacoThemes } from '@/lib/monaco-themes';

interface QuestionSolverProps {
  question: Question;
  onBack: () => void;
  onOpenCommunity?: (questionId: string, questionTitle: string) => void;
}

export default function QuestionSolver({ question, onBack, onOpenCommunity }: QuestionSolverProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const { preferences, updatePreference } = useEditorPreferences();

  const {
    selectedLanguage,
    code,
    setCode,
    setSelectedLanguage,
    isLoading,
    setIsLoading
  } = useEditorStore();

  const { addSubmission } = useQuestionStore();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [activeTab, setActiveTab] = useState('description');

  // Determine available languages (if empty array, allow all languages)
  const availableLanguages = (question.supportedLanguages && question.supportedLanguages.length > 0) 
    ? question.supportedLanguages 
    : LANGUAGES.map(lang => lang.id);

  // Initialize with supported language
  useEffect(() => {
    if (!availableLanguages.includes(selectedLanguage.id)) {
      const firstAvailableLanguage = getLanguageById(availableLanguages[0]);
      if (firstAvailableLanguage) {
        setSelectedLanguage(firstAvailableLanguage);
      }
    }
  }, [question.id, availableLanguages, selectedLanguage.id, setSelectedLanguage]);

  // Set default code when question or language changes
  useEffect(() => {
    const defaultCode = getDefaultCodeForQuestion(question, selectedLanguage.id);
    setCode(defaultCode);
  }, [question.id, selectedLanguage.id, setCode]);

  const getDefaultCodeForQuestion = (question: Question, languageId: number): string => {
    const language = getLanguageById(languageId);
    if (!language) return '';

    switch (languageId) {
      case 71: // Python
        if (question.title === 'Two Sum') {
          return `def two_sum(nums, target):
    # Your code here
    pass

# Read input
import json
line1 = input().strip()
line2 = input().strip()
nums = json.loads(line1)
target = int(line2)

# Call function and print result
result = two_sum(nums, target)
print(json.dumps(result))`;
        } else if (question.title === 'Palindrome Number') {
          return `def is_palindrome(x):
    # Your code here
    pass

# Read input
x = int(input().strip())

# Call function and print result
result = is_palindrome(x)
print(str(result).lower())`;
        } else if (question.title === 'Combination Sum') {
          return `import json

def combinationSum(candidates, target):
    # Your code here
    pass

# Read input
candidates = json.loads(input().strip())
target = int(input().strip())

# Call function and print result
result = combinationSum(candidates, target)
print(json.dumps(result))`;
        }
        break;
      case 63: // JavaScript
        if (question.title === 'Two Sum') {
          return `function twoSum(nums, target) {
    // Your code here
}

// Read input
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
const nums = JSON.parse(input[0]);
const target = parseInt(input[1]);

// Call function and print result
const result = twoSum(nums, target);
console.log(JSON.stringify(result));`;
        } else if (question.title === 'Combination Sum') {
          return `function combinationSum(candidates, target) {
    // Your code here
    return [];
}

// Read input
const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
const candidates = JSON.parse(lines[0]);
const target = parseInt(lines[1]);

// Call function and print result
const result = combinationSum(candidates, target);
console.log(JSON.stringify(result));`;
        }
        break;
      case 62: // Java
        if (question.title === 'Two Sum') {
          return `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Read input and solve
    }
}`;
        } else if (question.title === 'Combination Sum') {
          return `import java.util.*;

public class Main {
    public static List<List<Integer>> combinationSum(int[] candidates, int target) {
        // Your code here
        return new ArrayList<>();
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Read input and solve
    }
}`;
        }
        break;
      case 54: // C++
        if (question.title === 'Two Sum') {
          return `#include <iostream>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
    return {};
}

int main() {
    // Read input and solve
    return 0;
}`;
        } else if (question.title === 'Combination Sum') {
          return `#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
    // Your code here
    return {};
}

int main() {
    // Read input and solve
    return 0;
}`;
        }
        break;
    }

    return language.defaultCode;
  };

  const runTestCases = async () => {
    setIsLoading(true);
    setTestResults([]);
    const toastId = toast.loading('Running test cases...');

    try {
      const results: TestResult[] = [];
      let totalScore = 0;
      let maxScore = 0;
      let passedTests = 0;

      for (const testCase of question.testCases) {
        maxScore += testCase.points;

        const response = await fetch('/api/piston/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_code: code,
            language_id: selectedLanguage.id,
            stdin: testCase.input,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to submit code for test case ${testCase.id}`);
        }

        const result: ExecutionResult = await response.json();
        const actualOutput = result.stdout || '';
        const normalizedActual = normalizeOutput(actualOutput);
        const normalizedExpected = normalizeOutput(testCase.expectedOutput);
        const passed = normalizedActual === normalizedExpected && result.status.id === 3;

        if (passed) {
          totalScore += testCase.points;
          passedTests++;
        }

        results.push({
          testCaseId: testCase.id,
          passed,
          actualOutput: actualOutput.trim(),
          expectedOutput: testCase.expectedOutput.trim(),
          executionTime: parseFloat(result.time || '0'),
          memory: result.memory,
          error: result.stderr || result.compile_output || undefined,
          points: passed ? testCase.points : 0,
          maxPoints: testCase.points,
        });
      }

      setTestResults(results);

      const overallStatus = passedTests === results.length ? 'Accepted' : 
                           passedTests > 0 ? 'Partially Accepted' : 'Wrong Answer';

      const submission: SubmissionResult = {
        questionId: question.id,
        languageId: selectedLanguage.id,
        code,
        totalScore,
        maxScore,
        passedTests,
        totalTests: results.length,
        testResults: results,
        overallStatus,
        submittedAt: new Date()
      };
      
      setSubmissionResult(submission);
      addSubmission(submission);
      
      if (overallStatus === 'Accepted') {
        toast.success('🎉 All test cases passed!', { id: toastId });
        setActiveTab('results');
        // Record solved streak
        fetch('/api/users/streak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isSolved: true })
        }).catch(() => {});
      } else {
        toast.error(`${passedTests}/${results.length} test cases passed`, { id: toastId });
        setActiveTab('results');
        // Record active participation streak
        fetch('/api/users/streak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isSolved: false })
        }).catch(() => {});
      }
      
    } catch (error) {
      toast.error('Failed to run test cases', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Left Panel: Problem Description, Test Cases, Results
  const leftPanel = (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-[700px] overflow-hidden">
      <div className="p-3 border-b border-slate-300 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-200 dark:bg-slate-800 rounded-lg p-1 border border-slate-300/70 dark:border-slate-700">
            <TabsTrigger value="description" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white shadow-xs">
              Description
            </TabsTrigger>
            <TabsTrigger value="testcases" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white shadow-xs">
              Test Cases
            </TabsTrigger>
            <TabsTrigger value="results" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white shadow-xs">
              Results {submissionResult && `(${submissionResult.passedTests}/${submissionResult.totalTests})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'description' && (
          <div className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                {question.description}
              </div>
            </div>
            
            {/* Display separate Sample Input/Output only if description does not already include example blocks */}
            {(!question.description?.toLowerCase().includes('example') && (question.sampleInput || question.sampleOutput)) && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                {question.sampleInput && (
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Sample Input:</h4>
                    <pre className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200">{question.sampleInput}</pre>
                  </div>
                )}
                
                {question.sampleOutput && (
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Sample Output:</h4>
                    <pre className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200">{question.sampleOutput}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'testcases' && (
          <div className="space-y-4">
            {/* Points & Test Cases Overview Header */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Target size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>Evaluation Test Suite (100 Points Total)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  2 Public Sample Cases (40 pts) • 2 Hidden Boundary Cases (60 pts)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsDebugOpen(true)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1"
                >
                  <Bug size={12} />
                  <span>Interactive Debugger</span>
                </Button>
              </div>
            </div>

            {/* Test Case Cards */}
            <div className="space-y-3">
              {question.testCases.map((tc, index) => {
                const isHidden = tc.isHidden ?? index >= 2;
                return (
                  <div 
                    key={tc.id || index}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isHidden 
                        ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20' 
                        : 'bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isHidden ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Lock size={11} /> Hidden Case {index + 1}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            Sample Case {index + 1}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {tc.description || (isHidden ? 'Critical Edge / Boundary Case' : 'Standard Case')}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {tc.points} pts
                      </span>
                    </div>

                    {!isHidden ? (
                      <div className="space-y-2 text-xs font-mono">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">Input:</span>
                          <pre className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">{tc.input}</pre>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">Expected Output:</span>
                          <pre className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">{tc.expectedOutput}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-slate-100/80 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Lock size={14} className="text-amber-500" />
                          <span>Input & Output protected to evaluate edge cases, constraint limits, and prevent hardcoding.</span>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Evaluated on Run</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            {submissionResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Evaluation Summary</h4>
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    submissionResult.overallStatus === 'Accepted' 
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  }`}>
                    {submissionResult.overallStatus}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-300 dark:border-slate-700">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{submissionResult.passedTests} / {submissionResult.totalTests}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Tests Passed</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-300 dark:border-slate-700">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{submissionResult.totalScore} / {submissionResult.maxScore}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Score (pts)</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-300 dark:border-slate-700">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round((submissionResult.totalScore / (submissionResult.maxScore || 1)) * 100)}%
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Accuracy</div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  {testResults.map((result, index) => {
                    const matchedTc = question.testCases[index];
                    const isHidden = matchedTc?.isHidden ?? index >= 2;

                    return (
                      <div key={result.testCaseId} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-300 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {result.passed ? (
                              <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={16} />
                            ) : (
                              <XCircle className="text-rose-600 dark:text-rose-400" size={16} />
                            )}
                            <span className="text-slate-900 dark:text-white font-semibold text-xs">
                              {isHidden ? `🔒 Hidden Test Case ${index + 1} (Critical Boundary Condition)` : `Sample Test Case ${index + 1}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`font-bold ${result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {result.points}/{result.maxPoints} pts
                            </span>
                            {result.executionTime && (
                              <span className="text-slate-400">{result.executionTime.toFixed(3)}s</span>
                            )}
                          </div>
                        </div>

                        {!isHidden ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Your Output:</span>
                              <span className={result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {result.actualOutput || '(empty)'}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected Output:</span>
                              <span className="text-slate-700 dark:text-slate-300">{result.expectedOutput}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic flex items-center justify-between px-1">
                            <span>{result.passed ? 'Passed hidden evaluation test.' : 'Failed critical boundary/edge test.'}</span>
                            <button
                              onClick={() => setIsDebugOpen(true)}
                              className="text-amber-600 dark:text-amber-400 not-italic font-semibold hover:underline flex items-center gap-1"
                            >
                              <Bug size={11} /> Debug Case
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Target size={44} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No results yet</p>
                <p className="text-xs">Click &quot;Run Tests&quot; to evaluate against all 4 test cases (100 pts).</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Right Panel: Solution Editor & Action Controls
  const rightPanel = (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-[700px] overflow-hidden">
      {/* Editor Header Bar */}
      <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Code2 size={16} className="text-blue-600 dark:text-blue-400" />
          <span>Solution</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={runTestCases}
            disabled={isLoading}
            variant="success"
            size="sm"
            className="h-9 px-3.5 text-xs flex items-center gap-1.5 font-semibold cursor-pointer shadow-xs text-white"
          >
            {isLoading ? (
              <>
                <Zap size={13} className="animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>Run</span>
              </>
            )}
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
            supportedLanguages={availableLanguages}
            className="w-44"
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

      {/* Monaco Editor Container */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getMonacoLanguage(selectedLanguage.id)}
          value={code}
          onChange={value => setCode(value || '')}
          beforeMount={registerMonacoThemes}
          theme={preferences.colorTheme || (resolvedTheme === 'dark' ? 'vs-dark' : 'vs')}
          options={{
            minimap: { enabled: false },
            fontSize: preferences.fontSize,
            wordWrap: preferences.wordWrap,
            quickSuggestions: !preferences.disableAutocomplete,
            suggestOnTriggerCharacters: !preferences.disableAutocomplete,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
          }}
        />
      </div>

      {/* Bottom Action Footer */}
      <div className="px-4 py-3 bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-300 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock size={13} />
            <span>Time: {question.timeLimit}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MemoryStick size={13} />
            <span>Memory: {question.memoryLimit}MB</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsDebugOpen(true)}
            variant="debug"
            className="flex items-center gap-1.5 font-semibold px-4 py-2 text-xs cursor-pointer shadow-xs text-white"
          >
            <Bug size={14} />
            <span>Debug</span>
          </Button>

          <Button
            onClick={runTestCases}
            disabled={isLoading}
            variant="success"
            className="flex items-center gap-2 text-white shadow-sm font-semibold px-5 py-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Zap size={15} className="animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                <span>Run Tests</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top Navigation & Action Header (LeetCode Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{question.title}</h1>
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
              question.difficulty === 'Easy' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
              question.difficulty === 'Medium' ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' :
              'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
            }`}>
              {question.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              {question.category}
            </span>
          </div>
        </div>

        {/* Top Run & Debug Buttons (LeetCode Header Style) */}
        <div className="flex items-center gap-2">
          {onOpenCommunity && (
            <Button
              onClick={() => onOpenCommunity(question.id, question.title)}
              variant="outline"
              className="flex items-center gap-1.5 font-semibold px-3 text-xs h-9 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Discuss</span>
            </Button>
          )}

          <Button
            onClick={() => setIsDebugOpen(true)}
            variant="debug"
            className="flex items-center gap-1.5 text-white shadow-sm font-semibold px-3.5 text-xs h-9 cursor-pointer"
          >
            <Bug size={14} />
            <span>Debug</span>
          </Button>

          <Button
            onClick={runTestCases}
            disabled={isLoading}
            variant="success"
            className="flex items-center gap-2 text-white shadow-sm font-semibold px-4 text-xs h-9 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Zap size={14} className="animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>Run Tests</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* LeetCode-style Resizable Split Pane (Adjustable Left / Right width) */}
      <ResizableSplitPane
        left={leftPanel}
        right={rightPanel}
        initialLeftPercent={45}
        minLeftPercent={25}
        maxLeftPercent={75}
        storageKey="edutech_split_ratio_questionsolver"
      />

      {/* Settings Modal */}
      <EditorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={updatePreference}
        resolvedTheme={resolvedTheme}
        setSystemTheme={setTheme}
      />

      {/* Interactive Code Debugger Modal */}
      <DebugModal
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        code={code}
        languageId={selectedLanguage.id}
        testCases={question.testCases}
        defaultStdin={question.sampleInput}
        problemTitle={question.title}
      />
    </div>
  );
}
