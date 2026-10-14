import React from 'react';
import { ShieldCheck, Plus, Download, History } from 'lucide-react';

interface TopBarProps {
  onNewScan: () => void;
  onExport: () => void;
  onToggleHistory: () => void;
  historyCount: number;
  hasResults: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onNewScan,
  onExport,
  onToggleHistory,
  historyCount,
  hasResults,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm shadow-cyan-500/20 text-white">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={() => setActiveView('scanner')}
            className="text-left text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            VisualTrace
            <span className="text-xs font-mono font-normal text-slate-400">OSINT</span>
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveView('scanner')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeView === 'scanner' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Image Scanner
          </button>
          <button
            onClick={() => setActiveView('engines')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeView === 'engines' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Search Engines
          </button>
          <button
            onClick={() => setActiveView('social')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeView === 'social' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Social Footprint
          </button>
          <button
            onClick={() => setActiveView('forensics')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeView === 'forensics' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Forensic Dossier
          </button>
          <button
            onClick={() => setActiveView('dorks')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeView === 'dorks' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            OSINT Dorks
          </button>
        </nav>

        {/* Zone 3: Primary Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
            title="Scan history"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="font-mono text-[11px] text-cyan-400 tabular-nums">({historyCount})</span>
            )}
          </button>

          {hasResults && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
              title="Export Forensic Dossier"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <button
            onClick={onNewScan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm shadow-cyan-400/20 transition-all whitespace-nowrap shrink-0 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
