import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { UploadZone } from './components/UploadZone';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ExportModal } from './components/ExportModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ScanResultData, ImageClientMetadata, ScanHistoryItem } from './types';
import { buildImageMetadata } from './utils/imageUtils';
import { AlertCircle, Shield, Globe, Search, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<ImageClientMetadata | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('scanner'); // 'scanner' | 'engines' | 'social' | 'forensics' | 'dorks'
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('visualtrace_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load history from storage:', e);
    }
  }, []);

  const saveToHistory = (data: ScanResultData, metadata: ImageClientMetadata, imageSrc: string) => {
    const newItem: ScanHistoryItem = {
      id: `scan-${Date.now()}`,
      timestamp: data.timestamp,
      subject: data.analysis.subject,
      thumbnail: imageSrc,
      category: data.analysis.category,
      resultsCount: data.groundedResults.length,
      data,
      metadata,
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('visualtrace_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save to local storage (likely quota):', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('visualtrace_history');
    } catch {}
  };

  const handleSelectHistoryScan = (item: ScanHistoryItem) => {
    setScanResult(item.data);
    setCurrentMetadata(item.metadata);
    setCurrentImageSrc(item.thumbnail);
    setActiveView('scanner');
    setError(null);
  };

  const handleImageSelected = async (file: File | Blob, dataUrl: string, clues: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentImageSrc(dataUrl);

    try {
      // 1. Compute client metadata (resolution, SHA-256 hash, EXIF, dominant colors)
      const mockFile = file instanceof File ? file : new File([file], 'target_image.jpg', { type: file.type || 'image/jpeg' });
      const metadata = await buildImageMetadata(mockFile, dataUrl);
      setCurrentMetadata(metadata);

      // 2. Query Server API with Gemini and Google Search Grounding
      const response = await fetch('/api/scan-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: metadata.mimeType,
          userClues: clues,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with HTTP status ${response.status}`);
      }

      const json = await response.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to process visual scan.');
      }

      setScanResult(json.data);
      saveToHistory(json.data, metadata, dataUrl);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err?.message || 'An unexpected error occurred while analyzing the image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewScan = () => {
    setScanResult(null);
    setCurrentImageSrc(null);
    setCurrentMetadata(null);
    setError(null);
    setActiveView('scanner');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Universal TopBar */}
      <TopBar
        onNewScan={handleNewScan}
        onExport={() => setIsExportOpen(true)}
        onToggleHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        hasResults={!!scanResult}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-start">
        {/* Error Notification Banner */}
        {error && (
          <div className="mb-6 max-w-4xl mx-auto w-full p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-3 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-semibold block mb-0.5">Investigation Error</span>
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switcher: Upload Zone vs Results Dashboard */}
        {!scanResult ? (
          <div className="py-4 sm:py-8 flex-1 flex flex-col justify-center">
            <UploadZone onImageSelected={handleImageSelected} isLoading={isLoading} />
          </div>
        ) : (
          <ResultsDashboard
            data={scanResult}
            metadata={currentMetadata!}
            imageSrc={currentImageSrc!}
            activeTab={activeView}
            setActiveTab={setActiveView}
            onNewScan={handleNewScan}
          />
        )}
      </main>

      {/* Subtle Footer conforming to Constitution */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 sm:px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span>VisualTrace Image Intelligence & OSINT Engine</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Client-side Cryptographic Hashing</span>
            <span aria-hidden="true">·</span>
            <span>Google Search Grounding</span>
            <span aria-hidden="true">·</span>
            <span>Reverse Engine Matrix</span>
          </div>
        </div>
      </footer>

      {/* Export Dossier Modal */}
      {scanResult && currentMetadata && currentImageSrc && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          data={scanResult}
          metadata={currentMetadata}
          imageSrc={currentImageSrc}
        />
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectScan={handleSelectHistoryScan}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
