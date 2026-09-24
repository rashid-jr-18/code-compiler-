'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Assignment, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { FileCode, Calendar, Clock, CheckCircle, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface LearnerAssignmentsProps {
  course: Course;
  learnerId: string;
  onSelectAssignment: (assignment: Assignment) => void;
}

export default function LearnerAssignments({
  course,
  learnerId,
  onSelectAssignment
}: LearnerAssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/assignments?courseId=${course.id}`, {
      headers: {
        'x-user-id': learnerId,
        'x-user-role': 'LEARNER'
      }
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAssignments(data);
        }
      })
      .catch(err => console.error('Failed to load your assessments:', err))
      .finally(() => setIsLoading(false));
  }, [course.id, learnerId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          <FileCode className="text-blue-600 dark:text-blue-400" />
          My Course Assessments
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Assigned coding challenges for <span className="font-semibold text-slate-800 dark:text-slate-200">{course.title}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
          Loading your assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <BookOpen size={48} className="mx-auto mb-3 text-slate-400 opacity-60" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No assessments currently assigned</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Check back later when your faculty publishes new coding assessments for this course.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map(asg => {
            const learnerRecord = asg.learners?.[0];
            const isSubmitted = learnerRecord?.status === 'SUBMITTED' || learnerRecord?.status === 'REVIEWED' || learnerRecord?.status === 'EXPORTED';
            const dueDateObj = new Date(asg.dueDate);
            const isPastDue = new Date() > dueDateObj;

            return (
              <motion.div
                key={asg.id}
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {asg.title}
                      </h3>
                      {isSubmitted ? (
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle size={12} /> Submitted ({learnerRecord?.score}/{asg.maxPoints} pts)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Assigned
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {asg.instructions}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <BookOpen size={13} className="text-slate-400" />
                        <span>{asg.questions?.length || 1} Problem(s)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span className={isPastDue ? 'text-rose-500 font-semibold' : ''}>
                          Due: {dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        Max Marks: <span className="font-semibold text-slate-900 dark:text-white">{asg.maxPoints} pts</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button
                      onClick={() => onSelectAssignment(asg)}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium flex items-center gap-2"
                    >
                      <span>{isSubmitted ? 'Review / Resubmit' : 'Solve Assessment'}</span>
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

