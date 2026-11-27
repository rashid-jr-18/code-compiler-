'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment, AssignmentLearner, AuthoritativeSubmission, ProctoringSession } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Eye, 
  RotateCw, 
  Award, 
  Download,
  ExternalLink,
  Code2,
  FileCheck,
  AlertCircle,
  RotateCcw,
  Users,
  Camera,
  ShieldAlert,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FacultyResultsProps {
  assignment: Assignment;
  onBack: () => void;
  isDirectLaunch?: boolean;
}

interface ResultItem extends AssignmentLearner {
  latestSubmission?: AuthoritativeSubmission | null;
  proctoringSession?: ProctoringSession | null;
}

export default function FacultyResults({ assignment, onBack, isDirectLaunch = false }: FacultyResultsProps) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectItem, setInspectItem] = useState<ResultItem | null>(null);
  const [inspectTab, setInspectTab] = useState<'code' | 'proctoring'>('code');
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [lineItemUrl, setLineItemUrl] = useState<string | undefined>(assignment.lineItemUrl);
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);

  const handleSyncRoster = async () => {
    setIsSyncingRoster(true);
    const toastId = toast.loading('Syncing latest student roster from Brightspace LMS...');
    try {
      const res = await fetch(`/compiler/api/courses/${assignment.courseId}/sync-roster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync classlist');

      toast.success(`Classlist synced! ${data.count || 0} learners updated.`, { id: toastId });
      fetchResults();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sync failed', { id: toastId });
    } finally {
      setIsSyncingRoster(false);
    }
  };

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/compiler/api/assignments/${assignment.id}/results`, {
        headers: { 'x-user-role': 'FACULTY' }
      });
      if (!res.ok) throw new Error('Failed to load assessment results');
      const data = await res.json();
      setResults(data.results || []);
      if (data.assignment?.lineItemUrl) {
        setLineItemUrl(data.assignment.lineItemUrl);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error fetching results');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [assignment.id]);

  const handleToggleReviewed = async (item: ResultItem) => {
    const newReviewed = !item.reviewed;
    try {
      const res = await fetch(`/compiler/api/assignments/${assignment.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        },
        body: JSON.stringify({
          assignmentLearnerId: item.id,
          reviewed: newReviewed
        })
      });

      if (!res.ok) throw new Error('Failed to update review status');

      toast.success(newReviewed ? 'Result marked as Reviewed' : 'Result unmarked as Reviewed');
      setResults(prev =>
        prev.map(r => r.id === item.id ? { ...r, reviewed: newReviewed, status: newReviewed ? 'REVIEWED' : 'SUBMITTED' } : r)
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update review');
    }
  };

  const [isBulkExporting, setIsBulkExporting] = useState(false);

  const handleExportToGradebook = async (item: ResultItem) => {
    if (!item.reviewed) {
      toast.error('You must review and approve this submission before exporting to Brightspace Gradebook');
      return;
    }

    setExportingId(item.id);
    const toastId = toast.loading(`Exporting grade for ${item.learner?.name}...`);

    try {
      const res = await fetch('/compiler/api/d2l/grade-passback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        },
        body: JSON.stringify({
          assignmentLearnerId: item.id
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to export grade to Brightspace');
      }

      toast.success(`Exported ${item.score}/${assignment.maxPoints} to Brightspace!`, { id: toastId });
      // Optimistically update result immediately!
      setResults(prev => prev.map(r => r.id === item.id ? { ...r, exported: true, passbackStatus: 'SUCCESS', status: 'EXPORTED' } : r));
      fetchResults();

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export failed', { id: toastId });
    } finally {
      setExportingId(null);
    }
  };

  const handleExportAllReviewed = async () => {
    const unexportedReviewed = results.filter(r => r.reviewed && !r.exported);
    if (unexportedReviewed.length === 0) {
      toast('No unexported reviewed grades to export', { icon: 'ℹ️' });
      return;
    }

    setIsBulkExporting(true);
    const toastId = toast.loading(`Exporting ${unexportedReviewed.length} reviewed grades to Brightspace...`);

    try {
      const res = await fetch('/compiler/api/d2l/grade-passback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        },
        body: JSON.stringify({
          assignmentLearnerIds: unexportedReviewed.map(r => r.id)
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Bulk export failed');
      }

      toast.success(`Successfully exported ${unexportedReviewed.length} grades to Brightspace!`, { id: toastId });
      // Optimistically update all
      setResults(prev => prev.map(r => (r.reviewed && !r.exported) ? { ...r, exported: true, passbackStatus: 'SUCCESS', status: 'EXPORTED' } : r));
      fetchResults();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bulk export failed', { id: toastId });
    } finally {
      setIsBulkExporting(false);
    }
  };

  const handleMarkAllReviewed = async () => {
    const unreviewed = results.filter(r => !r.reviewed && r.status !== 'ASSIGNED');
    if (unreviewed.length === 0) {
      toast('All submitted assessments are already reviewed.', { icon: 'ℹ️' });
      return;
    }

    const toastId = toast.loading(`Marking ${unreviewed.length} submissions as reviewed...`);
    try {
      const res = await fetch(`/compiler/api/assignments/${assignment.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        },
        body: JSON.stringify({ action: 'REVIEW_ALL' })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to mark all as reviewed');

      toast.success(`Marked ${data.count || unreviewed.length} submissions as reviewed!`, { id: toastId });
      setResults(prev => prev.map(r => r.status !== 'ASSIGNED' ? { ...r, reviewed: true, status: 'REVIEWED' } : r));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark reviewed', { id: toastId });
    }
  };

  const handleResetAttempt = async (item: ResultItem) => {
    if (!window.confirm(`Are you sure you want to allow "${item.learner?.name}" to rewrite the exam? This will clear their current score and submission so they can take the assessment again.`)) {
      return;
    }

    const toastId = toast.loading(`Resetting attempt for ${item.learner?.name}...`);
    try {
      const res = await fetch(`/compiler/api/assignments/${assignment.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY'
        },
        body: JSON.stringify({
          action: 'RESET_ATTEMPT',
          assignmentLearnerId: item.id,
          learnerId: item.learnerId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reset attempt');

      toast.success(`Attempt reset for ${item.learner?.name}. They can now retake the assessment!`, { id: toastId });
      fetchResults();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset attempt', { id: toastId });
    }
  };

  const reviewedCount = results.filter(r => r.reviewed).length;
  const exportedCount = results.filter(r => r.exported).length;

  return (
    <div className={`space-y-4 sm:space-y-6 ${isDirectLaunch ? 'w-full' : 'w-full max-w-7xl mx-auto'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          {!isDirectLaunch && (
            <button
              onClick={onBack}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-1"
            >
              ← Back to Assessments
            </button>
          )}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {assignment.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Assessment Results & Gradebook Approval (Max: {assignment.maxPoints} pts)
            </p>
            {lineItemUrl ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full" title={lineItemUrl}>
                <CheckCircle2 size={11} /> Brightspace Gradebook Linked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full" title="Launch this assessment topic from Brightspace once to synchronize the Grade Item URL">
                <AlertCircle size={11} /> Gradebook Link Pending
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <span className="text-slate-500">Reviewed: </span>
            <span className="font-bold text-slate-900 dark:text-white">{reviewedCount}/{results.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <span className="text-slate-500">Exported: </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{exportedCount}/{results.length}</span>
          </div>

          {results.some(r => !r.reviewed && r.status !== 'ASSIGNED') && (
            <Button
              onClick={handleMarkAllReviewed}
              size="sm"
              variant="outline"
              className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs gap-1.5 shadow-2xs font-semibold"
            >
              <CheckCircle2 size={13} className="text-blue-600 dark:text-blue-400" />
              Mark All as Reviewed ({results.filter(r => !r.reviewed && r.status !== 'ASSIGNED').length})
            </Button>
          )}

          {results.some(r => r.reviewed && !r.exported) && (
            <Button
              onClick={handleExportAllReviewed}
              disabled={isBulkExporting}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm font-medium"
            >
              <Send size={12} />
              Export All Reviewed ({results.filter(r => r.reviewed && !r.exported).length})
            </Button>
          )}

          <Button
            onClick={handleSyncRoster}
            disabled={isSyncingRoster}
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs gap-1.5 font-medium cursor-pointer shadow-2xs"
            title="Sync all enrolled students from Brightspace Classlist"
          >
            <Users size={13} className={isSyncingRoster ? 'animate-spin text-blue-500' : 'text-slate-500'} />
            <span>Sync Roster</span>
          </Button>

          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/compiler/api/assignments/${assignment.id}/export`;
              link.setAttribute('download', `assessment_${assignment.title}_results.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success(`Exporting results for "${assignment.title}"...`);
            }}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs gap-1.5 font-medium"
            title="Download results as CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </Button>

          <Button
            onClick={fetchResults}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh Results"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>


      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Learner</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Score</th>
                <th className="px-5 py-3.5 text-center">Faculty Review</th>
                <th className="px-5 py-3.5 text-center">Gradebook Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map(item => {
                const isSubmitted = item.status === 'SUBMITTED' || item.status === 'REVIEWED' || item.status === 'EXPORTED';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Learner Info */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.learner?.name || item.learnerId}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.learner?.email}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isSubmitted
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-5 py-4 text-center">
                      <div className="font-extrabold text-base text-gray-900 dark:text-white">
                        {item.score} <span className="text-xs text-gray-400 font-normal">/ {assignment.maxPoints}</span>
                      </div>
                    </td>

                    {/* Review Status Toggle */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleReviewed(item)}
                        disabled={!isSubmitted}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          item.reviewed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-500/40'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                        } disabled:opacity-40`}
                      >
                        {item.reviewed ? (
                          <><CheckCircle2 size={14} /> Reviewed</>
                        ) : (
                          <><Clock size={14} /> Needs Review</>
                        )}
                      </button>
                    </td>

                    {/* Brightspace Status */}
                    <td className="px-5 py-4 text-center">
                      {item.exported ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={12} /> Exported
                        </span>
                      ) : item.passbackStatus === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/40 px-2.5 py-1 rounded-full" title={item.passbackError}>
                          <AlertCircle size={12} /> Export Failed
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Not Exported
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status !== 'ASSIGNED' && (
                          <Button
                            onClick={() => handleResetAttempt(item)}
                            variant="outline"
                            size="sm"
                            className="border-amber-300 dark:border-amber-700/60 text-xs gap-1 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium"
                            title="Reset submission so the learner can re-take this assessment"
                          >
                            <RotateCcw size={12} /> Allow Re-attempt
                          </Button>
                        )}

                        {item.latestSubmission && (
                          <Button
                            onClick={() => {
                              setInspectItem(item);
                              setInspectTab('code');
                            }}
                            variant="outline"
                            size="sm"
                            className="border-slate-200 dark:border-slate-700 text-xs gap-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye size={12} /> Inspect
                          </Button>
                        )}

                        {item.proctoringSession && (
                          <Button
                            onClick={() => {
                              setInspectItem(item);
                              setInspectTab('proctoring');
                            }}
                            variant="outline"
                            size="sm"
                            className={`text-xs gap-1 font-medium ${
                              item.proctoringSession.totalViolations > 0
                                ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400'
                                : 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400'
                            }`}
                            title="View Proctoring Snapshots & Integrity Timeline"
                          >
                            <Camera size={12} />
                            <span>Evidence ({item.proctoringSession.events?.filter(e => e.evidenceImageUrl).length || 0})</span>
                          </Button>
                        )}

                        <Button
                          onClick={() => handleExportToGradebook(item)}
                          disabled={!item.reviewed || exportingId === item.id}
                          size="sm"
                          className={`text-xs gap-1.5 ${
                            item.exported
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          } disabled:opacity-40 font-medium`}
                          title={!item.reviewed ? 'Must review before exporting to Gradebook' : ''}
                        >
                          <Send size={12} />
                          {item.exported ? 'Re-export' : 'Export to Gradebook'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {results.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No learners assigned to this assessment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code & Proctoring Inspection Modal */}
      <AnimatePresence>
        {inspectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/90">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <Code2 className="text-blue-600 dark:text-blue-400 shrink-0" size={18} />
                    <span>{inspectItem.learner?.name}&apos;s Evaluation & Evidence</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>
                      Score: <strong className="text-blue-600 dark:text-blue-400">{inspectItem.score}/{assignment.maxPoints} pts</strong>
                    </span>
                    <span>•</span>
                    <span>Status: <strong>{inspectItem.status}</strong></span>
                    {inspectItem.proctoringSession && (
                      <>
                        <span>•</span>
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          inspectItem.proctoringSession.totalViolations > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <ShieldAlert size={12} />
                          {inspectItem.proctoringSession.totalViolations} Violation{inspectItem.proctoringSession.totalViolations !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabs Switcher: Code vs Proctoring Evidence */}
                <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold shrink-0">
                  <button
                    onClick={() => setInspectTab('code')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      inspectTab === 'code'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Code2 size={13} />
                    <span>Code & Tests</span>
                  </button>

                  <button
                    onClick={() => setInspectTab('proctoring')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      inspectTab === 'proctoring'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Camera size={13} />
                    <span>Evidence Snapshots</span>
                    {inspectItem.proctoringSession?.events && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {inspectItem.proctoringSession.events.filter(e => e.evidenceImageUrl).length}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setInspectItem(null);
                    setSelectedSnapshot(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white text-base cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-[360px]">
                {inspectTab === 'code' ? (
                  inspectItem.latestSubmission ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                          Submitted Source Code
                        </label>
                        <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg font-mono text-sm overflow-x-auto max-h-64 shadow-inner border border-slate-800">
                          {inspectItem.latestSubmission.code}
                        </pre>
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                          Test Case Results Breakdown
                        </label>
                        <div className="space-y-2">
                          {inspectItem.latestSubmission.testResults?.map((tr, idx) => (
                            <div
                              key={tr.testCaseId || idx}
                              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                {tr.passed ? (
                                  <CheckCircle2 size={16} className="text-emerald-500" />
                                ) : (
                                  <XCircle size={16} className="text-rose-500" />
                                )}
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  Test Case {idx + 1}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                                {tr.executionTime && <span>{tr.executionTime.toFixed(3)}s</span>}
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {tr.points}/{tr.maxPoints} pts
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No code submission recorded for this student yet.
                    </div>
                  )
                ) : (
                  /* Proctoring Evidence Tab */
                  <div className="space-y-4">
                    {!inspectItem.proctoringSession ? (
                      <div className="text-center py-12 text-slate-400 text-sm">
                        <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-medium text-slate-700 dark:text-slate-300">No Proctoring Session on Record</p>
                        <p className="text-xs text-slate-400 mt-1">This assessment may have been taken without webcam proctoring enabled.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Session Summary Card */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">Session Status: </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">{inspectItem.proctoringSession.status}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Consent Given At: </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">
                              {new Date(inspectItem.proctoringSession.consentAcceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Total Events Recorded: </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">
                              {inspectItem.proctoringSession.events?.length || 0}
                            </span>
                          </div>
                        </div>

                        {/* Snapshot Gallery & Security Log Grid */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                            <ImageIcon size={14} className="text-blue-500" />
                            <span>Captured Camera Frames ({inspectItem.proctoringSession.events?.filter(e => e.evidenceImageUrl).length || 0})</span>
                          </h4>

                          {inspectItem.proctoringSession.events?.filter(e => e.evidenceImageUrl).length === 0 ? (
                            <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                              No image snapshots were captured during this exam session.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {inspectItem.proctoringSession.events
                                ?.filter(e => e.evidenceImageUrl)
                                .map((evt, idx) => (
                                  <div
                                    key={evt.id || idx}
                                    onClick={() => setSelectedSnapshot(evt.evidenceImageUrl || null)}
                                    className="group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                                  >
                                    <div className="aspect-4/3 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                                      <img
                                        src={evt.evidenceImageUrl}
                                        alt={`Evidence ${idx + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        loading="lazy"
                                      />
                                    </div>

                                    <div className="p-2 bg-white dark:bg-slate-900 text-[10px]">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`px-1.5 py-0.5 rounded-sm font-semibold truncate ${
                                          evt.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                          evt.severity === 'WARNING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                          'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                        }`}>
                                          {evt.eventType.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-slate-400 whitespace-nowrap">
                                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                      </div>
                                      {evt.notes && (
                                        <p className="text-slate-500 dark:text-slate-400 truncate mt-1 text-[9.5px]">
                                          {evt.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Full Audit Log Table */}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                            Session Event Timeline
                          </h4>
                          <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                            <table className="w-full text-left">
                              <thead className="bg-slate-100 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                                <tr>
                                  <th className="p-2">Time</th>
                                  <th className="p-2">Event</th>
                                  <th className="p-2">Severity</th>
                                  <th className="p-2">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                                {inspectItem.proctoringSession.events?.map((e, i) => (
                                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                    <td className="p-2 whitespace-nowrap text-slate-400">
                                      {new Date(e.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="p-2 font-medium text-slate-700 dark:text-slate-300">
                                      {e.eventType}
                                    </td>
                                    <td className="p-2">
                                      <span className={`px-1.5 py-0.5 rounded-xs font-semibold text-[10px] ${
                                        e.severity === 'CRITICAL' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' :
                                        e.severity === 'WARNING' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' :
                                        'text-slate-500 bg-slate-100 dark:bg-slate-800'
                                      }`}>
                                        {e.severity}
                                      </span>
                                    </td>
                                    <td className="p-2 text-slate-500 truncate max-w-xs">{e.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <Button
                  onClick={() => {
                    handleResetAttempt(inspectItem);
                    setInspectItem(null);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold gap-1.5"
                >
                  <RotateCcw size={13} />
                  Allow Student Re-attempt
                </Button>

                <Button
                  onClick={() => {
                    setInspectItem(null);
                    setSelectedSnapshot(null);
                  }}
                  size="sm"
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-4"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Snapshot Lightbox */}
      <AnimatePresence>
        {selectedSnapshot && (
          <div 
            onClick={() => setSelectedSnapshot(null)}
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-3xl max-h-[85vh] bg-slate-950 p-2 rounded-xl shadow-2xl border border-slate-800">
              <img
                src={selectedSnapshot}
                alt="Enlarged evidence frame"
                className="max-h-[80vh] w-auto rounded-lg object-contain"
              />
              <p className="text-center text-xs text-slate-400 mt-2">Click anywhere to dismiss</p>
            </div>
          </div>
        )}
      </AnimatePresence>
                  onClick={() => {
                    handleResetAttempt(inspectItem);
                    setInspectItem(null);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold gap-1.5"
                >
                  <RotateCcw size={13} />
                  Allow Student Re-attempt
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setInspectItem(null)}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleToggleReviewed(inspectItem);
                      setInspectItem(prev => prev ? { ...prev, reviewed: !prev.reviewed } : null);
                    }}
                    size="sm"
                    className={inspectItem.reviewed ? 'bg-amber-600 text-white' : 'bg-green-600 text-white'}
                  >
                    {inspectItem.reviewed ? 'Unmark Reviewed' : 'Mark as Reviewed'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

