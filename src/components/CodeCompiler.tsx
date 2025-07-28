'use client';

import { Editor } from '@monaco-editor/react';
import { useEditorStore } from '@/store/editorStore';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import toast, { Toaster } from 'react-hot-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ExecutionResult } from '@/types';

export default function CodeCompiler() {
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

const handleRunCode = async () => {
    setIsLoading(true);
    setStdout('');
    setStderr('');
    setCompileOutput('');
    
    toast.loading('Submitting code...', { id: 'execution' });

    try {
      const response = await fetch('/api/judge0/submissions', {
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
        throw new Error('Failed to submit code');
      }

      const { token } = await response.json();

      // Poll for results
      const pollForResult = async (): Promise<ExecutionResult> => {
        const resultResponse = await fetch(`/api/judge0/submissions/${token}`);
        if (!resultResponse.ok) {
          throw new Error('Failed to get submission result');
        }

        const result: ExecutionResult = await resultResponse.json();

        // If still processing, wait and poll again
        if (result.status.id <= 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return pollForResult();
        }

        return result;
      };

      const result = await pollForResult();

      setStdout(result.stdout || '');
      setStderr(result.stderr || '');
      setCompileOutput(result.compile_output || '');
      
      // Show success toast
      if (result.compile_output) {
        toast.error('Compilation failed', { id: 'execution' });
        setActiveTab('compile');
      } else if (result.stderr) {
        toast.error('Runtime error occurred', { id: 'execution' });
        setActiveTab('stderr');
      } else {
        toast.success('Code executed successfully!', { id: 'execution' });
        setActiveTab('stdout');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setStderr(errorMessage);
      setActiveTab('stderr');
      toast.error(`Execution failed: ${errorMessage}`, { id: 'execution' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6">
        <motion.div className="mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">
              Brightspace Code Compiler
            </h1>
            <ThemeToggle />
          </div>
          <p className="text-muted-foreground">
            Write, compile, and run code in multiple programming languages with ease.
          </p>
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          {/* Editor Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Code Editor</h2>
              <LanguageSwitcher className="w-48" />
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Editor
                height="400px"
                language={
                  selectedLanguage.mime.split('/')[1] ||
                  selectedLanguage.extension
                }
                value={code}
                onChange={value => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="input" className="text-sm font-medium">
                Input (stdin)
              </label>
              <textarea
                id="input"
                className="w-full h-24 p-3 border rounded-lg bg-background text-foreground resize-none shadow-lg"
                placeholder="Enter input for your program..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>

            <Button
              onClick={handleRunCode}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Running...' : 'Run Code'}
            </Button>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Output</h2>
              <div className="text-sm text-muted-foreground">
                {selectedLanguage.name}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stdout' | 'stderr' | 'compile')} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stdout" className="flex items-center gap-2">
                  <span className={`${stdout ? 'text-green-500' : 'text-gray-400'}`}>●</span>
                  Output
                  {stdout && <span className="text-xs bg-green-100 text-green-800 px-1 rounded">●</span>}
                </TabsTrigger>
                <TabsTrigger value="stderr" className="flex items-center gap-2">
                  <span className={`${stderr ? 'text-red-500' : 'text-gray-400'}`}>●</span>
                  Error
                  {stderr && <span className="text-xs bg-red-100 text-red-800 px-1 rounded">●</span>}
                </TabsTrigger>
                <TabsTrigger value="compile" className="flex items-center gap-2">
                  <span className={`${compileOutput ? 'text-yellow-500' : 'text-gray-400'}`}>●</span>
                  Compile
                  {compileOutput && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">●</span>}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="stdout" className="mt-4">
                <div className="border rounded-lg bg-muted/20 p-4 min-h-[400px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <motion.div className="text-muted-foreground" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                        Running code...
                      </motion.div>
                    </div>
                  ) : stdout ? (
                    <motion.div className="whitespace-pre-wrap font-mono text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      {stdout}
                    </motion.div>
                  ) : (
                    <motion.div className="text-muted-foreground text-center h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      No output available
                    </motion.div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="stderr" className="mt-4">
                <div className="border rounded-lg bg-muted/20 p-4 min-h-[400px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <motion.div className="text-muted-foreground" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                        Running code...
                      </motion.div>
                    </div>
                  ) : stderr ? (
                    <motion.div className="text-red-500 whitespace-pre-wrap font-mono text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      {stderr}
                    </motion.div>
                  ) : (
                    <motion.div className="text-muted-foreground text-center h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      No errors
                    </motion.div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="compile" className="mt-4">
                <div className="border rounded-lg bg-muted/20 p-4 min-h-[400px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <motion.div className="text-muted-foreground" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                        Running code...
                      </motion.div>
                    </div>
                  ) : compileOutput ? (
                    <motion.div className="text-yellow-500 whitespace-pre-wrap font-mono text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      {compileOutput}
                    </motion.div>
                  ) : (
                    <motion.div className="text-muted-foreground text-center h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      No compilation output
                    </motion.div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
        <Toaster 
          position="bottom-right" 
          reverseOrder={false}
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            duration: 3000,
          }}
        />
      </div>
    </div>
  );
}
