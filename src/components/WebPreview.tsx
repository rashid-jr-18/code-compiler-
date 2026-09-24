'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  RotateCw, 
  Terminal, 
  ChevronDown, 
  Trash2 
} from 'lucide-react';

interface ConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info';
  content: string;
  timestamp: string;
}

interface WebPreviewProps {
  htmlCode: string;
  cssCode?: string;
  jsCode?: string;
  autoRefresh?: boolean;
}

export default function WebPreview({ htmlCode, cssCode = '', jsCode = '' }: WebPreviewProps) {
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Assemble full HTML document bundle with console hook injected
  const generateBundle = () => {
    const consoleHookScript = `
      <script>
        (function() {
          const _send = function(type, args) {
            try {
              const msg = Array.from(args).map(a => {
                if (typeof a === 'object') {
                  try { return JSON.stringify(a); } catch(e) { return String(a); }
                }
                return String(a);
              }).join(' ');
              window.parent.postMessage({ type: 'PREVIEW_CONSOLE', level: type, text: msg }, '*');
            } catch(e) {}
          };
          const _log = console.log;
          const _err = console.error;
          const _warn = console.warn;
          const _info = console.info;
          console.log = function() { _send('log', arguments); _log.apply(console, arguments); };
          console.error = function() { _send('error', arguments); _err.apply(console, arguments); };
          console.warn = function() { _send('warn', arguments); _warn.apply(console, arguments); };
          console.info = function() { _send('info', arguments); _info.apply(console, arguments); };
          window.onerror = function(msg, url, line) {
            _send('error', [msg + ' (line ' + line + ')']);
          };
        })();
      </script>
    `;

    // If user provided complete <html> document
    if (htmlCode.includes('<html') || htmlCode.includes('<!DOCTYPE') || htmlCode.includes('<body')) {
      let doc = htmlCode;
      if (cssCode) {
        doc = doc.replace('</head>', `<style>${cssCode}</style></head>`);
        if (!doc.includes('</head>')) {
          doc = `<style>${cssCode}</style>` + doc;
        }
      }
      if (jsCode) {
        doc = doc.replace('</body>', `<script>${jsCode}</script></body>`);
        if (!doc.includes('</body>')) {
          doc = doc + `<script>${jsCode}</script>`;
        }
      }
      return consoleHookScript + doc;
    }

    // Otherwise assemble standard wrapper
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${consoleHookScript}
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 16px; margin: 0; }
            ${cssCode}
          </style>
        </head>
        <body>
          ${htmlCode}
          <script>
            ${jsCode}
          </script>
        </body>
      </html>
    `;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PREVIEW_CONSOLE') {
        setConsoleMessages(prev => [
          ...prev,
          {
            type: event.data.level || 'log',
            content: event.data.text || '',
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Top Header with Eye Symbol Preview Button */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {/* Eye Symbol Preview Badge / Button */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Click to reload preview"
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Eye size={15} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            title="Reload Preview"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Console Toggle Button */}
        <button
          type="button"
          onClick={() => setIsConsoleOpen(prev => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
            isConsoleOpen
              ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Terminal size={12} />
          <span>Console</span>
          {consoleMessages.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              isConsoleOpen ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            }`}>
              {consoleMessages.length}
            </span>
          )}
        </button>
      </div>

      {/* Full Width Live Preview Frame */}
      <div className="flex-1 min-h-[460px] bg-white dark:bg-slate-950 flex flex-col overflow-hidden relative">
        <iframe
          key={refreshKey}
          ref={iframeRef}
          srcDoc={generateBundle()}
          title="Web Live Preview"
          sandbox="allow-scripts allow-modals"
          className="w-full h-full min-h-[460px] border-none bg-white flex-1"
        />
      </div>

      {/* Expandable Web Console Drawer */}
      {isConsoleOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col max-h-48 transition-all animate-in slide-in-from-bottom duration-150">
          <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Console Output</span>
              <span className="text-[10px] text-slate-400">({consoleMessages.length} messages)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConsoleMessages([])}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                title="Clear console"
              >
                <Trash2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => setIsConsoleOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="p-3 font-mono text-[11px] overflow-y-auto space-y-1 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 h-36">
            {consoleMessages.length === 0 ? (
              <div className="text-slate-400 italic text-xs py-2 text-center">
                Console is empty. Any console.log() calls will appear here.
              </div>
            ) : (
              consoleMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-2 py-0.5 border-b border-slate-100 dark:border-slate-900/60 ${
                    msg.type === 'error' ? 'text-rose-600 dark:text-rose-400' :
                    msg.type === 'warn' ? 'text-amber-600 dark:text-amber-400' :
                    'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 select-none pt-0.5">{msg.timestamp}</span>
                  <span className="font-semibold select-none">
                    {msg.type === 'error' ? '✕' : msg.type === 'warn' ? '▲' : '›'}
                  </span>
                  <pre className="whitespace-pre-wrap flex-1 font-mono">{msg.content}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
