'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AssessmentContainer, Assignment, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Layers, 
  FileCode, 
  Calendar, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  BookOpen, 
  AlertCircle,
  RotateCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LearnerContainerViewProps {
  container: AssessmentContainer;
  course: Course;
  learnerId: string;
  onSelectAssessment: (asg: Assignment) => void;
}

export default function LearnerContainerView({
  container,
  course,
  learnerId,
  onSelectAssessment
}: LearnerContainerViewProps) {
  const [childAssessments, setChildAssessments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssessments = () => {
    setIsLoading(true);
    fetch(`/api/assignments?containerId=${container.id}&courseId=${course.id}`, {
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
          setChildAssessments(data);
        }
      })
      .catch(err => toast.error('Failed to load assessments'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAssessments();
  }, [container.id, course.id, learnerId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Container Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              Module Content
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {course.title}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2.5 tracking-tight">
            <Layers className="text-blue-600 dark:text-blue-400" size={24} />
            {container.name}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Available Assessments • Select a challenge below to write, test, and submit your code
          </p>
        </div>

        <Button
          onClick={fetchAssessments}
          variant="outline"
          size="sm"
          className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Refresh Assessments"
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Available Child Assessments */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
          Loading your assessments...
        </div>
      ) : childAssessments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl text-center border border-slate-300 dark:border-slate-800 shadow-sm">
          <BookOpen size={48} className="mx-auto mb-3 text-slate-400 opacity-60" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            No assessments currently assigned in &quot;{container.name}&quot;
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Check back later when your instructor publishes coding assessments for this module.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Assigned Assessments ({childAssessments.length})
          </h3>

          <div className="grid grid-cols-1 gap-3.5">
            {childAssessments.map(asg => {
              const myRecord = asg.learners?.[0];
              const isSubmitted = myRecord?.status === 'SUBMITTED' || myRecord?.status === 'REVIEWED' || myRecord?.status === 'EXPORTED';
              const dueDateObj = new Date(asg.dueDate);
              const isPastDue = new Date() > dueDateObj;

              return (
                <motion.div
                  key={asg.id}
                  whileHover={{ y: -2 }}
                  onClick={() => onSelectAssessment(asg)}
                  className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <FileCode size={20} />
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {asg.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            Due: {dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {asg.maxPoints} Points
                          </span>
                          <span>•</span>
                          <span>{asg.questions.length} Problem{asg.questions.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 pl-12">
                      {asg.instructions}
                    </p>
                  </div>

                  {/* Status & CTA */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    {isSubmitted ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                        <CheckCircle size={13} />
                        Submitted ({myRecord?.score}/{asg.maxPoints} pts)
                      </span>
                    ) : isPastDue ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        Past Due
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                        <Clock size={13} />
                        Assigned
                      </span>
                    )}

                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1 font-medium rounded-lg shadow-sm"
                    >
                      <span>{isSubmitted ? 'Review Solution' : 'Start Assessment'}</span>
                      <ArrowRight size={13} />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

