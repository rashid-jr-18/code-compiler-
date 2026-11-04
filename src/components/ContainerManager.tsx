'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssessmentContainer, Assignment, Course, Question, CourseMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import { 
  PlusCircle, 
  Layers, 
  Calendar, 
  Download, 
  BarChart3, 
  Edit3, 
  Trash2, 
  Code2, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  Search,
  X,
  FileCode,
  Users,
  Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ContainerManagerProps {
  container: AssessmentContainer;
  course: Course;
  onOpenAssessment: (asg: Assignment) => void;
  onViewResults: (asg: Assignment) => void;
  onContainerUpdated?: () => void;
  onSetAssignment?: () => void;
}

export default function ContainerManager({
  container,
  course,
  onOpenAssessment,
  onViewResults,
  onContainerUpdated,
  onSetAssignment
}: ContainerManagerProps) {
  const [childAssessments, setChildAssessments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State for Create Assessment
  const [assessmentName, setAssessmentName] = useState('');
  const [instructions, setInstructions] = useState('Solve the programming challenges provided. Test your solution thoroughly before final submission.');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [maxMarks, setMaxMarks] = useState('100');
  const [isTimed, setIsTimed] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Array<{ questionId: string; points: number }>>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);

  const handleSyncRoster = async () => {
    setIsSyncingRoster(true);
    const toastId = toast.loading('Syncing class roster from Brightspace...');
    try {
      const res = await fetch(`/api/courses/${course.id}/sync-roster`, {
        method: 'POST',
        headers: { 'x-user-role': 'FACULTY' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      toast.success(`Successfully synced ${data.count} learners from Brightspace!`, { id: toastId });
      fetchChildAssessments();
      onContainerUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync roster from Brightspace', { id: toastId });
    } finally {
      setIsSyncingRoster(false);
    }
  };

  // Fetch child assessments under this specific container
  const fetchChildAssessments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/assignments?containerId=${container.id}&courseId=${course.id}`, {
        headers: { 'x-user-role': 'FACULTY' }
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setChildAssessments(data);
      }
    } catch (err) {
      toast.error('Failed to load child assessments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildAssessments();

    // Fetch problem library questions for assessment creation
    fetch('/api/questions', { headers: { 'x-user-role': 'FACULTY' } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAvailableQuestions(data);
      })
      .catch(err => console.error('Failed to load questions:', err));
  }, [container.id, course.id]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentName.trim()) {
      toast.error('Please provide an assessment name');
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast.error('Please select at least one problem for this assessment');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Creating "${assessmentName}"...`);

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        },
        body: JSON.stringify({
          containerId: container.id,
          courseId: course.id,
          title: assessmentName.trim(),
          instructions: instructions.trim(),
          maxPoints: Number(maxMarks) || 100,
          startDate,
          dueDate,
          durationMinutes: isTimed && Number(durationMinutes) > 0 ? Number(durationMinutes) : undefined,
          questions: selectedQuestionIds
        })
      });

      const created = await res.json();
      if (!res.ok || !created.id) {
        throw new Error(created.error || 'Failed to create assessment');
      }

      if (created.brightspaceTopicCreated) {
        toast.success(`Child assessment "${created.title}" created & added to Brightspace sidebar!`, { id: toastId });
      } else if (created.brightspaceError) {
        toast.success(`Assessment created! (Brightspace sidebar note: ${created.brightspaceError})`, { id: toastId, duration: 6000 });
      } else {
        toast.success(`Child assessment "${created.title}" created successfully!`, { id: toastId });
      }
      setIsCreateOpen(false);
      resetForm();
      fetchChildAssessments();
      if (onContainerUpdated) onContainerUpdated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error creating assessment', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssessment) return;

    const toastId = toast.loading('Updating assessment...');
    try {
      const res = await fetch(`/api/assignments/${editingAssessment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        },
        body: JSON.stringify({
          title: editingAssessment.title,
          instructions: editingAssessment.instructions,
          maxPoints: editingAssessment.maxPoints,
          dueDate: editingAssessment.dueDate
        })
      });

      if (!res.ok) throw new Error('Update failed');
      toast.success('Assessment updated successfully', { id: toastId });
      setEditingAssessment(null);
      fetchChildAssessments();
    } catch (err) {
      toast.error('Failed to update assessment', { id: toastId });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? All student submissions for this assessment will be removed.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-user-role': 'FACULTY',
          'x-user-id': 'usr_faculty'
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`"${title}" deleted successfully`);
      fetchChildAssessments();
      onContainerUpdated?.();
    } catch (err) {
      toast.error('Failed to delete assessment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = (asg: Assignment) => {
    const downloadUrl = `/api/assignments/${asg.id}/export`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `assessment_${asg.title}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exporting results for "${asg.title}"...`);
  };

  const handleCopyLink = (asg: Assignment) => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://learning.edutechcloud.com';
    const cleanBase = base.replace(/\/$/, '');
    const url = cleanBase.includes('/compiler')
      ? `${cleanBase}/api/lti/launch?assignment_id=${encodeURIComponent(asg.id)}`
      : `${cleanBase}/compiler/api/lti/launch?assignment_id=${encodeURIComponent(asg.id)}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success(`Copied direct Brightspace launch link for "${asg.title}"!`);
      }).catch(() => {
        prompt('Copy direct launch link:', url);
      });
    } else {
      prompt('Copy direct launch link:', url);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => {
      const exists = prev.find(q => q.questionId === questionId);
      if (exists) {
        return prev.filter(q => q.questionId !== questionId);
      } else {
        return [...prev, { questionId, points: 50 }];
      }
    });
  };

  const resetForm = () => {
    setAssessmentName('');
    setInstructions('Solve the programming challenges provided. Test your solution thoroughly before final submission.');
    setMaxMarks('100');
    setSelectedQuestionIds([]);
  };

  const filteredQuestions = availableQuestions.filter(q =>
    q.title.toLowerCase().includes(questionSearch.toLowerCase()) ||
    q.category.toLowerCase().includes(questionSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-6xl mx-auto">
      {/* Container Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              Parent Container
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
              {course.code || course.title.split(':')[0]}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2 tracking-tight">
            <Layers className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
            <span className="truncate">{container.name}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Assessment Management • Create and manage child assessments for this module
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleSyncRoster}
            disabled={isSyncingRoster}
            variant="outline"
            size="sm"
            className="h-8.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium px-3 gap-1.5 rounded-lg"
            title="Fetch and sync enrolled students from Brightspace"
          >
            <Users size={14} className={isSyncingRoster ? 'animate-spin' : ''} />
            <span>Sync Roster</span>
          </Button>

          <Button
            onClick={() => {
              if (onSetAssignment) {
                onSetAssignment();
              } else {
                resetForm();
                setIsCreateOpen(true);
              }
            }}
            size="sm"
            className="h-8.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm px-3 gap-1.5 shadow-sm rounded-lg"
          >
            <PlusCircle size={15} />
            <span>Set Assignment</span>
          </Button>

          <Button
            onClick={fetchChildAssessments}
            variant="outline"
            size="sm"
            className="h-8.5 w-8.5 p-0 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh Assessments"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Child Assessments List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-0.5">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileCode size={15} className="text-blue-600 dark:text-blue-400" />
            Existing Assessments ({childAssessments.length})
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-500">
            Each child assessment has its own questions, submissions, and export.
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse text-sm">
            Loading child assessments...
          </div>
        ) : childAssessments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-xl text-center border border-slate-300 dark:border-slate-800 space-y-4 shadow-sm">
            <BookOpen size={42} className="mx-auto text-slate-400 opacity-60" />
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                No child assessments in &quot;{container.name}&quot; yet
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Click &quot;Set Assignment&quot; above to create your first dynamic child assessment (e.g. Python, Java, C Programming).
              </p>
            </div>
            <Button
              onClick={() => {
                if (onSetAssignment) {
                  onSetAssignment();
                } else {
                  resetForm();
                  setIsCreateOpen(true);
                }
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium rounded-lg shadow-sm"
            >
              <PlusCircle size={15} />
              <span>Set First Assessment</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
            {childAssessments.map(asg => {
              const submittedCount = (asg.learners || []).filter(
                l => l.status === 'SUBMITTED' || l.status === 'REVIEWED' || l.status === 'EXPORTED'
              ).length;
              const totalLearners = (asg.learners || []).length;
              const dueDateObj = new Date(asg.dueDate);
              const isPastDue = new Date() > dueDateObj;

              return (
                <motion.div
                  key={asg.id}
                  whileHover={{ y: -1 }}
                  className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col gap-3.5"
                >
                  {/* Top Tier: Title, Metadata, and Quick Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                        <Code2 size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug break-words">
                          {asg.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap">
                            <Calendar size={12} className="text-slate-400 shrink-0" />
                            Due: {dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isPastDue && <span className="text-rose-500 font-bold ml-1">(Past Due)</span>}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            Max: {asg.maxPoints} pts
                          </span>
                          {asg.durationMinutes && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                <Clock size={11} />
                                {asg.durationMinutes} Mins
                              </span>
                            </>
                          )}
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="whitespace-nowrap">{(asg.questions || []).length} Problem{(asg.questions || []).length !== 1 ? 's' : ''}</span>
                        </div>
                        {asg.instructions && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-1.5">
                            {asg.instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Utility Actions (Edit & Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        onClick={() => setEditingAssessment(asg)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                        title="Edit assessment details"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(asg.id, asg.title)}
                        disabled={deletingId === asg.id}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                        title="Delete assessment"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Bottom Tier: Submissions Status & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Left: Submission Count Badge */}
                    <div className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-xs font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Users size={13} className="text-slate-400" />
                      <span>{submittedCount}/{totalLearners} Submitted</span>
                    </div>

                    {/* Right: Primary Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Button
                        onClick={() => onViewResults(asg)}
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 sm:px-3 gap-1.5 font-medium rounded-lg shadow-xs"
                      >
                        <BarChart3 size={13} />
                        <span>View Results</span>
                      </Button>

                      <Button
                        onClick={() => handleExportCsv(asg)}
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs px-2.5 sm:px-3 gap-1.5 font-medium"
                        title="Download results as CSV"
                      >
                        <Download size={13} />
                        <span>Export CSV</span>
                      </Button>

                      <Button
                        onClick={() => onOpenAssessment(asg)}
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs px-2.5 sm:px-3 gap-1 font-medium"
                        title="Preview solver workspace"
                      >
                        <Code2 size={13} />
                        <span>Open</span>
                      </Button>

                      <Button
                        onClick={() => handleCopyLink(asg)}
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs px-2.5 sm:px-3 gap-1 font-medium"
                        title="Copy Direct Brightspace Launch Link"
                      >
                        <LinkIcon size={13} />
                        <span>LMS Link</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE ASSESSMENT MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PlusCircle className="text-blue-600 dark:text-blue-400" />
                    Create Child Assessment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Adding to parent container: <span className="font-semibold text-slate-900 dark:text-white">{container.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Assessment Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={assessmentName}
                    onChange={e => setAssessmentName(e.target.value)}
                    placeholder="e.g. Python, Java, C Programming, Algorithms..."
                    className="text-base font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Whatever name you provide here will be the title of this child assessment.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Student Instructions
                  </label>
                  <TextArea
                    rows={3}
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="Instructions for students taking this assessment..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                      Due Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      required
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                      Max Marks
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={maxMarks}
                      onChange={e => setMaxMarks(e.target.value)}
                    />
                  </div>
                </div>

                {/* Timed Assessment */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <Clock size={13} className="text-amber-500" />
                      <span>Timed Assessment (Live Countdown Timer)</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={isTimed}
                      onChange={e => setIsTimed(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    />
                  </div>
                  {isTimed && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                      <select
                        value={durationMinutes}
                        onChange={e => setDurationMinutes(e.target.value)}
                        className="px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                      >
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="60">60 Minutes (1 Hour)</option>
                        <option value="90">90 Minutes (1.5 Hours)</option>
                        <option value="120">120 Minutes (2 Hours)</option>
                        <option value="180">180 Minutes (3 Hours)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Problem Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Select Coding Problems ({selectedQuestionIds.length} Selected)
                    </label>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      Total Points: {selectedQuestionIds.reduce((sum, q) => sum + (q.points || 0), 0)} pts
                    </span>
                  </div>

                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                    <Input
                      type="text"
                      value={questionSearch}
                      onChange={e => setQuestionSearch(e.target.value)}
                      placeholder="Search problem library..."
                      className="pl-8 text-xs"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/40">
                    {filteredQuestions.map(q => {
                      const isSelected = selectedQuestionIds.some(sq => sq.questionId === q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestionSelection(q.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                              {isSelected && '✓'}
                            </span>
                            <span className="font-semibold">{q.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {q.difficulty}
                            </span>
                          </div>
                          <span className="text-slate-400 text-[10px]">{q.category}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Assessment'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ASSESSMENT MODAL */}
      <AnimatePresence>
        {editingAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={18} className="text-blue-600 dark:text-blue-400" />
                  Edit Assessment Details
                </h3>
                <button
                  onClick={() => setEditingAssessment(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Assessment Name
                  </label>
                  <Input
                    type="text"
                    required
                    value={editingAssessment.title}
                    onChange={e => setEditingAssessment({ ...editingAssessment, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Instructions
                  </label>
                  <TextArea
                    rows={2}
                    value={editingAssessment.instructions}
                    onChange={e => setEditingAssessment({ ...editingAssessment, instructions: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 block mb-1">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={new Date(editingAssessment.dueDate).toISOString().split('T')[0]}
                      onChange={e => setEditingAssessment({ ...editingAssessment, dueDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 block mb-1">
                      Max Marks
                    </label>
                    <Input
                      type="number"
                      value={editingAssessment.maxPoints}
                      onChange={e => setEditingAssessment({ ...editingAssessment, maxPoints: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingAssessment(null)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

