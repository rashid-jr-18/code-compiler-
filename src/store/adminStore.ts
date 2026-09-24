import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeConfig, AdminSettings, AdminUser } from '@/types';

interface AdminStore {
  // Theme Management
  themes: ThemeConfig[];
  currentTheme: ThemeConfig;
  customThemes: ThemeConfig[];
  
  // Admin Settings
  settings: AdminSettings;
  
  // User Management
  users: AdminUser[];
  currentUser: AdminUser | null;
  
  // Actions
  setTheme: (theme: ThemeConfig) => void;
  addCustomTheme: (theme: ThemeConfig) => void;
  updateCustomTheme: (id: string, theme: Partial<ThemeConfig>) => void;
  deleteCustomTheme: (id: string) => void;
  
  updateSettings: (settings: Partial<AdminSettings>) => void;
  resetSettings: () => void;
  
  addUser: (user: AdminUser) => void;
  updateUser: (id: string, user: Partial<AdminUser>) => void;
  deleteUser: (id: string) => void;
  setCurrentUser: (user: AdminUser | null) => void;
  
  // Theme utilities
  generateThemeCSS: (theme: ThemeConfig) => string;
  applyTheme: (theme: ThemeConfig) => void;
}

// Default themes
const defaultThemes: ThemeConfig[] = [
  {
    id: 'default',
    name: 'EduTech Default',
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1',
    accentColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    surfaceColor: '#f8fafc',
    textColor: '#1f2937',
    textSecondaryColor: '#6b7280',
    borderColor: '#e5e7eb',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    infoColor: '#3b82f6',
    darkMode: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1',
    accentColor: '#8b5cf6',
    backgroundColor: '#0f172a',
    surfaceColor: '#1e293b',
    textColor: '#f1f5f9',
    textSecondaryColor: '#94a3b8',
    borderColor: '#334155',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    infoColor: '#3b82f6',
    darkMode: true,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.25)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.35)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.45)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.55)',
    },
  },
  {
    id: 'university',
    name: 'University Blue',
    primaryColor: '#1e40af',
    secondaryColor: '#3730a3',
    accentColor: '#7c3aed',
    backgroundColor: '#ffffff',
    surfaceColor: '#f0f9ff',
    textColor: '#1e293b',
    textSecondaryColor: '#64748b',
    borderColor: '#cbd5e1',
    successColor: '#059669',
    warningColor: '#d97706',
    errorColor: '#dc2626',
    infoColor: '#0284c7',
    darkMode: false,
    fontFamily: 'Georgia, serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
    },
    shadows: {
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
  },
  {
    id: 'modern',
    name: 'Modern Green',
    primaryColor: '#059669',
    secondaryColor: '#0d9488',
    accentColor: '#7c2d12',
    backgroundColor: '#fefefe',
    surfaceColor: '#f0fdfa',
    textColor: '#0f172a',
    textSecondaryColor: '#475569',
    borderColor: '#d1d5db',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    infoColor: '#06b6d4',
    darkMode: false,
    fontFamily: 'Roboto, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
  },
];

// Default admin settings
const defaultSettings: AdminSettings = {
  platformName: 'EduTech Compiler',
  welcomeMessage: 'Welcome to EduTech Compiler - Your Coding Practice Platform',
  footerText: '© 2024 EduTech Compiler. All rights reserved.',
  enableRegistration: true,
  enableGuestMode: true,
  maxExecutionTime: 30,
  maxMemoryLimit: 512,
  maxCodeLength: 100000,
  enableAnalytics: false,
  maintenanceMode: false,
  supportEmail: 'support@edutech-compiler.com',
  enableD2LIntegration: false,
  enableAutoGrading: true,
  enableNotifications: true,
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      themes: defaultThemes,
      currentTheme: defaultThemes[0],
      customThemes: [],
      settings: defaultSettings,
      users: [],
      currentUser: null,

      setTheme: (theme) => {
        set({ currentTheme: theme });
        get().applyTheme(theme);
      },

      addCustomTheme: (theme) => set((state) => ({
        customThemes: [...state.customThemes, theme]
      })),

      updateCustomTheme: (id, updatedTheme) => set((state) => ({
        customThemes: state.customThemes.map(theme =>
          theme.id === id ? { ...theme, ...updatedTheme } : theme
        )
      })),

      deleteCustomTheme: (id) => set((state) => ({
        customThemes: state.customThemes.filter(theme => theme.id !== id)
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      resetSettings: () => set({ settings: defaultSettings }),

      addUser: (user) => set((state) => ({
        users: [...state.users, user]
      })),

      updateUser: (id, updatedUser) => set((state) => ({
        users: state.users.map(user =>
          user.id === id ? { ...user, ...updatedUser } : user
        )
      })),

      deleteUser: (id) => set((state) => ({
        users: state.users.filter(user => user.id !== id)
      })),

      setCurrentUser: (user) => set({ currentUser: user }),

      generateThemeCSS: (theme) => {
        return `
          :root {
            --primary-color: ${theme.primaryColor};
            --secondary-color: ${theme.secondaryColor};
            --accent-color: ${theme.accentColor};
            --background-color: ${theme.backgroundColor};
            --surface-color: ${theme.surfaceColor};
            --text-color: ${theme.textColor};
            --text-secondary-color: ${theme.textSecondaryColor};
            --border-color: ${theme.borderColor};
            --success-color: ${theme.successColor};
            --warning-color: ${theme.warningColor};
            --error-color: ${theme.errorColor};
            --info-color: ${theme.infoColor};
            --font-family: ${theme.fontFamily};
            --font-size-xs: ${theme.fontSize.xs};
            --font-size-sm: ${theme.fontSize.sm};
            --font-size-base: ${theme.fontSize.base};
            --font-size-lg: ${theme.fontSize.lg};
            --font-size-xl: ${theme.fontSize.xl};
            --font-size-2xl: ${theme.fontSize['2xl']};
            --font-size-3xl: ${theme.fontSize['3xl']};
            --border-radius-sm: ${theme.borderRadius.sm};
            --border-radius-md: ${theme.borderRadius.md};
            --border-radius-lg: ${theme.borderRadius.lg};
            --border-radius-xl: ${theme.borderRadius.xl};
            --shadow-sm: ${theme.shadows.sm};
            --shadow-md: ${theme.shadows.md};
            --shadow-lg: ${theme.shadows.lg};
            --shadow-xl: ${theme.shadows.xl};
          }
        `;
      },

      applyTheme: (theme) => {
        const css = get().generateThemeCSS(theme);
        let styleElement = document.getElementById('theme-styles');
        
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'theme-styles';
          document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = css;
        
        // Update document class for dark mode
        if (theme.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        customThemes: state.customThemes,
        settings: state.settings,
      }),
    }
  )
);
