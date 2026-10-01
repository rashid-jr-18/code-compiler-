'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestionStore } from '@/store/questionStore';
import { Question, TestCase } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import { LANGUAGES } from '@/config/languages';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Save, 
  TestTube, 
  Settings, 
  Tag, 
  Clock, 
  MemoryStick, 
  Code2, 
  Eye, 
  EyeOff, 
  Download, 
  Link2, 
  Loader2, 
  Sparkles, 
  Globe, 
  ExternalLink,
  Search
} from 'lucide-react';

interface FacultyPageProps {
  onBack?: () => void;
}

export default function FacultyPage({ onBack }: FacultyPageProps = {}) {
  const { addQuestion } = useQuestionStore();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [supportedLanguages, setSupportedLanguages] = useState<number[]>([71]); // Default to Python
  const [langSearch, setLangSearch] = useState('');
  const [timeLimit, setTimeLimit] = useState(5);
  const [memoryLimit, setMemoryLimit] = useState(128);
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Test case form state
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    expectedOutput: '',
    points: 10,
    description: '',
    isHidden: false
  });

  // Universal Import state
  const [importMode, setImportMode] = useState<'explore' | 'url' | 'smart-paste'>('explore');
  const [selectedPlatform, setSelectedPlatform] = useState<'codechef' | 'leetcode' | 'hackerrank' | 'geeksforgeeks'>('codechef');
  const [searchTopic, setSearchTopic] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);

  const [importInput, setImportInput] = useState('');
  const [smartPasteText, setSmartPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Search platform problems
  const fetchPlatformProblems = async (plat: string, topic: string, kw: string) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (plat) params.set('platform', plat);
      if (topic && topic !== 'all') params.set('topic', topic);
      if (kw) params.set('query', kw);

      const res = await fetch(`/api/import/search?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.results) {
        setSearchResults(json.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (importMode === 'explore') {
      fetchPlatformProblems(selectedPlatform, searchTopic, searchKeyword);
    }
  }, [importMode, selectedPlatform, searchTopic]);

  const handleImportProblem = async (problem: any) => {
    setImportingSlug(problem.slug);
    await performImport(problem.importUrl || problem.slug);
    setImportingSlug(null);
  };

  const performImport = async (slugOrUrl?: string, rawText?: string) => {
    const textToImport = rawText ?? (importMode === 'smart-paste' ? smartPasteText : (slugOrUrl ?? importInput));
    if (!textToImport || !textToImport.trim()) {
      toast.error(importMode === 'smart-paste' ? 'Please paste problem text or markdown' : 'Please enter a problem URL or slug');
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Extracting problem details and test cases...');

    try {
      const res = await fetch('/api/import/leetcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlOrSlug: textToImport.trim(),
          rawText: importMode === 'smart-paste' ? textToImport : undefined,
          mode: importMode
        })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to import problem');
      }

      const p = result.data;
      setTitle(p.title || '');
      setDescription(p.description || '');
      setCategory(p.category || 'Algorithms');
      setDifficulty(p.difficulty || 'Easy');
      setSampleInput(p.sampleInput || '');
      setSampleOutput(p.sampleOutput || '');
      if (p.tags && p.tags.length > 0) {
        setTagsInput(p.tags.join(', '));
      }
      if (p.hints && p.hints.length > 0) {
        setHints(p.hints);
      }
      if (p.testCases && p.testCases.length > 0) {
        setTestCases(p.testCases);
      }

      const platformLabel = result.platform ? result.platform.toUpperCase() : 'PLATFORM';
      toast.success(`Successfully imported "${p.title}" from ${platformLabel}!`, { id: toastId });
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Could not import problem', { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setDifficulty('Easy');
    setSupportedLanguages([71]);
    setTimeLimit(5);
    setMemoryLimit(128);
    setSampleInput('');
    setSampleOutput('');
    setTagsInput('');
    setHints([]);
    setTestCases([]);
    setNewTestCase({
      input: '',
      expectedOutput: '',
      points: 10,
      description: '',
      isHidden: false
    });
  };

  const handleLanguageToggle = (languageId: number) => {
    setSupportedLanguages(prev => 
      prev.includes(languageId) 
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId]
    );
  };

  const handleAddTestCase = () => {
    if (!newTestCase.input.trim() || !newTestCase.expectedOutput.trim()) {
      toast.error('Please fill in both input and expected output');
      return;
    }

    const testCase: TestCase = {
      id: `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      input: newTestCase.input.trim(),
      expectedOutput: newTestCase.expectedOutput.trim(),
      points: newTestCase.points,
      description: newTestCase.description.trim() || undefined,
      isHidden: newTestCase.isHidden
    };
    
    setTestCases(prev => [...prev, testCase]);
    setNewTestCase({
      input: '',
      expectedOutput: '',
      points: 20,
      description: '',
      isHidden: false
    });
    toast.success('Test case added!');
  };

  const handleUpdateTestCase = (id: string, updates: Partial<TestCase>) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, ...updates } : tc));
  };

  const apply100PointStandard = () => {
    if (testCases.length === 0) {
      toast.error('Add test cases first to apply point distribution');
      return;
    }
    if (testCases.length === 4) {
      // 2 public (20 + 20 = 40 pts) and 2 hidden (30 + 30 = 60 pts)
      setTestCases(prev => [
        { ...prev[0], points: 20, isHidden: false, description: prev[0].description || 'Sample Case 1' },
        { ...prev[1], points: 20, isHidden: false, description: prev[1].description || 'Sample Case 2' },
        { ...prev[2], points: 30, isHidden: true, description: prev[2].description || 'Hidden Critical Boundary' },
        { ...prev[3], points: 30, isHidden: true, description: prev[3].description || 'Hidden Edge Case' },
      ]);
      toast.success('Applied 100-pt distribution (40pts Public + 60pts Hidden)!');
    } else {
      // Evenly distribute 100 points
      const ptsPerCase = Math.floor(100 / testCases.length);
      const remainder = 100 - (ptsPerCase * testCases.length);
      setTestCases(prev => prev.map((tc, idx) => ({
        ...tc,
        points: idx === 0 ? ptsPerCase + remainder : ptsPerCase
      })));
      toast.success(`Balanced 100 points across ${testCases.length} test cases!`);
    }
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
    toast.success('Test case removed');
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (!category.trim()) {
      toast.error('Category is required');
      return false;
    }
    if (supportedLanguages.length === 0) {
      toast.error('At least one programming language must be selected');
      return false;
    }
    if (testCases.length === 0) {
      toast.error('At least one test case is required');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    const question: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      difficulty,
      supportedLanguages,
      timeLimit,
      memoryLimit,
      sampleInput: sampleInput.trim() || undefined,
      sampleOutput: sampleOutput.trim() || undefined,
      testCases,
      tags: tags.length > 0 ? tags : undefined,
      hints: hints.length > 0 ? hints : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    addQuestion(question);

    // Persist to backend database as well
    fetch('/api/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'FACULTY'
      },
      body: JSON.stringify(question)
    }).catch(err => console.error('Failed to persist question to API:', err));

    resetForm();
    toast.success('Question added to Problem Library!');
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Hard': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent text-gray-900 dark:text-white overflow-hidden">
      <div className="relative z-10 container mx-auto p-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={28} />
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Faculty Question Manager
              </h1>
            </div>
            {onBack && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBack}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ← Back to Problems
              </Button>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Create and author coding questions with automated test cases</p>
        </motion.div>

        {/* Universal Import Banner / Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 sm:p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/50 dark:from-blue-950/25 dark:via-indigo-950/20 dark:to-slate-900/30 shadow-xs"
        >
          {/* Header & Supported Platforms */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                <Download size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Universal Coding Question Importer
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    Multi-Platform
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Import directly from LeetCode, HackerRank, CodeChef, GeeksforGeeks, freeCodeCamp, or Smart Paste.
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 self-start sm:self-auto text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setImportMode('explore')}
                className={`px-3 py-1 rounded-md transition-colors ${importMode === 'explore' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'}`}
              >
                Platform Explorer
              </button>
              <button
                type="button"
                onClick={() => setImportMode('url')}
                className={`px-3 py-1 rounded-md transition-colors ${importMode === 'url' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'}`}
              >
                By URL / Link
              </button>
              <button
                type="button"
                onClick={() => setImportMode('smart-paste')}
                className={`px-3 py-1 rounded-md transition-colors ${importMode === 'smart-paste' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'}`}
              >
                Smart Text Paste
              </button>
            </div>
          </div>

          {/* Mode 1: Interactive Platform Explorer (Default) */}
          {importMode === 'explore' && (
            <div className="space-y-3">
              {/* 4 Platform Selection Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'codechef', name: 'CodeChef', desc: 'Competitive Practice', color: 'border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 ring-amber-500/40' },
                  { id: 'leetcode', name: 'LeetCode', desc: 'Interview Problems', color: 'border-orange-500 text-orange-700 dark:text-orange-300 bg-orange-50/70 dark:bg-orange-950/40 ring-orange-500/40' },
                  { id: 'hackerrank', name: 'HackerRank', desc: 'Skill Tracks & Algorithms', color: 'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 ring-emerald-500/40' },
                  { id: 'geeksforgeeks', name: 'GeeksforGeeks', desc: 'DSA & Topic Problems', color: 'border-green-600 text-green-700 dark:text-green-300 bg-green-50/70 dark:bg-green-950/40 ring-green-600/40' },
                ].map(plat => {
                  const isSelected = selectedPlatform === plat.id;
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => setSelectedPlatform(plat.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? `${plat.color} ring-2 font-semibold shadow-xs`
                          : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{plat.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                        {plat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Topic Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') fetchPlatformProblems(selectedPlatform, searchTopic, searchKeyword); }}
                    placeholder={`Search in ${selectedPlatform.toUpperCase()} (e.g., arrays, sorting, strings, subarray)...`}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fetchPlatformProblems(selectedPlatform, searchTopic, searchKeyword)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 shadow-xs shrink-0 flex items-center gap-1 font-semibold"
                >
                  <Search size={13} />
                  <span>Search</span>
                </Button>
              </div>

              {/* Topic Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Topics:</span>
                {[
                  { id: 'all', label: 'All Topics' },
                  { id: 'arrays', label: 'Arrays' },
                  { id: 'strings', label: 'Strings' },
                  { id: 'dynamic programming', label: 'Dynamic Programming' },
                  { id: 'math', label: 'Math' },
                  { id: 'sorting', label: 'Sorting' },
                ].map(topic => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSearchTopic(topic.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                      searchTopic === topic.id
                        ? 'bg-blue-600 text-white font-medium shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>

              {/* Problem Results Table (LeetCode Single-Row Table Style) */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-2xs mt-2">
                <div className="grid grid-cols-12 gap-2 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="col-span-6 sm:col-span-5">Problem Title</div>
                  <div className="hidden sm:block sm:col-span-3">Category & Tags</div>
                  <div className="col-span-3 sm:col-span-2 text-right sm:text-left">Difficulty</div>
                  <div className="col-span-3 sm:col-span-2 text-right">Action</div>
                </div>

                <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70 max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                      <span>Loading problems from {selectedPlatform.toUpperCase()}...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No problems found matching &quot;{searchKeyword || searchTopic}&quot; on {selectedPlatform.toUpperCase()}. Try selecting &quot;Arrays&quot; or resetting search.
                    </div>
                  ) : (
                    searchResults.map((prob, idx) => {
                      const isRowImporting = importingSlug === prob.slug;
                      return (
                        <div
                          key={prob.slug || idx}
                          className="grid grid-cols-12 gap-2 px-3.5 py-2 items-center text-xs hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="col-span-6 sm:col-span-5 flex items-center gap-1.5 truncate pr-1">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {idx + 1}. {prob.title}
                            </span>
                            {prob.slug && prob.slug !== prob.title && (
                              <span className="text-[10px] font-mono text-slate-400 shrink-0 hidden md:inline">
                                ({prob.slug})
                              </span>
                            )}
                          </div>

                          <div className="hidden sm:flex sm:col-span-3 items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">{prob.category}</span>
                            {prob.tags?.[0] && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {prob.tags[0]}
                              </span>
                            )}
                          </div>

                          <div className="col-span-3 sm:col-span-2 text-right sm:text-left">
                            <span className={`font-semibold text-[11px] ${
                              prob.difficulty === 'Easy'
                                ? 'text-teal-600 dark:text-teal-400'
                                : prob.difficulty === 'Hard'
                                ? 'text-rose-500 dark:text-rose-400'
                                : 'text-amber-500 dark:text-amber-400'
                            }`}>
                              {prob.difficulty}
                            </span>
                          </div>

                          <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleImportProblem(prob)}
                              disabled={isRowImporting || isImporting}
                              className="h-6 px-2.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs flex items-center gap-1"
                            >
                              {isRowImporting ? (
                                <>
                                  <Loader2 size={11} className="animate-spin" />
                                  <span>Importing...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={11} />
                                  <span>Import</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Direct URL / Link */}
          {importMode === 'url' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <span className="text-slate-400 font-semibold">Supported:</span>
                {['LeetCode', 'HackerRank', 'CodeChef', 'GeeksforGeeks', 'freeCodeCamp', 'TopCoder', 'Codeforces'].map(plat => (
                  <span key={plat} className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {plat}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={importInput}
                    onChange={e => setImportInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') performImport(importInput); }}
                    placeholder="Paste URL (e.g., leetcode.com/problems/two-sum or hackerrank.com/challenges/simple-array-sum)"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => performImport(importInput)}
                  disabled={isImporting || !importInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 h-9 shadow-xs shrink-0 flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Fetch & Auto-Fill</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Quick example chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-blue-100 dark:border-blue-900/30 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Quick Try:</span>
                {[
                  { label: 'LeetCode: Two Sum', val: 'two-sum' },
                  { label: 'HackerRank: Simple Array Sum', val: 'https://www.hackerrank.com/challenges/simple-array-sum/problem' },
                  { label: 'CodeChef: Number Mirror', val: 'https://www.codechef.com/problems/FLOW001' },
                  { label: 'LeetCode: Valid Parentheses', val: 'valid-parentheses' },
                  { label: 'GFG: Array Reverse', val: 'https://www.geeksforgeeks.org/problems/reverse-an-array/1' },
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setImportInput(item.val);
                      performImport(item.val);
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-[11px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: Smart Text Paste */}
          {importMode === 'smart-paste' && (
            <div className="space-y-2">
              <textarea
                rows={4}
                value={smartPasteText}
                onChange={e => setSmartPasteText(e.target.value)}
                placeholder="Paste any problem statement from GeeksforGeeks, CodeChef, TopCoder, or PDF. Include description, Sample Input, and Sample Output..."
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => performImport(undefined, smartPasteText)}
                  disabled={isImporting || !smartPasteText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 h-8 shadow-xs flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Parsing Problem...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Parse & Auto-Fill</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-xl space-y-6 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings className="text-blue-600 dark:text-blue-400" size={20} />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Question Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g., Two Sum Problem" 
              />
              <Input 
                label="Category" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                placeholder="e.g., Arrays, Strings" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Difficulty</label>
                <div className="flex gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        difficulty === diff 
                          ? getDifficultyColor(diff)
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock size={16} className="text-slate-500" />
                <Input 
                  label="Time Limit (seconds)" 
                  type="number" 
                  value={timeLimit} 
                  onChange={e => setTimeLimit(Math.max(1, parseInt(e.target.value) || 1))} 
                  min="1"
                />
              </div>
              
              <div className="flex items-center gap-1">
                <MemoryStick size={16} className="text-slate-500" />
                <Input 
                  label="Memory Limit (MB)" 
                  type="number" 
                  value={memoryLimit} 
                  onChange={e => setMemoryLimit(Math.max(1, parseInt(e.target.value) || 1))} 
                  min="1"
                />
              </div>
            </div>

            <TextArea 
              label="Description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Provide a detailed problem description with examples..." 
              className="min-h-[120px]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextArea 
                label="Sample Input (Optional)" 
                value={sampleInput} 
                onChange={e => setSampleInput(e.target.value)} 
                placeholder="Example input for the problem" 
                className="min-h-[80px]"
              />
              <TextArea 
                label="Sample Output (Optional)" 
                value={sampleOutput} 
                onChange={e => setSampleOutput(e.target.value)} 
                placeholder="Expected output for the sample input" 
                className="min-h-[80px]"
              />
            </div>

            <div className="flex items-center gap-1">
              <Tag size={16} className="text-slate-500" />
              <Input 
                label="Tags (comma-separated)" 
                value={tagsInput} 
                onChange={e => setTagsInput(e.target.value)} 
                placeholder="e.g., array, hash-table, two-pointer" 
              />
            </div>

            {/* Supported Languages */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Code2 className="text-slate-500" size={16} />
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Supported Languages ({supportedLanguages.length} selected)
                  </label>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSupportedLanguages(LANGUAGES.map(l => l.id))}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Select All ({LANGUAGES.length})
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSupportedLanguages([71, 63, 74, 62, 54, 50, 51, 60, 73, 68, 72, 78])}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Popular (12)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSupportedLanguages([])}
                    className="text-slate-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Language Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter from 60+ languages (e.g. python, c++, rust, swift)..."
                  value={langSearch}
                  onChange={e => setLangSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                {LANGUAGES.filter(lang => 
                  lang.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                  lang.extension.toLowerCase().includes(langSearch.toLowerCase())
                ).map(language => (
                  <button
                    key={language.id}
                    type="button"
                    onClick={() => handleLanguageToggle(language.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex flex-col justify-between ${
                      supportedLanguages.includes(language.id)
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-500 shadow-sm'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold truncate">{language.name}</div>
                    <div className="text-[10px] opacity-70 flex items-center justify-between mt-1">
                      <span>.{language.extension}</span>
                      <span>ID: {language.id}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Test Cases */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-xl space-y-6 shadow-xs"
          >
            {(() => {
              const totalPoints = testCases.reduce((sum, tc) => sum + (Number(tc.points) || 0), 0);
              const publicCases = testCases.filter(tc => !tc.isHidden);
              const hiddenCases = testCases.filter(tc => tc.isHidden);
              const publicPoints = publicCases.reduce((sum, tc) => sum + (Number(tc.points) || 0), 0);
              const hiddenPoints = hiddenCases.reduce((sum, tc) => sum + (Number(tc.points) || 0), 0);

              return (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-300 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <TestTube className="text-blue-600 dark:text-blue-400" size={20} />
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Test Cases & Points</h2>
                    </div>
                    {testCases.length > 0 && (
                      <button
                        type="button"
                        onClick={apply100PointStandard}
                        className="text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all font-medium self-start sm:self-auto"
                      >
                        ⚡ 100-Point Standard (40pts Public + 60pts Hidden)
                      </button>
                    )}
                  </div>

                  {/* Points Allocation Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-xs">
                    <div className="text-center">
                      <div className="text-slate-500 dark:text-slate-400 font-medium">Total Score</div>
                      <div className={`text-base font-bold ${totalPoints === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {totalPoints} pts
                      </div>
                    </div>
                    <div className="text-center border-x border-slate-300 dark:border-slate-700">
                      <div className="text-slate-500 dark:text-slate-400 font-medium">Public Cases</div>
                      <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                        {publicPoints} pts <span className="text-[11px] font-normal text-slate-500">({publicCases.length})</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500 dark:text-slate-400 font-medium">Hidden Cases</div>
                      <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                        {hiddenPoints} pts <span className="text-[11px] font-normal text-slate-500">({hiddenCases.length})</span>
                      </div>
                    </div>
                  </div>

                  {/* Existing Test Cases */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    <AnimatePresence>
                      {testCases.map((testCase, index) => (
                        <motion.div
                          key={testCase.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-300 dark:border-slate-700 space-y-2 shadow-xs"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white">Case #{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateTestCase(testCase.id, { isHidden: !testCase.isHidden })}
                                className={`px-2 py-0.5 text-xs rounded font-medium border flex items-center gap-1 transition-all ${
                                  testCase.isHidden
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                }`}
                                title="Click to toggle Public / Hidden"
                              >
                                {testCase.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                <span>{testCase.isHidden ? 'Hidden' : 'Public'}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <label className="text-[11px] text-slate-500 font-medium">Points:</label>
                                <input
                                  type="number"
                                  value={testCase.points}
                                  onChange={e => handleUpdateTestCase(testCase.id, { points: Math.max(1, parseInt(e.target.value) || 1) })}
                                  className="w-14 px-1.5 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold text-slate-900 dark:text-white"
                                  min="1"
                                />
                              </div>
                              <Button
                                onClick={() => handleRemoveTestCase(testCase.id)}
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>

                          {testCase.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{testCase.description}</p>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">Input:</span>
                              <pre className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 rounded mt-0.5 font-mono border border-slate-300 dark:border-slate-800 text-[11px] max-h-16 overflow-y-auto">{testCase.input}</pre>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">Expected Output:</span>
                              <pre className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 rounded mt-0.5 font-mono border border-slate-300 dark:border-slate-800 text-[11px] max-h-16 overflow-y-auto">{testCase.expectedOutput}</pre>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {testCases.length === 0 && (
                      <div className="text-center py-6 text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                        <TestTube size={28} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No test cases added yet. Add public samples and hidden boundary cases below.</p>
                      </div>
                    )}
                  </div>

                  {/* Add New Test Case Form */}
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Add Test Case</h3>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 text-[11px]">Quick Points:</span>
                        {[20, 30, 25, 10].map(pt => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => setNewTestCase(prev => ({ ...prev, points: pt }))}
                            className={`px-1.5 py-0.5 rounded text-[11px] font-medium border transition-all ${
                              newTestCase.points === pt
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                            }`}
                          >
                            {pt}pt
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <TextArea
                      label="Input"
                      value={newTestCase.input}
                      onChange={e => setNewTestCase(prev => ({ ...prev, input: e.target.value }))}
                      placeholder="e.g. [2,3,6,7]\n7"
                      className="min-h-[50px] font-mono text-xs"
                    />
                    
                    <TextArea
                      label="Expected Output"
                      value={newTestCase.expectedOutput}
                      onChange={e => setNewTestCase(prev => ({ ...prev, expectedOutput: e.target.value }))}
                      placeholder="e.g. [[2,2,3],[7]]"
                      className="min-h-[50px] font-mono text-xs"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Points Allocation"
                        type="number"
                        value={newTestCase.points}
                        onChange={e => setNewTestCase(prev => ({ ...prev, points: Math.max(1, parseInt(e.target.value) || 1) }))}
                        min="1"
                      />
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Visibility</label>
                        <button
                          type="button"
                          onClick={() => setNewTestCase(prev => ({ ...prev, isHidden: !prev.isHidden }))}
                          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                            newTestCase.isHidden
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {newTestCase.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                          {newTestCase.isHidden ? 'Hidden Test Case' : 'Public Sample Case'}
                        </button>
                      </div>
                    </div>
                    
                    <Input
                      label="Case Description / Note (e.g. Boundary condition, edge case)"
                      value={newTestCase.description}
                      onChange={e => setNewTestCase(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Sample Case 1: Standard input / Hidden Critical Boundary"
                    />
                    
                    <Button
                      type="button"
                      onClick={handleAddTestCase}
                      className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 text-white shadow-sm font-medium text-sm"
                    >
                      <Plus size={16} />
                      Add Test Case to Problem
                    </Button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <Button
            onClick={handleSubmit}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 flex items-center gap-2 mx-auto text-white shadow-sm font-medium text-base rounded-lg"
          >
            <Save size={18} />
            Create Question
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

