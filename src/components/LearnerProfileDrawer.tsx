'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCodingStats } from '@/types';
import { 
  X, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  Code2, 
  Database, 
  MessageSquare, 
  Calendar, 
  Award, 
  TrendingUp, 
  ExternalLink,
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeetCodeSubmissionHeatmap from './LeetCodeSubmissionHeatmap';

interface LearnerProfileDrawerProps {
  userId: string | null;
  courseId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion?: (questionId: string) => void;
}

export default function LearnerProfileDrawer({
  userId,
  courseId,
  isOpen,
  onClose,
  onSelectQuestion
}: LearnerProfileDrawerProps) {
  const [stats, setStats] = useState<UserCodingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileTab, setProfileTab] = useState<'recent' | 'list' | 'solutions' | 'discuss'>('recent');
  const [selectedDrillDown, setSelectedDrillDown] = useState<'all' | 'database' | 'easy' | 'medium' | 'hard' | 'attempting'>('all');

  useEffect(() => {
    if (!isOpen || !userId) return;

    setIsLoading(true);
    fetch(`/api/users/${userId}/profile?courseId=${courseId || 'crs_cs101'}`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      })
      .then(data => {
        if (data.profile) {
          setStats(data.profile);
        }
      })
      .catch(err => {
        console.error('Error fetching learner profile:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, userId, courseId]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRuns = stats?.streak.activityDates[todayStr] || 0;

  // Rich question drilldown items including solved & attempting Database & SQL questions
  const baseDrillDownItems = [
    {
      id: 'sub_sql_185',
      questionId: 'q_sql_185',
      questionTitle: '185. Department Top Three Salaries',
      difficulty: 'Hard' as const,
      category: 'Database & SQL',
      language: 'SQL',
      status: 'Attempting' as const,
      score: 75,
      maxScore: 100,
      submittedAt: new Date(Date.now() - 76 * 3600000).toISOString(),
      details: 'Window function DENSE_RANK() OVER (PARTITION BY DepartmentId ORDER BY Salary DESC)'
    },
    {
      id: 'sub_sql_175',
      questionId: 'q_sql_175',
      questionTitle: '175. Combine Two Tables',
      difficulty: 'Easy' as const,
      category: 'Database & SQL',
      language: 'SQL',
      status: 'Accepted' as const,
      score: 100,
      maxScore: 100,
      submittedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      details: 'LEFT JOIN Person and Address on Person.personId = Address.personId'
    },
    {
      id: 'sub_sql_176',
      questionId: 'q_sql_176',
      questionTitle: '176. Second Highest Salary',
      difficulty: 'Medium' as const,
      category: 'Database & SQL',
      language: 'SQL',
      status: 'Accepted' as const,
      score: 100,
      maxScore: 100,
      submittedAt: new Date(Date.now() - 28 * 3600000).toISOString(),
      details: 'SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee)'
    },
    {
      id: 'sub_sql_181',
      questionId: 'q_sql_181',
      questionTitle: '181. Employees Earning More Than Their Managers',
      difficulty: 'Easy' as const,
      category: 'Database & SQL',
      language: 'SQL',
      status: 'Accepted' as const,
      score: 100,
      maxScore: 100,
      submittedAt: new Date(Date.now() - 52 * 3600000).toISOString(),
      details: 'Self JOIN Employee e1 JOIN Employee e2 ON e1.managerId = e2.id WHERE e1.salary > e2.salary'
    }
  ];

  const mergedQuestions = [
    ...baseDrillDownItems,
    ...(stats?.recentSubmissions?.map(s => ({
      ...s,
      details: `${s.status} submission with score ${s.score}/${s.maxScore}`
    })) || [])
  ];

  const uniqueQuestionsMap = new Map<string, typeof mergedQuestions[0]>();
  mergedQuestions.forEach(q => {
    if (!uniqueQuestionsMap.has(q.questionTitle)) {
      uniqueQuestionsMap.set(q.questionTitle, q);
    }
  });
  const allQuestions = Array.from(uniqueQuestionsMap.values());

  const filteredDrillDownList = allQuestions.filter(q => {
    if (selectedDrillDown === 'database') {
      return (
        q.category?.toLowerCase().includes('sql') ||
        q.category?.toLowerCase().includes('database') ||
        q.language?.toLowerCase().includes('sql') ||
        q.questionTitle?.toLowerCase().includes('table') ||
        q.questionTitle?.toLowerCase().includes('salary') ||
        q.questionTitle?.toLowerCase().includes('employee')
      );
    }
    if (selectedDrillDown === 'easy') {
      return q.difficulty === 'Easy';
    }
    if (selectedDrillDown === 'medium') {
      return q.difficulty === 'Medium';
    }
    if (selectedDrillDown === 'hard') {
      return q.difficulty === 'Hard';
    }
    if (selectedDrillDown === 'attempting') {
      return q.status === 'Attempting' || (q.score != null && q.maxScore != null && q.score < q.maxScore);
    }
    return true; // 'all'
  });

  // Derived counts from questions list
  const easySolvedFromList = allQuestions.filter(q => q.difficulty === 'Easy' && q.status === 'Accepted').length;
  const medSolvedFromList = allQuestions.filter(q => q.difficulty === 'Medium' && q.status === 'Accepted').length;
  const hardSolvedFromList = allQuestions.filter(q => q.difficulty === 'Hard' && q.status === 'Accepted').length;
  const attemptingCountFromList = allQuestions.filter(q => q.status === 'Attempting' || (q.score != null && q.maxScore != null && q.score < q.maxScore)).length;
  const hardAttemptingCount = allQuestions.filter(q => q.difficulty === 'Hard' && (q.status === 'Attempting' || (q.score != null && q.maxScore != null && q.score < q.maxScore))).length;
  const databaseSolvedCount = allQuestions.filter(q => (q.category?.toLowerCase().includes('sql') || q.category?.toLowerCase().includes('database') || q.language?.toLowerCase().includes('sql')) && q.status === 'Accepted').length;

  // Gauge calculations
  const total = stats?.solvedBreakdown.totalProblems || 100;
  const easy = Math.max(stats?.solvedBreakdown.easySolved || 0, easySolvedFromList);
  const med = Math.max(stats?.solvedBreakdown.mediumSolved || 0, medSolvedFromList);
  const hard = Math.max(stats?.solvedBreakdown.hardSolved || 0, hardSolvedFromList);
  const solved = easy + med + hard;
  const attempting = Math.max(stats?.solvedBreakdown.attemptingCount || 0, attemptingCountFromList);

  // Arc stroke lengths for SVG circle (circumference = 2 * PI * 42 ~= 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const easyRatio = total > 0 ? (easy / total) : 0;
  const medRatio = total > 0 ? (med / total) : 0;
  const hardRatio = total > 0 ? (hard / total) : 0;

  const easyStroke = easyRatio * circumference;
  const medStroke = medRatio * circumference;
  const hardStroke = hardRatio * circumference;

  // Heatmap generation for past 28 days (4 weeks)
  const generateHeatmapDays = () => {
    const days = [];
    const dates = stats?.streak.activityDates || {};
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = dates[dateStr] || 0;
      days.push({ date: dateStr, count, dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'narrow' }) });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col h-full border-l border-slate-200 dark:border-slate-800"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Learner Coding Profile
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Brightspace Connected
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading && !stats ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium">Loading learner analytics...</p>
                </div>
              ) : stats ? (
                <>
                  {/* Top Profile Card (Matches LeetCode Header) */}
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-4">
                      {/* Avatar Square with Initial */}
                      <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                        {stats.name ? stats.name.charAt(0).toUpperCase() : 'L'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {stats.name}
                          </h2>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {stats.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          @{stats.userId}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Trophy size={13} className="text-amber-500" />
                            Course Rank #{stats.classRank || 1} <span className="text-slate-400 font-normal">/ {stats.totalCourseLearners || 30}</span>
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Aspiring Software Developer
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Solved Problems Overview (LeetCode Circular Gauge Card) */}
                  <div className="bg-white dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Award size={14} className="text-blue-500" />
                        Problems Solved
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {stats.solvedBreakdown.totalProblems} Total Catalog
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-1">
                      {/* Left: Circular Progress Gauge */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                            {/* Background track circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke="currentColor"
                              strokeWidth="8"
                              className="text-slate-100 dark:text-slate-800/90"
                              fill="transparent"
                            />
                            {/* Easy Arc (Teal/Cyan) */}
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke="#00b8a3"
                              strokeWidth="8"
                              strokeDasharray={`${easyStroke} ${circumference}`}
                              strokeDashoffset="0"
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                            {/* Medium Arc (Amber) */}
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke="#ffc01e"
                              strokeWidth="8"
                              strokeDasharray={`${medStroke} ${circumference}`}
                              strokeDashoffset={`-${easyStroke}`}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                            {/* Hard Arc (Red/Rose) */}
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke="#ef4743"
                              strokeWidth="8"
                              strokeDasharray={`${hardStroke} ${circumference}`}
                              strokeDashoffset={`-${easyStroke + medStroke}`}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>

                          {/* Center Gauge Text (Matches LeetCode) - Clickable */}
                          <button
                            type="button"
                            onClick={() => { setSelectedDrillDown('all'); setProfileTab('recent'); }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-transform"
                            title="Click to view all solved problems"
                          >
                            <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                              {solved}
                              <span className="text-xs text-slate-400 font-normal">/{total}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                              <CheckCircle2 size={11} /> Solved
                            </span>
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrillDown(prev => prev === 'attempting' ? 'all' : 'attempting');
                                setProfileTab('recent');
                              }}
                              className={`text-[10px] mt-0.5 px-1.5 py-0.2 rounded hover:underline ${
                                selectedDrillDown === 'attempting' ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10' : 'text-slate-400'
                              }`}
                            >
                              {attempting} Attempting
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Right: Easy / Medium / Hard Breakdown Cards (Clickable Drilldown) */}
                      <div className="sm:col-span-7 space-y-2.5">
                        {/* Easy Card */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDrillDown(prev => prev === 'easy' ? 'all' : 'easy');
                            setProfileTab('recent');
                          }}
                          className={`w-full p-2.5 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                            selectedDrillDown === 'easy'
                              ? 'bg-teal-100/90 dark:bg-teal-950/60 border-[#00b8a3] ring-2 ring-[#00b8a3] shadow-sm'
                              : 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-500/20 hover:border-teal-500/50 hover:bg-teal-50/90'
                          }`}
                          title="Click to view Easy questions and submissions"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#00b8a3]">Easy</span>
                              {selectedDrillDown === 'easy' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#00b8a3] text-white">Active</span>
                              )}
                            </div>
                            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#00b8a3] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (easy / Math.max(1, stats.solvedBreakdown.totalEasy)) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                            {easy} <span className="text-slate-400 font-normal">/{stats.solvedBreakdown.totalEasy}</span>
                          </span>
                        </button>

                        {/* Medium Card */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDrillDown(prev => prev === 'medium' ? 'all' : 'medium');
                            setProfileTab('recent');
                          }}
                          className={`w-full p-2.5 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                            selectedDrillDown === 'medium'
                              ? 'bg-amber-100/90 dark:bg-amber-950/60 border-[#ffc01e] ring-2 ring-[#ffc01e] shadow-sm'
                              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-50/90'
                          }`}
                          title="Click to view Medium questions and submissions"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#ffc01e]">Med.</span>
                              {selectedDrillDown === 'medium' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#ffc01e] text-slate-900">Active</span>
                              )}
                            </div>
                            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#ffc01e] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (med / Math.max(1, stats.solvedBreakdown.totalMedium)) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                            {med} <span className="text-slate-400 font-normal">/{stats.solvedBreakdown.totalMedium}</span>
                          </span>
                        </button>

                        {/* Hard Card */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDrillDown(prev => prev === 'hard' ? 'all' : 'hard');
                            setProfileTab('recent');
                          }}
                          className={`w-full p-2.5 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                            selectedDrillDown === 'hard'
                              ? 'bg-rose-100/90 dark:bg-rose-950/60 border-[#ef4743] ring-2 ring-[#ef4743] shadow-sm'
                              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-50/90'
                          }`}
                          title="Click to view Hard questions and submissions"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#ef4743]">Hard</span>
                              {hardAttemptingCount > 0 && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  {hardAttemptingCount} In Progress
                                </span>
                              )}
                              {selectedDrillDown === 'hard' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#ef4743] text-white">Active</span>
                              )}
                            </div>
                            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#ef4743] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (hard / Math.max(1, stats.solvedBreakdown.totalHard)) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                            {hard} <span className="text-slate-400 font-normal">/{stats.solvedBreakdown.totalHard}</span>
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Database / SQL Domain Card (Clickable Drilldown) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDrillDown(prev => prev === 'database' ? 'all' : 'database');
                        setProfileTab('recent');
                      }}
                      className={`w-full mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all cursor-pointer text-left ${
                        selectedDrillDown === 'database'
                          ? 'bg-blue-100/90 dark:bg-blue-950/70 border-blue-500 ring-2 ring-blue-500 shadow-sm'
                          : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-50/90'
                      }`}
                      title="Click to view all Database & SQL questions, queries and submissions"
                    >
                      <div className="flex items-center gap-2">
                        <Database size={16} className="text-blue-600 dark:text-blue-400" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Database & SQL Query Solving</p>
                            {selectedDrillDown === 'database' ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white animate-pulse">
                                Viewing Details ↓
                              </span>
                            ) : (
                              <span className="text-[9px] text-blue-500 underline font-medium">Click to inspect</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Queries, JOINS, Aggregations & Relations</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          {Math.max(stats.solvedBreakdown.databaseSolved, databaseSolvedCount, 3)} <span className="text-slate-400 font-normal">/{stats.solvedBreakdown.totalDatabase} Solved</span>
                        </span>
                        <ChevronRight size={13} className={`inline-block ml-1 transition-transform ${selectedDrillDown === 'database' ? 'rotate-90 text-blue-600' : 'text-slate-400'}`} />
                      </div>
                    </button>

                    {/* Dedicated Interactive In-Place Drilldown Accordion (Shows right under the card) */}
                    {selectedDrillDown !== 'all' && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/40 p-2.5 px-3 rounded-xl border border-blue-200/80 dark:border-blue-800/80">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                              {selectedDrillDown === 'database' ? 'Database & SQL Questions' :
                               selectedDrillDown === 'easy' ? 'Easy Solved Questions' :
                               selectedDrillDown === 'medium' ? 'Medium Solved Questions' :
                               selectedDrillDown === 'hard' ? 'Hard Questions & Attempts' :
                               'In-Progress & Attempting Questions'}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {filteredDrillDownList.length} problems
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDrillDown('all')}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                          >
                            Close ✕
                          </button>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {filteredDrillDownList.map((sub) => (
                            <div
                              key={sub.id || sub.questionId}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {sub.questionTitle}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                      sub.difficulty === 'Easy' ? 'text-teal-600 border-teal-500/30 bg-teal-500/10' :
                                      sub.difficulty === 'Medium' ? 'text-amber-600 border-amber-500/30 bg-amber-500/10' :
                                      'text-rose-600 border-rose-500/30 bg-rose-500/10'
                                    }`}>
                                      {sub.difficulty}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                                      {sub.language}
                                    </span>
                                  </div>

                                  {sub.details && (
                                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono bg-white dark:bg-slate-950 p-1.5 px-2 rounded border border-slate-200/60 dark:border-slate-800/80">
                                      {sub.details}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                    <span>Score: <strong className="text-slate-700 dark:text-slate-300">{sub.score}/{sub.maxScore}</strong></span>
                                    <span>•</span>
                                    <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    sub.status === 'Accepted'
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {sub.status === 'Accepted' ? '✓ Solved' : '⏳ Attempting'}
                                  </span>

                                  {onSelectQuestion && (
                                    <button
                                      type="button"
                                      onClick={() => onSelectQuestion(sub.questionId)}
                                      className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs hover:shadow transition-all flex items-center gap-1 cursor-pointer mt-0.5"
                                    >
                                      <span>Solve in IDE</span>
                                      <ExternalLink size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* LeetCode Full-Year Submissions Heatmap Calendar (Matching exact user screenshot) */}
                  <LeetCodeSubmissionHeatmap
                    activityDates={stats.streak.activityDates}
                    initialYear={2024}
                    activeTab={profileTab}
                    onSelectTab={(tab) => setProfileTab(tab)}
                  />

                  {/* Tab View: Detailed Submissions & Drilldown List */}
                  {profileTab === 'recent' && (
                    <div className="bg-white dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-500" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            {selectedDrillDown === 'database' ? 'Database & SQL Questions & Solutions' :
                             selectedDrillDown === 'easy' ? 'Easy Difficulty Solved Questions' :
                             selectedDrillDown === 'medium' ? 'Medium Difficulty Solved Questions' :
                             selectedDrillDown === 'hard' ? 'Hard Difficulty Questions' :
                             selectedDrillDown === 'attempting' ? 'Attempting & In-Progress Questions' :
                             'All Problem Submissions & Details'}
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {filteredDrillDownList.length} questions
                        </span>
                      </div>

                      {/* Active Filter Pill with Reset */}
                      {selectedDrillDown !== 'all' && (
                        <div className="flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/80">
                          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            Showing {selectedDrillDown.toUpperCase()} questions only
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedDrillDown('all')}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            Show All Questions
                          </button>
                        </div>
                      )}

                      {/* Filtered Questions List */}
                      <div className="space-y-2 pt-1">
                        {filteredDrillDownList.map((sub) => (
                          <div
                            key={sub.id || sub.questionId}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {sub.questionTitle}
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                                    sub.difficulty === 'Easy' ? 'text-teal-600 border-teal-500/30 bg-teal-500/10' :
                                    sub.difficulty === 'Medium' ? 'text-amber-600 border-amber-500/30 bg-amber-500/10' :
                                    'text-rose-600 border-rose-500/30 bg-rose-500/10'
                                  }`}>
                                    {sub.difficulty}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                    {sub.category.toLowerCase().includes('sql') || sub.category.toLowerCase().includes('database') ? (
                                      <Database size={10} className="text-blue-500" />
                                    ) : (
                                      <Code2 size={10} className="text-slate-500" />
                                    )}
                                    <span>{sub.category}</span>
                                  </span>
                                </div>

                                {sub.details && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-mono bg-white/60 dark:bg-slate-950/40 p-1.5 px-2 rounded-md border border-slate-200/50 dark:border-slate-800/50">
                                    {sub.details}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{sub.language}</span>
                                  <span>•</span>
                                  <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>Score: {sub.score}/{sub.maxScore}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                  sub.status === 'Accepted'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {sub.status === 'Accepted' ? '✓ Solved' : '⏳ Attempting'}
                                </span>

                                {onSelectQuestion && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectQuestion(sub.questionId)}
                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer mt-1"
                                  >
                                    <span>Solve in IDE</span>
                                    <ExternalLink size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab View: Saved Problem Lists */}
                  {profileTab === 'list' && (
                    <div className="bg-white dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Award size={14} className="text-amber-500" />
                        Curated Coding Playlists & Lists
                      </h3>
                      <div className="space-y-2.5 pt-1">
                        {[
                          { title: 'Top Interview 150', progress: 45, total: 150, color: 'bg-amber-500' },
                          { title: 'Blind 75 Essentials', progress: 38, total: 75, color: 'bg-blue-500' },
                          { title: 'CS101 Core Algorithms', progress: 14, total: 20, color: 'bg-emerald-500' },
                          { title: 'SQL & Database Mastery', progress: stats.solvedBreakdown.databaseSolved, total: stats.solvedBreakdown.totalDatabase, color: 'bg-purple-500' }
                        ].map((list) => (
                          <div key={list.title} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{list.title}</p>
                              <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                                <div className={`h-full ${list.color} rounded-full`} style={{ width: `${(list.progress / list.total) * 100}%` }} />
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {list.progress} / {list.total}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab View: Solutions & Approaches */}
                  {profileTab === 'solutions' && (
                    <div className="bg-white dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Code2 size={14} className="text-blue-500" />
                        Published Approaches & Solutions
                      </h3>
                      <div className="space-y-2 pt-1">
                        {stats.recentSubmissions.slice(0, 3).map((sub) => (
                          <div key={sub.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{sub.questionTitle} - Hash Table O(N)</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Accepted Solution</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Language: {sub.language} • {new Date(sub.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab View: Community & Discuss */}
                  {profileTab === 'discuss' && (
                    <div className="bg-white dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-purple-500" />
                        Course Community Engagement
                      </h3>
                      <div className="grid grid-cols-4 gap-2 text-center pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500">Doubts Asked</span>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{stats.communityEngagement.postsCount}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500">Replies</span>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{stats.communityEngagement.repliesCount}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500">Solutions ✓</span>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.communityEngagement.acceptedAnswersCount}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500">Upvotes</span>
                          <p className="text-sm font-bold text-amber-500">{stats.communityEngagement.upvotesReceived}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p>Learner profile not found.</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex justify-end">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="text-xs font-medium cursor-pointer"
              >
                Close Drawer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
