'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Calendar, CheckCircle2, Award, Zap, X } from 'lucide-react';
import { UserStreak } from '@/types';

interface StreakWidgetProps {
  userId?: string;
  userRole?: string;
  onOpenProfile?: () => void;
}

export default function StreakWidget({ userId = 'usr_faculty', userRole = 'FACULTY', onOpenProfile }: StreakWidgetProps) {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchStreak = async () => {
    try {
      const res = await fetch('/api/users/streak', {
        headers: {
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        }
      });
      const json = await res.json();
      if (json.success && json.streak) {
        setStreak(json.streak);
      }
    } catch (err) {
      console.error('Failed to load streak:', err);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, [userId, userRole]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Generate last 28 days for mini calendar heatmap
  const getRecentDays = () => {
    const days: { dateStr: string; dayNum: number; count: number; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 27; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const count = streak?.activityDates?.[dateStr] || 0;
      days.push({
        dateStr,
        dayNum: d.getDate(),
        count,
        isToday: dateStr === todayStr
      });
    }
    return days;
  };

  const currentStreakCount = streak?.currentStreak || 0;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 hover:from-amber-500/25 hover:to-orange-500/25 transition-all shadow-2xs cursor-pointer group"
        title="View your Coding Streak & Activity"
      >
        <span className="relative flex items-center justify-center">
          <Flame size={14} className="text-amber-500 animate-pulse group-hover:scale-110 transition-transform" />
        </span>
        <span className="font-mono font-bold tracking-tight">
          {currentStreakCount} {currentStreakCount === 1 ? 'Day' : 'Days'}
        </span>
      </button>

      {/* LeetCode-style Streak & Activity Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-88 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 text-slate-800 dark:text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Flame size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Daily Coding Streak
                  </h4>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{currentStreakCount} Consecutive {currentStreakCount === 1 ? 'Day' : 'Days'}</span>
                    <span className="text-sm">🔥</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
              >
                <X size={15} />
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 my-3.5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Max Streak</p>
                <p className="text-base font-extrabold text-amber-500 font-mono mt-0.5">
                  {streak?.maxStreak || 1}d
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Solved</p>
                <p className="text-base font-extrabold text-emerald-500 font-mono mt-0.5">
                  {streak?.totalSolved || 0}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Submissions</p>
                <p className="text-base font-extrabold text-blue-500 font-mono mt-0.5">
                  {streak?.totalSubmissions || 0}
                </p>
              </div>
            </div>

            {/* Mini Calendar Heatmap (28 Days) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  <span>Last 4 Weeks Activity</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {Object.keys(streak?.activityDates || {}).length} active days
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                {getRecentDays().map(day => {
                  const hasActivity = day.count > 0;
                  return (
                    <div
                      key={day.dateStr}
                      className={`h-7 rounded-md flex flex-col items-center justify-center text-[10px] font-mono transition-all ${
                        hasActivity
                          ? 'bg-emerald-500 text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60'
                      } ${day.isToday ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''}`}
                      title={`${day.dateStr}: ${day.count} coding activity`}
                    >
                      <span>{day.dayNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Motivational Footer */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Zap size={12} />
                <span>Solve 1 problem daily to keep streak!</span>
              </span>
            </div>

            {/* View Full LeetCode Profile Button */}
            {onOpenProfile && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenProfile();
                }}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>View Full LeetCode Profile</span>
                <span className="text-amber-400">→</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

