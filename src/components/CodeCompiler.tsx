'use client';

import { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast, { Toaster } from 'react-hot-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import { Code2, Play, Terminal, Loader2, Settings, Globe, Database, Eye, Bug } from 'lucide-react';
import { getMonacoLanguage } from '@/config/languages';
import { useEditorPreferences } from '@/hooks/useEditorPreferences';
import EditorSettingsModal from '@/components/EditorSettingsModal';
import DebugModal from '@/components/DebugModal';
import { registerMonacoThemes } from '@/lib/monaco-themes';
import WebPreview from '@/components/WebPreview';
import SqlResultTable from '@/components/SqlResultTable';
import ResizableSplitPane from '@/components/ui/ResizableSplitPane';

export default function CodeCompiler() {
  const { setTheme, resolvedTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const { preferences, updatePreference } = useEditorPreferences();

  const {
    selectedLanguage,
    code,
    input,
    stdout,
    stderr,
    compileOutput,
    isLoading,
    activeTab,
    setCode,
    setInput,
    setStdout,
    setStderr,
    setCompileOutput,
    setActiveTab,
    setIsLoading
  } = useEditorStore();

  const isWebMode = selectedLanguage.id === 100 || selectedLanguage.extension === 'html';
  const isSqlMode = selectedLanguage.id === 82 || selectedLanguage.extension === 'sql';

  const handleRunCode = async () => {
    setIsLoading(true);
    setStdout('');
    setStderr('');
    setCompileOutput('');

    const toastId = toast.loading('Executing code...');

    try {
      const response = await fetch('/api/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLanguage.id,
          stdin: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed with status ${response.status}`);
      }

      const result: ExecutionResult = await response.json();

      setStdout(result.stdout || '');
      setStderr(result.stderr || '');
      setCompileOutput(result.compile_output || '');

      if (result.status.id === 6) {
        toast.error('Compilation failed', { id: toastId });
        setActiveTab('compile');
      } else if (result.status.id !== 3) {
        toast.error('Execution error', { id: toastId });
        setActiveTab('stderr');
      } else {
        toast.success(isWebMode ? 'Preview Updated' : 'Execution completed', { id: toastId });
        setActiveTab('stdout');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setStderr(errorMessage);
      setActiveTab('stderr');
      toast.error(`Execution failed: ${errorMessage}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-300 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {isWebMode ? <Globe size={18} /> : isSqlMode ? <Database size={18} /> : <Terminal size={18} />}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Code Playground
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isWebMode 
                ? 'Interactive live web preview with real-time reload & dev console.' 
                : isSqlMode
                ? 'Structured database query workspace with interactive tabular result viewer.'
                : 'Write, compile, and execute code in real-time .'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="w-52" />

            {/* Top Green Run Button & Debug Button */}
            <Button
              onClick={() => setIsDebugOpen(true)}
              variant="debug"
              className="h-9 px-3.5 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all text-white cursor-pointer shrink-0"
            >
              <Bug size={14} />
              <span>Debug</span>
            </Button>

            <Button
              onClick={handleRunCode}
              disabled={isLoading}
              variant="success"
              className="h-9 px-4 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 text-white cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Run</span>
                </>
              )}
            </Button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Editor Settings"
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Settings size={15} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Main Resizable Split Pane (Draggable Divider) */}
        <ResizableSplitPane
          left={
            <div className="flex flex-col gap-4 h-full pr-0 lg:pr-1">
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-slate-100/90 dark:bg-slate-900/80 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <Code2 size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>Main.{selectedLanguage.extension}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {selectedLanguage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setIsDebugOpen(true)}
                      variant="debug"
                      size="sm"
                      className="text-white font-semibold rounded-lg px-2.5 py-1 shadow-xs flex items-center gap-1 transition-all text-xs h-7 cursor-pointer"
                    >
                      <Bug size={12} />
                      <span>Debug</span>
                    </Button>

                    <Button
                      onClick={handleRunCode}
                      disabled={isLoading}
                      variant="success"
                      size="sm"
                      className="text-white font-semibold rounded-lg px-3 py-1 shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 text-xs h-7 cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Play size={12} fill="currentColor" />
                      )}
                      <span>Run</span>
                    </Button>

                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Settings size={12} />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>

                <div className="h-[460px]">
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
              </div>

              {/* Input (stdin) - only for non-Web languages */}
              {!isWebMode ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                  <label htmlFor="input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Standard Input (stdin)
                  </label>
                  <textarea
                    id="input"
                    rows={3}
                    className="w-full p-3 text-sm font-mono border border-slate-300 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-y"
                    placeholder="Optional input passed to your program..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          }
          right={
            <div className="flex flex-col h-full pl-0 lg:pl-1">
              {isWebMode ? (
                <WebPreview htmlCode={code} />
              ) : isSqlMode ? (
                <SqlResultTable output={stdout} error={stderr} isLoading={isLoading} />
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm p-4 flex flex-col flex-1 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Execution Output
                    </h2>
                  </div>

                  <Tabs
                    value={activeTab}
                    onValueChange={value => setActiveTab(value as 'stdout' | 'stderr' | 'compile')}
                    className="w-full flex-1 flex flex-col"
                  >
                    <TabsList className="grid w-full grid-cols-3 bg-slate-200 dark:bg-slate-800 rounded-lg p-1 mb-3 border border-slate-300/70 dark:border-slate-700">
                      <TabsTrigger
                        value="stdout"
                        className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-colors"
                      >
                        Output
                      </TabsTrigger>
                      <TabsTrigger
                        value="stderr"
                        className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-colors"
                      >
                        Error
                      </TabsTrigger>
                      <TabsTrigger
                        value="compile"
                        className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-colors"
                      >
                        Compiler Log
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 min-h-[500px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg p-4 font-mono text-xs overflow-auto border border-slate-200 dark:border-slate-800 shadow-inner transition-colors">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 gap-2">
                          <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-500" />
                          <span>Executing in Piston sandbox...</span>
                        </div>
                      ) : (
                        <div>
                          {activeTab === 'stdout' && (
                            stdout ? (
                              <pre className="whitespace-pre-wrap text-emerald-700 dark:text-emerald-400 leading-relaxed font-mono">{stdout}</pre>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">No output generated.</span>
                            )
                          )}
                          {activeTab === 'stderr' && (
                            stderr ? (
                              <pre className="whitespace-pre-wrap text-rose-700 dark:text-rose-400 leading-relaxed font-mono">{stderr}</pre>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">No errors reported.</span>
                            )
                          )}
                          {activeTab === 'compile' && (
                            compileOutput ? (
                              <pre className="whitespace-pre-wrap text-amber-700 dark:text-amber-300 leading-relaxed font-mono">{compileOutput}</pre>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">No compiler messages.</span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </Tabs>
                </div>
              )}
            </div>
          }
          initialLeftPercent={56}
          minLeftPercent={30}
          maxLeftPercent={70}
          storageKey="edutech_split_ratio_compiler"
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
          defaultStdin={input}
        />

        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg text-sm font-medium',
            duration: 3000,
          }}
        />
      </div>
    </div>
  );
}
