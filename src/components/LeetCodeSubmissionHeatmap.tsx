'use client';

import { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, CheckCircle2, Bookmark, FileCode2, MessageSquare, ExternalLink } from 'lucide-react';

interface LeetCodeSubmissionHeatmapProps {
  activityDates?: Record<string, number>;
  initialYear?: number;
  onSelectTab?: (tab: 'recent' | 'list' | 'solutions' | 'discuss') => void;
  activeTab?: 'recent' | 'list' | 'solutions' | 'discuss';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function LeetCodeSubmissionHeatmap({
  activityDates = {},
  initialYear,
  onSelectTab,
  activeTab = 'recent'
}: LeetCodeSubmissionHeatmapProps) {
  // Determine available years from activityDates or provide defaults
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(2026);
    years.add(2025);
    years.add(2024);

    Object.keys(activityDates).forEach(d => {
      const y = parseInt(d.split('-')[0], 10);
      if (!isNaN(y)) years.add(y);
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [activityDates]);

  // Default selected year (priority: year with submissions, then 2026 or 2024)
  const defaultYear = useMemo(() => {
    if (initialYear && availableYears.includes(initialYear)) return initialYear;
    // Check if 2024 has submissions (as in user screenshot)
    const has2024 = Object.keys(activityDates).some(d => d.startsWith('2024-'));
    if (has2024) return 2024;
    return availableYears[0] || new Date().getFullYear();
  }, [initialYear, availableYears, activityDates]);

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [hoveredDay, setHoveredDay] = useState<{ dateStr: string; count: number; x: number; y: number } | null>(null);

  // Filter submissions for selected year
  const yearStats = useMemo(() => {
    let totalSubmissions = 0;
    let totalActiveDays = 0;
    const yearPrefix = `${selectedYear}-`;

    Object.entries(activityDates).forEach(([dateStr, count]) => {
      if (dateStr.startsWith(yearPrefix) && count > 0) {
        totalSubmissions += count;
        totalActiveDays += 1;
      }
    });

    // Calculate max streak in selected year
    const daysInYear = (selectedYear % 4 === 0 && (selectedYear % 100 !== 0 || selectedYear % 400 === 0)) ? 366 : 365;
    let currentStreak = 0;
    let maxStreak = 0;

    const startDate = new Date(selectedYear, 0, 1);
    for (let i = 0; i < daysInYear; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const str = d.toISOString().split('T')[0];
      const count = activityDates[str] || 0;
      if (count > 0) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    return { totalSubmissions, totalActiveDays, maxStreak };
  }, [activityDates, selectedYear]);

  // Construct calendar structure by month for selected year
  const monthsData = useMemo(() => {
    return MONTH_NAMES.map((monthName, monthIndex) => {
      const firstDayOfMonth = new Date(selectedYear, monthIndex, 1);
      const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 6 = Sat
      const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();

      // Organize into week columns (each column has 7 rows: 0=Sun to 6=Sat)
      const weeks: ({ dayNum: number; dateStr: string; count: number } | null)[][] = [];
      let currentWeek: ({ dayNum: number; dateStr: string; count: number } | null)[] = [];

      // Pad days before the 1st of the month
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const monthPad = String(monthIndex + 1).padStart(2, '0');
        const dayPad = String(day).padStart(2, '0');
        const dateStr = `${selectedYear}-${monthPad}-${dayPad}`;
        const count = activityDates[dateStr] || 0;

        currentWeek.push({ dayNum: day, dateStr, count });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // Pad remaining days of the last week
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }

      return {
        monthName,
        monthIndex,
        weeks
      };
    });
  }, [selectedYear, activityDates]);

  // Helper for cell color according to LeetCode levels
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700';
    if (count <= 2) return 'bg-[#8ce99a] dark:bg-[#22c55e]/60 hover:brightness-95';
    if (count <= 4) return 'bg-[#38d9a9] dark:bg-[#16a34a] hover:brightness-95';
    if (count <= 7) return 'bg-[#22c55e] dark:bg-[#15803d] hover:brightness-95';
    return 'bg-[#15803d] dark:bg-[#166534] hover:brightness-95';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* ================= Heatmap Header (Exact LeetCode Layout) ================= */}
      <div className="p-4 sm:p-5 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            {yearStats.totalSubmissions} submissions in {selectedYear}
          </span>
          <div className="relative group cursor-pointer">
            <HelpCircle size={15} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
              <div className="bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap">
                Submissions and code runs in {selectedYear}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Total active days:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {yearStats.totalActiveDays}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Max streak:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {yearStats.maxStreak}
            </span>
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="appearance-none bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-lg pl-3 pr-7 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ================= Heatmap Grid (12 Months) ================= */}
      <div className="p-4 sm:p-5 overflow-x-auto scrollbar-thin">
        <div className="inline-flex gap-3 sm:gap-4 min-w-full justify-between items-start">
          {monthsData.map(({ monthName, weeks }) => (
            <div key={monthName} className="flex flex-col items-center">
              {/* Month Columns Grid */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIdx) => {
                      if (!day) {
                        return (
                          <div
                            key={dayIdx}
                            className="w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] opacity-0 pointer-events-none"
                          />
                        );
                      }

                      const isSelected = hoveredDay?.dateStr === day.dateStr;
                      return (
                        <div
                          key={dayIdx}
                          title={`${day.count > 0 ? `${day.count} submission${day.count > 1 ? 's' : ''}` : 'No submissions'} on ${monthName} ${day.dayNum}, ${selectedYear}`}
                          className={`w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-[2px] cursor-pointer transition-all duration-150 ${getCellColor(
                            day.count
                          )} ${isSelected ? 'ring-1.5 ring-blue-500 scale-125 z-10' : ''}`}
                          onMouseEnter={() => setHoveredDay({ dateStr: day.dateStr, count: day.count, x: 0, y: 0 })}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Month Label */}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-2 select-none">
                {monthName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Navigation Tabs (Matching Screenshot) ================= */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onSelectTab?.('recent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'recent'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Recent AC</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab?.('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark size={13} className="text-amber-500" />
            <span>List</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab?.('solutions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'solutions'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCode2 size={13} className="text-blue-500" />
            <span>Solutions</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab?.('discuss')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'discuss'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare size={13} className="text-purple-500" />
            <span>Discuss</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab?.('recent')}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View all submissions</span>
          <span>&gt;</span>
        </button>
      </div>
    </div>
  );
}
