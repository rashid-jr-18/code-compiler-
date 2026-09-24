import type { Monaco } from '@monaco-editor/react';

export interface EditorThemeOption {
  id: string;
  name: string;
  type: 'dark' | 'light';
  previewBg: string;
  previewAccent: string;
}

export const EDITOR_THEMES: EditorThemeOption[] = [
  { id: 'tokyo-night', name: 'Tokyo Night', type: 'dark', previewBg: '#1a1b26', previewAccent: '#7aa2f7' },
  { id: 'one-dark', name: 'One Dark Pro', type: 'dark', previewBg: '#282c34', previewAccent: '#61afef' },
  { id: 'monokai', name: 'Monokai', type: 'dark', previewBg: '#272822', previewAccent: '#a6e22e' },
  { id: 'github-dark', name: 'GitHub Dark', type: 'dark', previewBg: '#0d1117', previewAccent: '#58a6ff' },
  { id: 'vs-dark', name: 'VS Code Dark', type: 'dark', previewBg: '#1e1e1e', previewAccent: '#007acc' },
  { id: 'vs', name: 'VS Code Light', type: 'light', previewBg: '#ffffff', previewAccent: '#0066b8' },
  { id: 'github-light', name: 'GitHub Light', type: 'light', previewBg: '#ffffff', previewAccent: '#0969da' }
];

let themesRegistered = false;

export function registerMonacoThemes(monaco: Monaco) {
  if (themesRegistered || !monaco?.editor) return;

  // 1. Tokyo Night (matching user reference screenshot)
  monaco.editor.defineTheme('tokyo-night', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'a9b1d6', background: '1a1b26' },
      { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'bb9af7', fontStyle: 'bold' },
      { token: 'string', foreground: '9ece6a' },
      { token: 'number', foreground: 'ff9e64' },
      { token: 'regexp', foreground: 'b4f9f8' },
      { token: 'type', foreground: '2ac3de' },
      { token: 'class', foreground: '7aa2f7' },
      { token: 'function', foreground: '7aa2f7' },
      { token: 'variable', foreground: 'c0caf5' },
      { token: 'delimiter', foreground: '89ddff' },
      { token: 'tag', foreground: 'f7768e' }
    ],
    colors: {
      'editor.background': '#1a1b26',
      'editor.foreground': '#a9b1d6',
      'editor.lineHighlightBackground': '#1e202e',
      'editorCursor.foreground': '#c0caf5',
      'editorWhitespace.foreground': '#3b4261',
      'editorIndentGuide.background': '#232433',
      'editorIndentGuide.activeBackground': '#3b4261',
      'editorLineNumber.foreground': '#414868',
      'editorLineNumber.activeForeground': '#7aa2f7',
      'editor.selectionBackground': '#283457',
      'editor.inactiveSelectionBackground': '#1f2538'
    }
  });

  // 2. One Dark Pro
  monaco.editor.defineTheme('one-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'abb2bf', background: '282c34' },
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'type', foreground: 'e5c07b' },
      { token: 'function', foreground: '61afef' },
      { token: 'variable', foreground: 'e06c75' }
    ],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editor.lineHighlightBackground': '#2c313a',
      'editorCursor.foreground': '#528bff',
      'editorLineNumber.foreground': '#4b5263',
      'editorLineNumber.activeForeground': '#abb2bf',
      'editor.selectionBackground': '#3e4451'
    }
  });

  // 3. Monokai
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'f8f8f2', background: '272822' },
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672', fontStyle: 'bold' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' }
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d32',
      'editorCursor.foreground': '#f8f8f0',
      'editorLineNumber.foreground': '#90908a',
      'editorLineNumber.activeForeground': '#f8f8f2',
      'editor.selectionBackground': '#49483e'
    }
  });

  // 4. GitHub Dark
  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'c9d1d9', background: '0d1117' },
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'c9d1d9' }
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editorCursor.foreground': '#58a6ff',
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#c9d1d9',
      'editor.selectionBackground': '#264f78'
    }
  });

  // 5. GitHub Light
  monaco.editor.defineTheme('github-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: '24292f', background: 'ffffff' },
      { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'cf222e' },
      { token: 'string', foreground: '0a3069' },
      { token: 'number', foreground: '0550ae' },
      { token: 'type', foreground: '953800' },
      { token: 'function', foreground: '8250df' },
      { token: 'variable', foreground: '24292f' }
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292f',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editorCursor.foreground': '#0969da',
      'editorLineNumber.foreground': '#8c959f',
      'editorLineNumber.activeForeground': '#24292f',
      'editor.selectionBackground': '#b6e3ff'
    }
  });

  themesRegistered = true;
}

