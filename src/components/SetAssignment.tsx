'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Question, Course, CourseMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import { PlusCircle, Calendar, CheckSquare, Square, Users, BookOpen, Save, Award, Search, Filter, X, Shield, ShieldAlert, Camera, Monitor, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuestionStore } from '@/store/questionStore';
import { useAdminStore } from '@/store/adminStore';

interface SetAssignmentProps {
  course: Course;
  containerId?: string;
  containerName?: string;
  onAssignmentCreated: () => void;
  onCancel?: () => void;
}

export default function SetAssignment({ 
  course, 
  containerId,
  containerName,
  onAssignmentCreated,
  onCancel
}: SetAssignmentProps) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('Please review each problem carefully and submit your solution before the due date.');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const { questions: storeQuestions } = useQuestionStore();
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>(() => storeQuestions || []);
  const [selectedQuestions, setSelectedQuestions] = useState<Array<{ questionId: string; points: number }>>([]);
  const [enrolledLearners, setEnrolledLearners] = useState<CourseMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter state for problem library
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

  // Institution Policy from Admin Control Panel
  const { settings } = useAdminStore();
  const policy = settings?.institutionPolicy || {
    allowCameraProctoring: true,
    allowKioskMode: true,
    allowAutoSubmit: true,
    minViolationLimit: 3,
    allowCopyPaste: false,
  };

  // Proctoring & Exam Security State
  const [enableCamera, setEnableCamera] = useState(false);
  const [enableKiosk, setEnableKiosk] = useState(false);
  const [violationLimit, setViolationLimit] = useState(policy.minViolationLimit || 3);
  const [actionOnLimit, setActionOnLimit] = useState<'AUTO_SUBMIT' | 'FLAG_REVIEW' | 'WARN_ONLY'>('FLAG_REVIEW');
  const [snapshotInterval, setSnapshotInterval] = useState(30);

  useEffect(() => {
    // Initial sync from store
    if (storeQuestions && storeQuestions.length > 0) {
      setAvailableQuestions(prev => {
        const map = new Map<string, Question>();
        (prev || []).forEach(q => map.set(q.id, q));
        storeQuestions.forEach(q => map.set(q.id, q));
        return Array.from(map.values());
      });
    }

    // Fetch questions from API
    fetch('/api/questions', {
      headers: {
        'x-user-role': 'FACULTY'
      }
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableQuestions(prev => {
            const map = new Map<string, Question>();
            (storeQuestions || []).forEach(q => map.set(q.id, q));
            (prev || []).forEach(q => map.set(q.id, q));
            data.forEach((q: Question) => map.set(q.id, q));
            return Array.from(map.values());
          });
        }
      })
      .catch(err => console.error('Failed to load questions:', err));

    // Fetch enrolled learners in this course
    fetch(`/api/courses/${course.id}/members`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CourseMember[]) => {
        if (Array.isArray(data)) {
          const learners = data.filter(m => m.role === 'LEARNER');
          setEnrolledLearners(learners);
        }
      })
      .catch(err => console.error('Failed to load course members:', err));
  }, [course.id]);

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => {
      const exists = prev.find(q => q.questionId === questionId);
      if (exists) {
        return prev.filter(q => q.questionId !== questionId);
      } else {
        return [...prev, { questionId, points: 50 }];
      }
    });
  };

  const updateQuestionPoints = (questionId: string, points: number) => {
    setSelectedQuestions(prev =>
      prev.map(q => q.questionId === questionId ? { ...q, points: Math.max(1, points) } : q)
    );
  };

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter an assignment title');
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one problem for this assignment');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating course assignment...');

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        },
        body: JSON.stringify({
          containerId: containerId || undefined,
          courseId: course.id,
          title: title.trim(),
          instructions: instructions.trim(),
          maxPoints: totalPoints,
          dueDate: new Date(dueDate).toISOString(),
          questions: selectedQuestions,
          learnerIds: enrolledLearners.map(l => l.userId),
          proctoringConfig: {
            enableCamera: policy.allowCameraProctoring ? enableCamera : false,
            enableKiosk: policy.allowKioskMode ? enableKiosk : false,
            violationLimit: Math.max(policy.minViolationLimit || 1, violationLimit),
            actionOnLimit: (actionOnLimit === 'AUTO_SUBMIT' && !policy.allowAutoSubmit) ? 'FLAG_REVIEW' : actionOnLimit,
            snapshotIntervalSeconds: snapshotInterval,
          }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create assignment');
      }

      toast.success('Assignment created & published to learners!', { id: toastId });
      onAssignmentCreated();

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error creating assignment', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter problem library based on search and selected filters
  const categories = Array.from(new Set(availableQuestions.map(q => q.category).filter(Boolean)));

  const filteredQuestions = availableQuestions.filter(q => {
    const qText = `${q.title} ${q.category} ${q.description || ''} ${(q.tags || []).join(' ')}`.toLowerCase();
    const matchesSearch = !searchQuery.trim() || qText.includes(searchQuery.toLowerCase().trim());
    const matchesCategory = selectedCategory === 'ALL' || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'ALL' || q.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Assessment Setup
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {course.title}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <PlusCircle className="text-blue-600 dark:text-blue-400" />
            <span>Set Course Assessment</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
            <span>Container: <strong className="text-slate-700 dark:text-slate-300">{containerName || 'General Assessment'}</strong></span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">👥 {enrolledLearners.length || 7} Enrolled Learners will be assigned</span>
          </p>
        </div>

        {/* Top Summary & Quick Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right pr-3 border-r border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Marks</span>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {totalPoints} <span className="text-xs font-normal text-slate-400">pts ({selectedQuestions.length} Qs)</span>
            </div>
          </div>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="text-xs h-10 px-4 rounded-xl border-slate-300 dark:border-slate-700"
            >
              Cancel
            </Button>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedQuestions.length === 0 || !title.trim()}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            <span>{isSubmitting ? 'Creating...' : 'Create & Publish'}</span>
          </Button>
        </div>
      </div>

      {/* 2-Column Split Workspace */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column: Assessment Meta + Selected Questions Live Cart (Sticky) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          {/* Assessment Meta Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen size={14} className="text-blue-500" />
              <span>1. Assessment Information</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assessment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Midterm Coding Assessment - Algorithms & SQL"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Due Date</span> <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Instructions for Students
                </label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="Instructions, allowed languages, complexity bounds..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Exam Security & Proctoring Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-purple-600 dark:text-purple-400" />
                <span>2. Exam Security & Proctoring</span>
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Institutional Policy Active
              </span>
            </div>

            <div className="space-y-3">
              {/* Option 1: Camera Proctoring */}
              <div className={`p-3 rounded-xl border transition-all ${
                !policy.allowCameraProctoring
                  ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                  : enableCamera
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Camera size={14} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">AI Camera Proctoring</span>
                      {!policy.allowCameraProctoring && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/30 rounded">
                          Disabled by Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Live face detection to flag when student looks away or multiple faces appear.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!policy.allowCameraProctoring}
                    checked={enableCamera && policy.allowCameraProctoring}
                    onChange={e => setEnableCamera(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer mt-0.5"
                  />
                </div>

                {enableCamera && policy.allowCameraProctoring && (
                  <div className="mt-2.5 pt-2 border-t border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">Snapshot Frequency:</span>
                    <select
                      value={snapshotInterval}
                      onChange={e => setSnapshotInterval(Number(e.target.value))}
                      className="px-2 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value={15}>Every 15s (Strict)</option>
                      <option value={30}>Every 30s (Balanced)</option>
                      <option value={60}>Every 60s (Light)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Option 2: Kiosk Lockdown */}
              <div className={`p-3 rounded-xl border transition-all ${
                !policy.allowKioskMode
                  ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                  : enableKiosk
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Monitor size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Browser Kiosk Mode</span>
                      {!policy.allowKioskMode && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/30 rounded">
                          Disabled by Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Force fullscreen, detect tab switches, and block copy-paste from external sources.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!policy.allowKioskMode}
                    checked={enableKiosk && policy.allowKioskMode}
                    onChange={e => setEnableKiosk(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer mt-0.5"
                  />
                </div>
              </div>

              {/* Settings for Violations when Camera or Kiosk is active */}
              {(enableCamera || enableKiosk) && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Violation Warning Limit:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={policy.minViolationLimit || 1}
                        max={10}
                        value={violationLimit}
                        onChange={e => setViolationLimit(Math.max(policy.minViolationLimit || 1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                      <span className="text-[11px] text-slate-400">warnings</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Action When Limit Exceeded:
                    </label>
                    <select
                      value={actionOnLimit}
                      onChange={e => setActionOnLimit(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none"
                    >
                      <option value="FLAG_REVIEW">🚩 Flag for Review & Allow to Continue (Recommended)</option>
                      {policy.allowAutoSubmit ? (
                        <option value="AUTO_SUBMIT">🛑 Auto-Submit Assessment Immediately (Strict Exam)</option>
                      ) : (
                        <option value="AUTO_SUBMIT" disabled>🛑 Auto-Submit (Disabled by Admin Policy)</option>
                      )}
                      <option value="WARN_ONLY">⚠️ Warn Student Only (Silent logging)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Questions Live Cart Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Award size={14} className="text-emerald-500" />
                <span>3. Selected Problems ({selectedQuestions.length})</span>
              </h3>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {totalPoints} Total Pts
              </span>
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No problems selected yet</p>
                <p className="text-[11px] text-slate-400">Click &quot;+ Add&quot; or check boxes in the library on the right.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {selectedQuestions.map((item, idx) => {
                  const q = availableQuestions.find(aq => aq.id === item.questionId);
                  return (
                    <div key={item.questionId} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[11px] font-bold text-slate-400">{idx + 1}.</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {q?.title || item.questionId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-semibold ${
                            q?.difficulty?.toLowerCase() === 'easy' ? 'text-teal-600' :
                            q?.difficulty?.toLowerCase() === 'hard' ? 'text-rose-500' : 'text-amber-500'
                          }`}>
                            {q?.difficulty || 'Medium'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400">{q?.category || 'Algorithm'}</span>
                        </div>
                      </div>

                      {/* Points Editor & Remove Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={item.points}
                            onChange={e => updateQuestionPoints(item.questionId, Number(e.target.value) || 1)}
                            className="w-12 h-7 px-1 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-blue-400 rounded-lg text-xs"
                          />
                          <span className="text-[10px] text-slate-400">pts</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleQuestionSelection(item.questionId)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Remove problem"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions Card */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="text-xs h-9 px-4 rounded-xl border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || selectedQuestions.length === 0 || !title.trim()}
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSubmitting ? 'Creating...' : 'Create & Publish'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Problem Library Browser */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={17} className="text-blue-600 dark:text-blue-400" />
                  <span>Problem Library</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select questions from the course library to include in this assessment
                </p>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {selectedQuestions.length} selected
              </span>
            </div>

            {/* Filter Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Search Input */}
              <div className="relative sm:col-span-6">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search problem title or tag..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={selectedDifficulty}
                  onChange={e => setSelectedDifficulty(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Quick Difficulty Pills */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-1.5">
                {['ALL', 'Easy', 'Medium', 'Hard'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDifficulty(d)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedDifficulty.toLowerCase() === d.toLowerCase()
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-slate-400">
                {filteredQuestions.length} problems found
              </span>
            </div>

            {/* Problem Library List with internal scroll (Never scroll whole page!) */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {filteredQuestions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <p>No questions matching your filters.</p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setSelectedDifficulty('ALL'); }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredQuestions.map((q, index) => {
                  const selectedItem = selectedQuestions.find(item => item.questionId === q.id);
                  const isSelected = !!selectedItem;

                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestionSelection(q.id)}
                      className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Left: Checkbox & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="text-blue-600 dark:text-blue-400" size={17} />
                          ) : (
                            <Square className="text-slate-400 hover:text-blue-500" size={17} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-slate-400 font-mono text-[11px]">{index + 1}.</span>
                            <span className={`font-bold truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                              {q.title}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                              q.difficulty?.toLowerCase() === 'easy' ? 'text-teal-600 border-teal-500/30 bg-teal-500/10' :
                              q.difficulty?.toLowerCase() === 'hard' ? 'text-rose-600 border-rose-500/30 bg-rose-500/10' :
                              'text-amber-600 border-amber-500/30 bg-amber-500/10'
                            }`}>
                              {q.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{q.category}</span>
                            <span>•</span>
                            <span>{q.testCases?.length || 0} test cases</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Marks Editor if Selected */}
                      <div className="shrink-0" onClick={e => e.stopPropagation()}>
                        {isSelected ? (
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-blue-300 dark:border-blue-700">
                            <input
                              type="number"
                              min="1"
                              max="200"
                              value={selectedItem.points}
                              onChange={e => updateQuestionPoints(q.id, Number(e.target.value) || 1)}
                              className="w-12 h-6 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 pr-1">pts</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleQuestionSelection(q.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

