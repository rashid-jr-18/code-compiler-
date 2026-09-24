'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestionStore } from '@/store/questionStore';
import { Question } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Filter, 
  Search, 
  Clock, 
  MemoryStick, 
  Tag,
  ChevronRight,
  Trophy,
  Target,
  Code2,
  Trash2,
  Plus,
  Check,
  Sparkles,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionBrowserProps {
  onSelectQuestion: (question: Question) => void;
  onCreateProblem?: () => void;
  onImportProblem?: () => void;
  isFacultyOrAdmin?: boolean;
}

export default function QuestionBrowser({ 
  onSelectQuestion,
  onCreateProblem,
  onImportProblem,
  isFacultyOrAdmin
}: QuestionBrowserProps) {
  const { questions, setQuestions, deleteQuestion, submissions } = useQuestionStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  // Sync questions from persistent backend API on mount
  useEffect(() => {
    fetch('/api/questions')
      .then(async res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const map = new Map<string, Question>();
          questions.forEach(q => map.set(q.id, q));
          data.forEach((q: Question) => map.set(q.id, {
            ...q,
            supportedLanguages: q.supportedLanguages || []
          }));
          setQuestions(Array.from(map.values()));
        }
      })
      .catch(err => console.warn('[QuestionBrowser] Error fetching questions:', err));
  }, []);

  const categories = ['All', ...new Set(questions.map(q => q.category).filter(Boolean))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'] as const;

  const filteredQuestions = questions.filter(question => {
    const title = (question.title || '').toLowerCase();
    const desc = (question.description || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = title.includes(term) ||
                         desc.includes(term) ||
                         question.tags?.some(tag => (tag || '').toLowerCase().includes(term));
    const matchesCategory = selectedCategory === 'All' || question.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || question.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/30';
      case 'Medium': return 'text-amber-700 dark:text-yellow-400 bg-amber-500/10 border-amber-500/30';
      case 'Hard': return 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-700 dark:text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const handleDeleteQuestion = async (e: React.MouseEvent, question: Question) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete problem "${question.title}" from the Problem Library?`)) {
      return;
    }

    try {
      setDeletingId(question.id);
      const res = await fetch(`/api/questions?id=${encodeURIComponent(question.id)}`, {
        method: 'DELETE',
        headers: { 'x-user-role': isFacultyOrAdmin ? 'FACULTY' : 'LEARNER' }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete question');
      }

      deleteQuestion(question.id);
      toast.success(`Problem "${question.title}" deleted`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting problem');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <BookOpen className="text-blue-600 dark:text-blue-400" size={28} />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Problem Library
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Choose a coding challenge to solve or test</p>
        </div>

        {isFacultyOrAdmin && (onCreateProblem || onImportProblem) && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            {onImportProblem && (
              <Button
                onClick={onImportProblem}
                variant="outline"
                className="border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-medium text-xs sm:text-sm gap-1.5 shadow-2xs rounded-lg cursor-pointer"
              >
                <Globe size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Import Problem</span>
              </Button>
            )}
            {onCreateProblem && (
              <Button
                onClick={onCreateProblem}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm gap-1.5 shadow-sm rounded-lg cursor-pointer"
              >
                <Plus size={16} />
                <span>Create Problem</span>
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-4 rounded-xl space-y-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{category}</option>
            ))}
          </select>
          
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{difficulty}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* LeetCode-style Problem Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-300 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90">
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-6 sm:col-span-5">Title</div>
          <div className="hidden sm:block sm:col-span-2">Category</div>
          <div className="col-span-2 sm:col-span-2 text-right sm:text-left">Score</div>
          <div className="col-span-2 sm:col-span-1 text-right sm:text-left">Difficulty</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Problem Rows */}
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          {filteredQuestions.map((question, index) => {
            const isSolved = submissions?.some(s => s.questionId === question.id && s.overallStatus === 'Accepted');
            const totalPoints = (question.testCases || []).reduce((sum, tc) => sum + (Number(tc.points) || 0), 0);
            const isEven = index % 2 === 0;

            return (
              <div
                key={question.id}
                onClick={() => onSelectQuestion(question)}
                className={`grid grid-cols-12 gap-3 px-4 py-2.5 items-center text-sm transition-colors cursor-pointer ${
                  isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/35'
                } hover:bg-blue-50/70 dark:hover:bg-slate-800/70`}
              >
                {/* Status */}
                <div className="col-span-1 flex items-center justify-center">
                  {isSolved ? (
                    <span title="Solved">
                      <Check className="text-emerald-500 stroke-[3]" size={16} />
                    </span>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">•</span>
                  )}
                </div>

                {/* Title */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-2 truncate pr-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                    {index + 1}. {question.title}
                  </span>
                </div>

                {/* Category */}
                <div className="hidden sm:flex sm:col-span-2 items-center text-xs text-slate-500 dark:text-slate-400 truncate">
                  <span className="truncate">{question.category}</span>
                </div>

                {/* Score / Tests */}
                <div className="col-span-2 sm:col-span-2 text-right sm:text-left text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>{totalPoints > 0 ? `${totalPoints} pts` : `${question.testCases?.length || 0} tests`}</span>
                </div>

                {/* Difficulty (Pure LeetCode colored text) */}
                <div className="col-span-2 sm:col-span-1 text-right sm:text-left text-xs">
                  {question.difficulty === 'Easy' ? (
                    <span className="text-teal-600 dark:text-teal-400 font-semibold">Easy</span>
                  ) : question.difficulty === 'Hard' ? (
                    <span className="text-rose-500 dark:text-rose-400 font-semibold">Hard</span>
                  ) : (
                    <span className="text-amber-500 dark:text-amber-400 font-semibold">Med.</span>
                  )}
                </div>

                {/* Action */}
                <div className="col-span-1 flex items-center justify-end gap-1.5">
                  {isFacultyOrAdmin && (
                    <button
                      onClick={(e) => handleDeleteQuestion(e, question)}
                      disabled={deletingId === question.id}
                      title="Delete Problem"
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all opacity-60 hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <ChevronRight size={15} className="text-slate-400 group-hover:text-blue-600" />
                </div>
              </div>
            );
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <BookOpen size={44} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No problems found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

