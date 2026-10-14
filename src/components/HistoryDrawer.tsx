import React from 'react';
import { X, History, Trash2, ArrowRight } from 'lucide-react';
import { ScanHistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanHistoryItem[];
  onSelectScan: (item: ScanHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectScan,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-5 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Investigation History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No recent scans yet. Photos you search will appear here for instant reference.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectScan(item);
                  onClose();
                }}
                className="group p-3 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer flex gap-3 items-center"
              >
                <img
                  src={item.thumbnail}
                  alt={item.subject}
                  className="w-12 h-12 object-cover rounded-lg border border-slate-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {item.subject}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{item.category}</span>
                    <span>·</span>
                    <span className="font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              {history.length} {history.length === 1 ? 'record' : 'records'} stored locally
            </span>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
