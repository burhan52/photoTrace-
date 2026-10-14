import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Search,
  Globe,
  Share2,
  Cpu,
  FileCode,
  Download,
  AlertCircle,
  Camera,
  MapPin,
  Sparkles,
  Maximize2,
  RefreshCw,
  Hash
} from 'lucide-react';
import { ScanResultData, ImageClientMetadata } from '../types';

interface ResultsDashboardProps {
  data: ScanResultData;
  metadata: ImageClientMetadata;
  imageSrc: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewScan: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  data,
  metadata,
  imageSrc,
  activeTab,
  setActiveTab,
  onNewScan,
}) => {
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [customDorkQuery, setCustomDorkQuery] = useState('');
  const [selectedDorkEngine, setSelectedDorkEngine] = useState<'google' | 'bing'>('google');

  const { analysis, groundedResults, searchSummary, reverseEngineLinks, socialScanTargets, searchQueries } = data;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const copyImageBlob = async () => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      // PNG conversion for clipboard API
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (pngBlob) => {
            if (pngBlob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': pngBlob }),
              ]);
              setCopiedImage(true);
              setTimeout(() => setCopiedImage(false), 2000);
            }
          }, 'image/png');
        }
      };
      img.src = imageSrc;
    } catch (err) {
      console.warn('Copy image failed:', err);
    }
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `visualtrace_${metadata.fileName || 'target'}.jpg`;
    a.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Match Identification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Target Thumbnail with Actions */}
          <div className="relative group w-full lg:w-56 shrink-0 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center">
            <img
              src={imageSrc}
              alt={analysis.subject}
              className="w-full h-44 object-cover object-center"
            />
            <div className="w-full p-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={copyImageBlob}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors font-medium text-[11px]"
                title="Copy image to paste into Google Lens or Yandex"
              >
                {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedImage ? 'Copied' : 'Copy Pic'}</span>
              </button>
              <button
                onClick={downloadImage}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors font-medium text-[11px]"
                title="Download image file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={onNewScan}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors font-medium text-[11px]"
                title="Upload another image"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Identification Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
                {analysis.category || 'Visual Match'}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-400">
                {metadata.width}×{metadata.height} px
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-mono">{metadata.fileSizeFormatted}</span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
              {analysis.subject}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {analysis.summary}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-left">
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Web Appearances</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {groundedResults.length}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Entities Identified</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {analysis.entities?.length || 0}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">OCR Text Matches</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {analysis.ocrText?.length || 0}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Target Search Vectors</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {reverseEngineLinks.length + socialScanTargets.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'scanner'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Web Appearances ({groundedResults.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('engines')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'engines'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Reverse Image Engines (6)</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'social'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Social Media Footprint</span>
        </button>

        <button
          onClick={() => setActiveTab('forensics')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'forensics'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Forensics & EXIF</span>
        </button>

        <button
          onClick={() => setActiveTab('dorks')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'dorks'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>OSINT Dorks</span>
        </button>
      </div>

      {/* Tab 1: Web Appearances & Live Sources */}
      {activeTab === 'scanner' && (
        <div className="space-y-4">
          {/* Grounding Summary */}
          {searchSummary && (
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Live Grounded Search Summary
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {searchSummary}
              </p>
            </div>
          )}

          {/* Grounded Web Results Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Online Publications & Indexed Matches ({groundedResults.length})
              </h3>
              <span className="text-xs text-slate-500">Live Web Index</span>
            </div>

            {groundedResults.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">
                  No exact public URL returned from direct web grounding yet
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                  Launch the dedicated visual search engines in the next tab (Google Lens & Yandex) to execute deeper image-hash comparisons.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {groundedResults.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 truncate max-w-[200px]">
                          {item.domain || 'web'}
                        </span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 flex items-center gap-1.5"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                      </a>
                      <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                        {item.url}
                      </p>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Identified Entities Card */}
          {analysis.entities && analysis.entities.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                Detected Entities & Key Subjects
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.entities.map((entity, i) => (
                  <div key={i} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white truncate">{entity.name}</span>
                      <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {entity.type}
                      </span>
                    </div>
                    {entity.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{entity.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OCR Extracted Text Card */}
          {analysis.ocrText && analysis.ocrText.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                Extracted Text & In-Image Signage (OCR)
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.ocrText.map((text, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300"
                  >
                    <span>"{text}"</span>
                    <button
                      onClick={() => copyToClipboard(`"${text}"`, `ocr-${i}`)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Copy phrase"
                    >
                      {copiedQuery === `ocr-${i}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reverse Image Engines Matrix */}
      {activeTab === 'engines' && (
        <div className="space-y-4">
          {/* Quick instructions banner */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-3">
            <Camera className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white block mb-0.5">
                How to perform 1-Click Reverse Image Searches:
              </span>
              Click <strong>"Launch Search"</strong> to open the engine directly with pre-filled visual keywords, or click <strong>"Copy Image"</strong> above and paste directly into Google Lens or Yandex file uploaders!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reverseEngineLinks.map((engine, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{engine.name}</span>
                    {engine.badge && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                        {engine.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">
                    {engine.category}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {engine.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <a
                    href={engine.queryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 text-xs font-semibold text-center text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Visual Search</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={engine.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Open Engine Uploader directly"
                  >
                    Upload Tool
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Social Media Footprint */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-1">
              Social Media Cross-Reference Targets
            </h3>
            <p className="text-xs text-slate-400">
              Direct search queries targeted across major social platforms for photos, usernames, threads, and viral publications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialScanTargets.map((social, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      {social.platform}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Query Vector
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{social.purpose}</p>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 mb-4 font-mono text-xs text-slate-300 flex items-center justify-between gap-2">
                    <span className="truncate">"{social.query}"</span>
                    <button
                      onClick={() => copyToClipboard(social.query, `soc-${idx}`)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                      title="Copy query"
                    >
                      {copiedQuery === `soc-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <a
                    href={social.deepUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 text-xs font-semibold text-center text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Search {social.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Reddit Community Investigation Tools */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-4">
            <h4 className="text-xs font-semibold text-white mb-2">
              Helpful Crowdsource & Reverse Communities on Reddit:
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { name: 'r/WhatIsThisThing', url: 'https://reddit.com/r/whatisthisthing' },
                { name: 'r/HelpMeFind', url: 'https://reddit.com/r/HelpMeFind' },
                { name: 'r/WhereIsThis', url: 'https://reddit.com/r/whereisthis' },
                { name: 'r/RBI (Reddit Bureau of Investigation)', url: 'https://reddit.com/r/RBI' },
                { name: 'r/TipOfMyTongue', url: 'https://reddit.com/r/tipofmytongue' },
              ].map((sub, i) => (
                <a
                  key={i}
                  href={sub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 font-mono transition-colors flex items-center gap-1"
                >
                  <span>{sub.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Forensics & Technical EXIF */}
      {activeTab === 'forensics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Forensics Assessment */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                AI Generation & Authenticity
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Generation Assessment</span>
                  <span className="text-sm font-semibold text-white mt-0.5 block">
                    {analysis.forensics?.aiGeneratedAssessment || 'Likely Real Photograph'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Visual Artifacts & Optical Clues</span>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {analysis.forensics?.aiIndicators || 'Natural optical depth-of-field and realistic grain observed.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Estimated Era / Period</span>
                  <span className="text-slate-300 mt-0.5 block font-mono">
                    {analysis.forensics?.estimatedEra || 'Modern'}
                  </span>
                </div>

                {analysis.forensics?.tamperingClues && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Tampering & Edit Clues</span>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      {analysis.forensics.tamperingClues}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Metadata & EXIF */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Camera Metadata & Cryptographic Hashes
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">SHA-256 Digest (Exact Match Fingerprint)</span>
                  <div className="flex items-center justify-between gap-2 mt-1 font-mono text-[11px] text-cyan-400 bg-slate-900 p-1.5 rounded truncate">
                    <span className="truncate">{metadata.sha256}</span>
                    <button
                      onClick={() => copyToClipboard(metadata.sha256, 'sha256')}
                      className="text-slate-400 hover:text-white"
                      title="Copy SHA-256"
                    >
                      {copiedQuery === 'sha256' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Dimensions</span>
                    <span className="text-slate-200 font-mono">{metadata.width} × {metadata.height} px</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Aspect Ratio</span>
                    <span className="text-slate-200 font-mono">{metadata.aspectRatio}</span>
                  </div>
                </div>

                {/* EXIF Data if available */}
                {metadata.exif ? (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-slate-500 block text-[11px]">Embedded EXIF Header Tags</span>
                    {metadata.exif.cameraMake && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Camera Make:</span>
                        <span className="font-mono">{metadata.exif.cameraMake}</span>
                      </div>
                    )}
                    {metadata.exif.cameraModel && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Camera Model:</span>
                        <span className="font-mono">{metadata.exif.cameraModel}</span>
                      </div>
                    )}
                    {metadata.exif.dateTimeOriginal && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono">{metadata.exif.dateTimeOriginal}</span>
                      </div>
                    )}
                    {metadata.exif.software && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Software:</span>
                        <span className="font-mono">{metadata.exif.software}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-400 text-[11px]">
                    No embedded EXIF metadata found (standard for web-compressed or screenshot images).
                  </div>
                )}

                {/* Dominant Color Palette */}
                {metadata.dominantColors && metadata.dominantColors.length > 0 && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px] mb-1.5">Dominant Color Swatches</span>
                    <div className="flex items-center gap-2">
                      {metadata.dominantColors.map((color, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className="w-8 h-8 rounded-md border border-slate-700 shadow-inner"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[9px] font-mono text-slate-400">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: OSINT Dorks & Query Builder */}
      {activeTab === 'dorks' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-1">
              Advanced Search Engine Dorks (Google & Bing)
            </h3>
            <p className="text-xs text-slate-400">
              Copy and execute these specialized queries directly in Google or Bing to isolate exact photo publications, social accounts, and high-precision mentions.
            </p>
          </div>

          {/* Preset Dorks Generated from Image */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-slate-300 mb-3">
              Automated Dork Queries for this Photo:
            </h4>
            <div className="space-y-2.5">
              {(analysis.osintDorks || []).map((dork, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono"
                >
                  <span className="text-cyan-400 truncate flex-1">{dork}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(dork, `dork-${i}`)}
                      className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors flex items-center gap-1"
                    >
                      {copiedQuery === `dork-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedQuery === `dork-${i}` ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded transition-colors flex items-center gap-1"
                    >
                      <span>Run</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Dork Query Builder */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">
              Interactive Custom OSINT Query Builder:
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Construct tailored site dorks using detected keywords, person name, or phrases:
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {[
                `site:instagram.com "${analysis.subject}"`,
                `site:twitter.com "${analysis.subject}"`,
                `site:linkedin.com/in "${analysis.subject}"`,
                `site:reddit.com "${analysis.subject}"`,
                `filetype:jpg "${analysis.subject}"`,
                `intitle:"${analysis.subject}"`,
              ].map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setCustomDorkQuery(template)}
                  className="px-2.5 py-1 text-[11px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="site:instagram.com 'name'"
                value={customDorkQuery}
                onChange={(e) => setCustomDorkQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(customDorkQuery || analysis.subject)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Launch in Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://www.bing.com/search?q=${encodeURIComponent(customDorkQuery || analysis.subject)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Bing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
