'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Code, Search, Check } from 'lucide-react';
import { LANGUAGES } from '@/config/languages';
import { useEditorStore } from '@/store/editorStore';
import { Language } from '@/types';

interface LanguageSwitcherProps {
  className?: string;
  buttonClassName?: string;
  supportedLanguages?: number[]; // Optional filter for supported language IDs
  selectedLanguage?: Language;
  onLanguageSelect?: (language: Language) => void;
}

export default function LanguageSwitcher({ 
  className = '', 
  buttonClassName = '',
  supportedLanguages,
  selectedLanguage: controlledLanguage,
  onLanguageSelect: controlledOnSelect
}: LanguageSwitcherProps) {
  const store = useEditorStore();
  const selectedLanguage = controlledLanguage || store.selectedLanguage;
  const setSelectedLanguage = controlledOnSelect || store.setSelectedLanguage;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [installInfo, setInstallInfo] = useState<{ installedCount: number; isInstalling: boolean; current?: string } | null>(null);

  useEffect(() => {
    // Automatically check and trigger Piston package installations
    const checkAndInstall = () => {
      fetch('/api/piston/install-packages')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setInstallInfo({
              installedCount: data.installedCount,
              isInstalling: data.isInstalling,
              current: data.progress?.currentLanguage
            });
          }
        })
        .catch(() => {});
    };

    checkAndInstall();
    const interval = setInterval(checkAndInstall, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filter languages by supported languages if provided (and non-empty)
  const availableLanguages = (supportedLanguages && supportedLanguages.length > 0)
    ? LANGUAGES.filter(lang => supportedLanguages.includes(lang.id))
    : LANGUAGES;

  // Auto-sync if selected language is not supported in the active question
  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.some(l => l.id === selectedLanguage?.id)) {
      setSelectedLanguage(availableLanguages[0]);
    }
  }, [availableLanguages, selectedLanguage?.id, setSelectedLanguage]);

  const filteredLanguages = availableLanguages.filter(language =>
    language.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    language.extension.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(language.id).includes(searchTerm.trim())
  );

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    setSearchTerm('');
  };

  const dropdownVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      y: -10
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        type="button"
        className={`flex items-center justify-between w-full h-9 px-2.5 text-left bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all text-xs ${buttonClassName}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center space-x-2 truncate min-w-0">
          <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
            <Code className="w-3 h-3" />
          </div>
          <div className="truncate flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs">
              {selectedLanguage?.name || 'Select Language'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
              .{selectedLanguage?.extension}
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-1.5 flex-shrink-0 text-slate-400"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute z-50 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden"
            variants={dropdownVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{ 
              width: '320px',
              maxWidth: '90vw',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="p-3 border-b border-border/80 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search ${availableLanguages.length} languages...`}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-between items-center mt-2 px-0.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 truncate">
                  <span>Available: {availableLanguages.length}</span>
                  {installInfo?.isInstalling && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold animate-pulse truncate">
                      • Installing {installInfo.current}...
                    </span>
                  )}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] shrink-0 font-semibold">
                  {installInfo ? `${installInfo.installedCount} ready` : ''}
                </span>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-border/20">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((language) => {
                  const isSelected = language.id === selectedLanguage?.id;
                  return (
                    <button
                      key={language.id}
                      type="button"
                      className={`w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center space-x-2.5 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-300'
                      }`}
                      onClick={() => handleLanguageSelect(language)}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 uppercase ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {language.extension.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{language.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          .{language.extension}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <Search className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">No languages found</p>
                  <p className="text-[11px] opacity-70">Try adjusting your search</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
