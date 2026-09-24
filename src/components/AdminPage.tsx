'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAdminStore } from '@/store/adminStore';
import { ThemeConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Palette, Settings, RotateCcw, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPage: React.FC = () => {
  const {
    themes,
    currentTheme,
    settings,
    setTheme,
    updateSettings,
    resetSettings
  } = useAdminStore();

  const handleReset = () => {
    resetSettings();
    toast.success('Settings reset to default');
  };

  const handleSelectTheme = (theme: ThemeConfig) => {
    setTheme(theme);
    toast.success(`Theme switched to ${theme.name}`);
  };

  return (
    <div className="relative min-h-screen bg-transparent text-gray-900 dark:text-white overflow-hidden">
      <div className="relative z-10 container mx-auto p-6 max-w-5xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1.5 mb-8"
        >
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck className="text-blue-600 dark:text-blue-400" size={32} />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Admin Control Panel
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Configure system themes, platform parameters, and runtime settings
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theme Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-6 shadow-sm"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Palette className="text-blue-600 dark:text-blue-400" size={20} />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Themes & Branding</h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select an official theme palette for the student and faculty workspace:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themes.map((theme: ThemeConfig) => {
                const isSelected = currentTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme)}
                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {theme.name}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                          <Check size={11} /> Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                        title={`Primary: ${theme.primaryColor}`}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: theme.secondaryColor }}
                        title={`Secondary: ${theme.secondaryColor}`}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: theme.accentColor }}
                        title={`Accent: ${theme.accentColor}`}
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                        {theme.darkMode ? 'Dark' : 'Light'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-6 shadow-sm"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Settings className="text-blue-600 dark:text-blue-400" size={20} />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Platform Settings</h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Platform Name"
                type="text"
                value={settings.platformName}
                onChange={(e) => updateSettings({ platformName: e.target.value })}
                placeholder="EduTech Compiler"
              />

              <Input
                label="Welcome Message"
                type="text"
                value={settings.welcomeMessage}
                onChange={(e) => updateSettings({ welcomeMessage: e.target.value })}
                placeholder="Welcome to the compiler..."
              />

              <Input
                label="Support Email"
                type="email"
                value={settings.supportEmail || ''}
                onChange={(e) => updateSettings({ supportEmail: e.target.value })}
                placeholder="support@institution.edu"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Execution (sec)"
                  type="number"
                  value={settings.maxExecutionTime}
                  onChange={(e) => updateSettings({ maxExecutionTime: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="60"
                />

                <Input
                  label="Max Memory (MB)"
                  type="number"
                  value={settings.maxMemoryLimit}
                  onChange={(e) => updateSettings({ maxMemoryLimit: parseInt(e.target.value) || 256 })}
                  min="64"
                  max="1024"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium text-xs"
              >
                <RotateCcw size={14} />
                Reset Defaults
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
