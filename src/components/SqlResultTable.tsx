'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  Search, 
  AlertCircle, 
  Database
} from 'lucide-react';

interface SqlResultTableProps {
  output?: string | null;
  error?: string | null;
  isLoading?: boolean;
}

interface ParsedTableData {
  headers: string[];
  rows: string[][];
  rawNonTableLines: string[];
}

export default function SqlResultTable({ output = '', error = '', isLoading = false }: SqlResultTableProps) {
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);

  // Parse SQL raw output (handles SQLite box tables, pipe-separated, tab-separated, etc.)
  const parsedData: ParsedTableData | null = useMemo(() => {
    if (!output || !output.trim()) return null;

    const lines = output.trim().split(/\r?\n/).map(l => l.trimEnd());
    if (lines.length === 0) return null;

    // Check for SQLite ASCII box style (+----+---+)
    const isBoxStyle = lines.some(l => /^\+[-+]+(\+)?$/.test(l.trim()));
    if (isBoxStyle) {
      const contentLines = lines.filter(l => !/^\+[-+]+(\+)?$/.test(l.trim()));
      if (contentLines.length >= 1) {
        const parseLine = (line: string) => {
          const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
          return trimmed.split('|').map(c => c.trim());
        };

        const headers = parseLine(contentLines[0]);
        const rows = contentLines.slice(1).map(parseLine);
        return { headers, rows, rawNonTableLines: [] };
      }
    }

    // Check for pipe-delimited output: id|name|email
    const pipeLines = lines.filter(l => l.includes('|'));
    if (pipeLines.length >= 2 || (pipeLines.length === 1 && lines.length === 1)) {
      const headers = pipeLines[0].split('|').map(c => c.trim());
      const rows = pipeLines.slice(1).map(l => l.split('|').map(c => c.trim()));
      const nonTable = lines.filter(l => !l.includes('|'));
      return { headers, rows, rawNonTableLines: nonTable };
    }

    // Check for tab-delimited
    const tabLines = lines.filter(l => l.includes('\t'));
    if (tabLines.length >= 2) {
      const headers = tabLines[0].split('\t').map(c => c.trim());
      const rows = tabLines.slice(1).map(l => l.split('\t').map(c => c.trim()));
      return { headers, rows, rawNonTableLines: [] };
    }

    // Check for CSV formatted output
    const csvLines = lines.filter(l => l.includes(','));
    if (csvLines.length >= 2) {
      const headers = csvLines[0].split(',').map(c => c.trim());
      const rows = csvLines.slice(1).map(l => l.split(',').map(c => c.trim()));
      return { headers, rows, rawNonTableLines: [] };
    }

    return null;
  }, [output]);

  const filteredRows = useMemo(() => {
    if (!parsedData) return [];
    if (!searchFilter.trim()) return parsedData.rows;

    const q = searchFilter.toLowerCase();
    return parsedData.rows.filter(row =>
      row.some(cell => cell.toLowerCase().includes(q))
    );
  }, [parsedData, searchFilter]);

  const handleCopy = () => {
    const textToCopy = output || error || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!parsedData) return;
    const csvContent = [
      parsedData.headers.join(','),
      ...parsedData.rows.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Top Action Bar */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <Database size={15} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Database Output
          </span>

          {parsedData && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {parsedData.rows.length} {parsedData.rows.length === 1 ? 'row' : 'rows'} • {parsedData.headers.length} cols
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Table / Raw Toggle */}
          <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table size={13} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'raw'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Terminal size={13} />
              <span>Console</span>
            </button>
          </div>

          {parsedData && (
            <button
              onClick={handleExportCsv}
              title="Export as CSV"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Download size={14} />
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy Output"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[460px] flex flex-col overflow-hidden">
        {/* Error Notification */}
        {error && (
          <div className="p-3.5 m-3 mb-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2.5 text-rose-800 dark:text-rose-300 text-xs">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="font-mono whitespace-pre-wrap">{error}</div>
          </div>
        )}

        {/* Search Bar when Table is Active */}
        {viewMode === 'table' && parsedData && parsedData.rows.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-2">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Filter table rows..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full text-xs bg-transparent border-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && parsedData ? (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 w-10 text-center select-none">
                    #
                  </th>
                  {parsedData.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] border-r border-slate-200 dark:border-slate-700/60 last:border-r-0 select-none"
                    >
                      {header || `col_${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group"
                    >
                      <td className="py-2 px-3 text-center text-[10px] font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 select-none">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2 px-3 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/40 last:border-r-0"
                        >
                          {cell === '' || cell === 'NULL' || cell === 'null' ? (
                            <span className="italic text-slate-400 dark:text-slate-600">NULL</span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={parsedData.headers.length + 1}
                      className="py-8 text-center text-slate-400 dark:text-slate-500"
                    >
                      {searchFilter ? 'No rows match filter criteria.' : 'Query executed successfully with 0 rows returned.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Any non-table messages appended */}
            {parsedData.rawNonTableLines.length > 0 && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-mono text-xs text-slate-600 dark:text-slate-400">
                {parsedData.rawNonTableLines.join('\n')}
              </div>
            )}
          </div>
        ) : (
          /* Raw / Console View or Fallback when parsing is not table-like */
          <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-950 font-mono text-xs overflow-auto">
            {output ? (
              <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {output}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                <Database size={32} className="mb-2 opacity-40" />
                <p>Run a query to view results.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

