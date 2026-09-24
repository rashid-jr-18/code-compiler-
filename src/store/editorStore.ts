import { create } from 'zustand';
import { Language } from '@/types';
import { LANGUAGES } from '@/config/languages';

interface EditorState {
  // Editor state
  selectedLanguage: Language;
  code: string;
  input: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  isLoading: boolean;
  isRunning: boolean;
  activeTab: 'stdout' | 'stderr' | 'compile';
  
  // UI state
  theme: 'vs-dark' | 'light' | 'vs';
  fontSize: number;
  isFullscreen: boolean;
  sidebarCollapsed: boolean;
  
  // Actions
  setSelectedLanguage: (language: Language) => void;
  setCode: (code: string) => void;
  setInput: (input: string) => void;
  setStdout: (stdout: string) => void;
  setStderr: (stderr: string) => void;
  setCompileOutput: (compileOutput: string) => void;
  setActiveTab: (tab: 'stdout' | 'stderr' | 'compile') => void;
  setIsLoading: (loading: boolean) => void;
  setIsRunning: (running: boolean) => void;
  setTheme: (theme: 'vs-dark' | 'light' | 'vs') => void;
  setFontSize: (size: number) => void;
  toggleFullscreen: () => void;
  toggleSidebar: () => void;
  resetOutput: () => void;
  resetAll: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  selectedLanguage: LANGUAGES[0],
  code: LANGUAGES[0].defaultCode,
  input: '',
  stdout: '',
  stderr: '',
  compileOutput: '',
  isLoading: false,
  isRunning: false,
  activeTab: 'stdout',
  theme: 'vs-dark',
  fontSize: 14,
  isFullscreen: false,
  sidebarCollapsed: false,

  // Actions
  setSelectedLanguage: (language: Language) => set(() => ({
    selectedLanguage: language,
    code: language.defaultCode,
    stdout: '',
    stderr: '',
    compileOutput: ''
  })),
  
  setCode: (code: string) => set(() => ({ code })),
  
  setInput: (input: string) => set(() => ({ input })),
  
  setStdout: (stdout: string) => set(() => ({ stdout })),
  
  setStderr: (stderr: string) => set(() => ({ stderr })),
  
  setCompileOutput: (compileOutput: string) => set(() => ({ compileOutput })),
  
  setActiveTab: (activeTab: 'stdout' | 'stderr' | 'compile') => set(() => ({ activeTab })),
  
  setIsLoading: (isLoading: boolean) => set(() => ({ isLoading })),
  
  setIsRunning: (isRunning: boolean) => set(() => ({ isRunning })),
  
  setTheme: (theme: 'vs-dark' | 'light' | 'vs') => set(() => ({ theme })),
  
  setFontSize: (fontSize: number) => set(() => ({ fontSize })),
  
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  resetOutput: () => set(() => ({ stdout: '', stderr: '', compileOutput: '' })),
  
  resetAll: () => set(() => ({
    code: get().selectedLanguage.defaultCode,
    input: '',
    stdout: '',
    stderr: '',
    compileOutput: '',
    isLoading: false,
    isRunning: false
  }))
}));
