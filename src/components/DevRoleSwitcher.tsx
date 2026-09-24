'use client';

import { useState, useEffect } from 'react';
import { User, Settings, GraduationCap, Sparkles, X, BookOpen, Layers } from 'lucide-react';

interface DevUserConfig {
  role: 'admin' | 'faculty' | 'learner';
  userId: string;
  name: string;
  defaultCourseId: string;
}

const DEV_PROFILES: DevUserConfig[] = [
  // Admin
  { role: 'admin', userId: 'usr_admin', name: 'Admin (System)', defaultCourseId: 'crs_cs101' },
  // Faculty
  { role: 'faculty', userId: 'usr_faculty', name: 'Prof. Turing (CS101)', defaultCourseId: 'crs_cs101' },
  { role: 'faculty', userId: 'usr_faculty_lovelace', name: 'Prof. Lovelace (CS202)', defaultCourseId: 'crs_cs202' },
  // Learners
  { role: 'learner', userId: 'usr_student_alice', name: 'Alice (CS101 & 202)', defaultCourseId: 'crs_cs101' },
  { role: 'learner', userId: 'usr_student_bob', name: 'Bob (CS101)', defaultCourseId: 'crs_cs101' },
  { role: 'learner', userId: 'usr_student_charlie', name: 'Charlie (CS101)', defaultCourseId: 'crs_cs101' },
  { role: 'learner', userId: 'usr_student_david', name: 'David (CS101)', defaultCourseId: 'crs_cs101' },
  { role: 'learner', userId: 'usr_student_emma', name: 'Emma (CS202)', defaultCourseId: 'crs_cs202' },
  { role: 'learner', userId: 'usr_student_frank', name: 'Frank (CS202)', defaultCourseId: 'crs_cs202' },
  { role: 'learner', userId: 'usr_student_grace', name: 'Grace (CS202)', defaultCourseId: 'crs_cs202' }
];

const DEV_COURSES = [
  { id: 'crs_cs101', code: 'CS101', title: 'CS101: Python Basics' },
  { id: 'crs_cs202', code: 'CS202', title: 'CS202: Data Structures' }
];

const DevRoleSwitcher = () => {
  const [activeUserId, setActiveUserId] = useState<string>('usr_faculty');
  const [activeCourseId, setActiveCourseId] = useState<string>('crs_cs101');
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isLtiActive, setIsLtiActive] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const hasRealLti = typeof window !== 'undefined' && (
      Boolean(sessionStorage.getItem('lti_session')) ||
      document.cookie.includes('lti_session=')
    );
    if (hasRealLti) {
      setIsLtiActive(true);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id') || localStorage.getItem('dev_user_id') || 'usr_faculty';
    const courseId = urlParams.get('course_id') || localStorage.getItem('dev_course_id') || 'crs_cs101';
    setActiveUserId(userId);
    setActiveCourseId(courseId);
  }, []);

  if (isLtiActive || isDismissed) {
    return null;
  }

  const switchProfile = (profile: DevUserConfig) => {
    localStorage.setItem('dev_user_id', profile.userId);
    localStorage.setItem('dev_user_role', profile.role);
    localStorage.setItem('dev_course_id', profile.defaultCourseId);

    const url = new URL(window.location.href);
    url.searchParams.set('role', profile.role);
    url.searchParams.set('user_id', profile.userId);
    url.searchParams.set('course_id', profile.defaultCourseId);
    window.location.href = url.toString();
  };

  const switchCourse = (courseId: string) => {
    localStorage.setItem('dev_course_id', courseId);
    const url = new URL(window.location.href);
    url.searchParams.set('course_id', courseId);
    window.location.href = url.toString();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-2.5 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Settings size={14} className="text-slate-600 dark:text-slate-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Dev Testing Hub
            </h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline px-1"
            >
              {isExpanded ? 'Less' : 'All 10'}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Switcher"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Course Switcher */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Layers size={11} className="text-slate-500" /> Active Course:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {DEV_COURSES.map(c => {
              const isSelected = activeCourseId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => switchCourse(c.id)}
                  className={`px-2 py-1 rounded-md text-xs font-medium text-center transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {c.code}
                </button>
              );
            })}
          </div>
        </div>

        {/* User Switcher */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <User size={11} className="text-slate-500" /> Switch Profile (10 Users):
          </label>
          <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {(isExpanded ? DEV_PROFILES : DEV_PROFILES.slice(0, 4)).map(p => {
              const isActive = activeUserId === p.userId;
              return (
                <button
                  key={p.userId}
                  onClick={() => switchProfile(p)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium text-left transition-all border flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {p.role === 'admin' ? (
                    <Settings size={11} className={isActive ? 'text-white' : 'text-slate-500'} />
                  ) : p.role === 'faculty' ? (
                    <GraduationCap size={11} className={isActive ? 'text-white' : 'text-slate-500'} />
                  ) : (
                    <User size={11} className={isActive ? 'text-white' : 'text-slate-500'} />
                  )}
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevRoleSwitcher;
