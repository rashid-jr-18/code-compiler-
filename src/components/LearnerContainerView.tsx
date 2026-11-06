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
import StreakWidget from '@/components/StreakWidget';

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
    fetch(`/compiler/api/assignments?containerId=${container.id}&courseId=${course.id}`, {
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
    <div className="space-y-4 sm:space-y-5 w-full max-w-5xl mx-auto">
      {/* Container Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              Module Content
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
              {course.title}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2 tracking-tight">
            <Layers className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
            <span className="truncate">{container.name}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Available Assessments • Select a challenge below to write, test, and submit your code
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StreakWidget
            userId={learnerId}
            userRole="LEARNER"
          />

          <Button
            onClick={fetchAssessments}
            variant="outline"
            size="sm"
            className="h-8.5 w-8.5 p-0 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            title="Refresh Assessments"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Available Child Assessments */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse text-sm">
          Loading your assessments...
        </div>
      ) : childAssessments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-xl text-center border border-slate-300 dark:border-slate-800 shadow-sm">
          <BookOpen size={42} className="mx-auto mb-3 text-slate-400 opacity-60" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
            No assessments currently assigned in &quot;{container.name}&quot;
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Check back later when your instructor publishes coding assessments for this module.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Assigned Assessments ({childAssessments.length})
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
            {childAssessments.map(asg => {
              const myRecord = asg.learners?.[0];
              const isSubmitted = myRecord?.status === 'SUBMITTED' || myRecord?.status === 'REVIEWED' || myRecord?.status === 'EXPORTED';
              const dueDateObj = new Date(asg.dueDate);
              const isPastDue = new Date() > dueDateObj;

              return (
                <motion.div
                  key={asg.id}
                  whileHover={!isSubmitted ? { y: -1 } : {}}
                  onClick={() => !isSubmitted && onSelectAssessment(asg)}
                  className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs transition-all flex flex-col gap-3 ${
                    isSubmitted ? 'opacity-85 cursor-default' : 'hover:border-blue-500/60 dark:hover:border-slate-700 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <FileCode size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors break-words">
                        {asg.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap">
                          <Calendar size={12} className="text-slate-400 shrink-0" />
                          Due: {dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          {isPastDue && <span className="text-rose-500 font-bold ml-1">(Past Due)</span>}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {asg.maxPoints} Points
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
                        <span className="whitespace-nowrap">{asg.questions.length} Problem{asg.questions.length !== 1 ? 's' : ''}</span>
                      </div>
                      {asg.instructions && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-1.5">
                          {asg.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & CTA Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      {isSubmitted ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 whitespace-nowrap">
                          <CheckCircle size={13} />
                          Submitted ({myRecord?.score}/{asg.maxPoints} pts)
                        </span>
                      ) : isPastDue ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 whitespace-nowrap">
                          <AlertCircle size={13} />
                          Past Due
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 whitespace-nowrap">
                          <Clock size={13} />
                          Assigned
                        </span>
                      )}
                    </div>

                    {isSubmitted ? (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle size={13} />
                        Completed & Locked
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAssessment(asg);
                        }}
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1 font-medium rounded-lg shadow-xs"
                      >
                        <span>Start Assessment</span>
                        <ArrowRight size={13} />
                      </Button>
                    )}
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

