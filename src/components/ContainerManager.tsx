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
  Users
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
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Array<{ questionId: string; points: number }>>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          questions: selectedQuestionIds
        })
      });

      const created = await res.json();
      if (!res.ok || !created.id) {
        throw new Error(created.error || 'Failed to create assessment');
      }

      toast.success(`Child assessment "${created.title}" created successfully!`, { id: toastId });
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
        headers: { 'x-user-role': 'FACULTY' }
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`"${title}" deleted successfully`);
      fetchChildAssessments();
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Container Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              Parent Container
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {course.code || course.title.split(':')[0]}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2.5 tracking-tight">
            <Layers className="text-blue-600 dark:text-blue-400" size={24} />
            {container.name}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Assessment Management • Create and manage child assessments for this module
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              if (onSetAssignment) {
                onSetAssignment();
              } else {
                resetForm();
                setIsCreateOpen(true);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm gap-2 shadow-sm rounded-lg"
          >
            <PlusCircle size={15} />
            <span>Set Assignment</span>
          </Button>

          <Button
            onClick={fetchChildAssessments}
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh Assessments"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Child Assessments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileCode size={16} className="text-blue-600 dark:text-blue-400" />
            Existing Assessments ({childAssessments.length})
          </h3>
          <span className="text-xs text-slate-500">
            Each child assessment has its own questions, submissions, and export.
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
            Loading child assessments...
          </div>
        ) : childAssessments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-xl text-center border border-slate-300 dark:border-slate-800 space-y-4 shadow-sm">
            <BookOpen size={48} className="mx-auto text-slate-400 opacity-60" />
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                No child assessments in &quot;{container.name}&quot; yet
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Click &quot;Create Assessment&quot; above to create your first dynamic child assessment (e.g. Python, Java, C Programming).
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
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium rounded-lg shadow-sm"
            >
              <PlusCircle size={15} />
              <span>Set First Assessment</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
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
                  whileHover={{ y: -2 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <Code2 size={18} />
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {asg.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar size={12} className="text-slate-400" />
                            Due: {dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isPastDue && <span className="text-rose-500 font-bold ml-1">(Past Due)</span>}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Max: {asg.maxPoints} pts
                          </span>
                          <span>•</span>
                          <span>{(asg.questions || []).length} Problem{(asg.questions || []).length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 pl-10">
                      {asg.instructions}
                    </p>
                  </div>

                  {/* Submission Stats & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    {/* Submission Count Badge */}
                    <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium flex items-center gap-1.5 mr-1 text-slate-700 dark:text-slate-300">
                      <Users size={13} className="text-slate-400" />
                      <span>{submittedCount}/{totalLearners} Submitted</span>
                    </div>

                    {/* View Results */}
                    <Button
                      onClick={() => onViewResults(asg)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-medium rounded-lg shadow-sm"
                    >
                      <BarChart3 size={13} />
                      <span>View Results</span>
                    </Button>

                    {/* Export CSV */}
                    <Button
                      onClick={() => handleExportCsv(asg)}
                      variant="outline"
                      size="sm"
                      className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs gap-1.5 font-medium"
                      title="Download results as CSV"
                    >
                      <Download size={13} />
                      <span>Export CSV</span>
                    </Button>

                    {/* Open / Solve Preview */}
                    <Button
                      onClick={() => onOpenAssessment(asg)}
                      variant="outline"
                      size="sm"
                      className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs gap-1"
                      title="Preview solver workspace"
                    >
                      <Code2 size={13} />
                      <span>Open</span>
                    </Button>

                    {/* Edit */}
                    <Button
                      onClick={() => setEditingAssessment(asg)}
                      variant="outline"
                      size="sm"
                      className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs p-2"
                      title="Edit assessment details"
                    >
                      <Edit3 size={13} />
                    </Button>

                    {/* Delete */}
                    <Button
                      onClick={() => handleDelete(asg.id, asg.title)}
                      disabled={deletingId === asg.id}
                      variant="outline"
                      size="sm"
                      className="border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs p-2"
                      title="Delete assessment"
                    >
                      <Trash2 size={13} />
                    </Button>
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

