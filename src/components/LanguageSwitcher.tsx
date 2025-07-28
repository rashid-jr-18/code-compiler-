'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Code, Search } from 'lucide-react';
import { LANGUAGES } from '@/config/languages';
import { useEditorStore } from '@/store/editorStore';
import { Language } from '@/types';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { selectedLanguage, setSelectedLanguage } = useEditorStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLanguages = LANGUAGES.filter(language =>
    language.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const itemVariants = {
    closed: { x: -10, opacity: 0 },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.2
      }
    })
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        className="flex items-center justify-between w-full px-4 py-3 text-left bg-card border border-border rounded-lg shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-3">
          <Code className="w-4 h-4 text-primary" />
          <div>
            <div className="font-medium">{selectedLanguage.name}</div>
            <div className="text-xs text-muted-foreground">
              .{selectedLanguage.extension}
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg"
            variants={dropdownVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{ minWidth: '300px' }}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search languages..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((language, index) => (
                  <motion.button
                    key={language.id}
                    className={`w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center space-x-3 ${
                      language.id === selectedLanguage.id
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }`}
                    onClick={() => handleLanguageSelect(language)}
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    custom={index}
                    whileHover={{ x: 4 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {language.extension.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{language.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Judge0 ID: {language.id}
                      </div>
                    </div>
                    {language.id === selectedLanguage.id && (
                      <motion.div
                        className="w-2 h-2 bg-primary rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No languages found</p>
                  <p className="text-xs">Try adjusting your search</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
