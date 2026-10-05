'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAdminStore } from '@/store/adminStore';
import { ThemeConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Palette, Settings, RotateCcw, Check, Camera, Monitor, AlertTriangle, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPage: React.FC = () => {
  const {
    themes,
    currentTheme,
    settings,
    setTheme,
    updateSettings,
    updateInstitutionPolicy,
    resetSettings
  } = useAdminStore();

  const policy = settings.institutionPolicy || {
    allowCameraProctoring: true,
    allowKioskMode: true,
    allowAutoSubmit: true,
    minViolationLimit: 3,
    allowCopyPaste: false,
  };

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

        {/* Institution Policy Maker & Faculty Permissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Institution Policy Maker & Faculty Permissions
                  <span className="text-[11px] font-semibold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-300 dark:border-purple-700">
                    Governance Tier
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure mandatory exam security standards and feature permissions granted to Faculty members across courses.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                Enforcing Policies
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Policy Toggle 1: Camera Proctoring */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">Allow Camera Proctoring for Faculty</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When enabled, instructors can mandate live webcam monitoring and face detection during assessments.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.allowCameraProctoring}
                onChange={(e) => {
                  updateInstitutionPolicy({ allowCameraProctoring: e.target.checked });
                  toast.success(`Camera proctoring permission ${e.target.checked ? 'granted' : 'revoked'}`);
                }}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer mt-1"
              />
            </div>

            {/* Policy Toggle 2: Kiosk Lockdown */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">Allow Kiosk Browser Lockdown</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When enabled, instructors can enforce fullscreen lockdown, tab-switch logging, and right-click blocking.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.allowKioskMode}
                onChange={(e) => {
                  updateInstitutionPolicy({ allowKioskMode: e.target.checked });
                  toast.success(`Kiosk lockdown permission ${e.target.checked ? 'granted' : 'revoked'}`);
                }}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer mt-1"
              />
            </div>

            {/* Policy Toggle 3: Auto-Submit on Violations */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">Allow Auto-Submit on Violations</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Institutional approval for tests to terminate and auto-submit immediately when a student exceeds violation warnings.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.allowAutoSubmit}
                onChange={(e) => {
                  updateInstitutionPolicy({ allowAutoSubmit: e.target.checked });
                  toast.success(`Auto-submit policy ${e.target.checked ? 'permitted' : 'restricted'}`);
                }}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer mt-1"
              />
            </div>

            {/* Policy Setting 4: Min Violation Warnings */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-rose-600 dark:text-rose-400" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">Minimum Warning Threshold</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instructors cannot configure fewer violation warnings than this university standard.
                </p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={policy.minViolationLimit}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    updateInstitutionPolicy({ minViolationLimit: val });
                  }}
                  className="text-center font-bold"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
