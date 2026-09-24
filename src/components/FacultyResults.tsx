'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment, AssignmentLearner, AuthoritativeSubmission } from '@/types';
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
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FacultyResultsProps {
  assignment: Assignment;
  onBack: () => void;
}

interface ResultItem extends AssignmentLearner {
  latestSubmission?: AuthoritativeSubmission | null;
}

export default function FacultyResults({ assignment, onBack }: FacultyResultsProps) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectItem, setInspectItem] = useState<ResultItem | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/assignments/${assignment.id}/results`, {
        headers: { 'x-user-role': 'FACULTY' }
      });
      if (!res.ok) throw new Error('Failed to load assessment results');
      const data = await res.json();
      setResults(data.results || []);
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
      const res = await fetch(`/api/assignments/${assignment.id}/results`, {
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
      const res = await fetch('/api/d2l/grade-passback', {
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
      const res = await fetch('/api/d2l/grade-passback', {
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

  const reviewedCount = results.filter(r => r.reviewed).length;
  const exportedCount = results.filter(r => r.exported).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-1"
          >
            ← Back to Assessments
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {assignment.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Assessment Results & Gradebook Approval (Max: {assignment.maxPoints} pts)
          </p>
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
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/api/assignments/${assignment.id}/export`;
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
                        {item.latestSubmission && (
                          <Button
                            onClick={() => setInspectItem(item)}
                            variant="outline"
                            size="sm"
                            className="border-slate-200 dark:border-slate-700 text-xs gap-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye size={12} /> Inspect
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

      {/* Code Inspection Modal */}
      <AnimatePresence>
        {inspectItem && inspectItem.latestSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Code2 className="text-blue-600 dark:text-blue-400" />
                    {inspectItem.learner?.name}&apos;s Submission
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Score: <span className="font-semibold text-blue-600 dark:text-blue-400">{inspectItem.score}/{assignment.maxPoints} pts</span> • Status: {inspectItem.latestSubmission.status}
                  </p>
                </div>
                <button
                  onClick={() => setInspectItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
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

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

