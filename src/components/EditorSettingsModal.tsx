'use client';

import React from 'react';
import { X, Moon, Sun, Minus, Plus, Sliders, Palette, WrapText, Check } from 'lucide-react';
import { EDITOR_THEMES } from '@/lib/monaco-themes';
import { EditorPreferences } from '@/hooks/useEditorPreferences';

interface EditorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: EditorPreferences;
  onUpdate: <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => void;
  resolvedTheme?: string;
  setSystemTheme?: (theme: 'light' | 'dark') => void;
}

export default function EditorSettingsModal({
  isOpen,
  onClose,
  preferences,
  onUpdate,
  resolvedTheme,
  setSystemTheme,
}: EditorSettingsModalProps) {
  if (!isOpen) return null;

  const handleFontSizeChange = (delta: number) => {
    const next = Math.max(10, Math.min(28, preferences.fontSize + delta));
    onUpdate('fontSize', next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold tracking-tight">Editor Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Font size
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                10–28px (Current: {preferences.fontSize}px)
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleFontSizeChange(-1)}
                disabled={preferences.fontSize <= 10}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="px-2 text-xs font-mono font-bold">{preferences.fontSize}px</span>
              <button
                type="button"
                onClick={() => handleFontSizeChange(1)}
                disabled={preferences.fontSize >= 28}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Light / Dark Mode Toggle */}
          {setSystemTheme && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                  Interface Theme
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Global app surface mode
                </span>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSystemTheme('light')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    resolvedTheme === 'light'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sun size={13} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSystemTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    resolvedTheme === 'dark'
                      ? 'bg-slate-700 text-white shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Moon size={13} />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          )}

          {/* Monaco Color Theme Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Palette size={15} className="text-blue-500" />
                <span>Code Color Theme</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {EDITOR_THEMES.find(t => t.id === preferences.colorTheme)?.name || preferences.colorTheme}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {EDITOR_THEMES.map(theme => {
                const isSelected = preferences.colorTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onUpdate('colorTheme', theme.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500 font-semibold text-blue-900 dark:text-blue-100'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-slate-400/40 shrink-0 shadow-xs" 
                        style={{ backgroundColor: theme.previewBg }} 
                      />
                      <span className="truncate">{theme.name}</span>
                    </div>
                    {isSelected && <Check size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Word Wrap Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <WrapText size={15} className="text-blue-500" />
                <span>Word wrap</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wrap long lines to fit editor width
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.wordWrap === 'on'}
              onClick={() => onUpdate('wordWrap', preferences.wordWrap === 'on' ? 'off' : 'on')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                preferences.wordWrap === 'on' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.wordWrap === 'on' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto-Complete Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Disable auto-complete
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stop suggesting completions while typing
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.disableAutocomplete}
              onClick={() => onUpdate('disableAutocomplete', !preferences.disableAutocomplete)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                preferences.disableAutocomplete ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.disableAutocomplete ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Web Console: Preserve error log */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Preserve error log
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Keep errors after a clean re-run
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.preserveErrorLog}
              onClick={() => onUpdate('preserveErrorLog', !preferences.preserveErrorLog)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                preferences.preserveErrorLog ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.preserveErrorLog ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Web Console: Avoid auto scrolling */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Avoid auto scrolling
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don&apos;t jump to newest line automatically
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.avoidAutoScrolling}
              onClick={() => onUpdate('avoidAutoScrolling', !preferences.avoidAutoScrolling)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                preferences.avoidAutoScrolling ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.avoidAutoScrolling ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

