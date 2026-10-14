import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Code, Printer } from 'lucide-react';
import { ScanResultData, ImageClientMetadata } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ScanResultData;
  metadata: ImageClientMetadata;
  imageSrc: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
  metadata,
  imageSrc,
}) => {
  const [activeFormat, setActiveFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    return `# VisualTrace OSINT Investigation Dossier
Generated: ${new Date(data.timestamp).toLocaleString()}

## Target Identification
- **Subject**: ${data.analysis.subject}
- **Category**: ${data.analysis.category}
- **SHA-256 Digest**: \`${metadata.sha256}\`
- **Resolution**: ${metadata.width} × ${metadata.height} (${metadata.aspectRatio})
- **File Size**: ${metadata.fileSizeFormatted}

## Executive Summary
${data.analysis.summary}

## Live Grounded Web Appearances (${data.groundedResults.length})
${data.groundedResults.map((r) => `- [${r.title}](${r.url}) (${r.domain})`).join('\n')}

## Detected Entities
${(data.analysis.entities || []).map((e) => `- **${e.name}** [${e.type}] - ${e.notes || ''}`).join('\n')}

## Extracted OCR Signage & Text
${(data.analysis.ocrText || []).map((t) => `- "${t}"`).join('\n')}

## Forensics & Authenticity
- **AI Generation Likelihood**: ${data.analysis.forensics?.aiGeneratedAssessment || 'N/A'}
- **Visual Artifacts**: ${data.analysis.forensics?.aiIndicators || 'N/A'}
- **Estimated Era**: ${data.analysis.forensics?.estimatedEra || 'N/A'}
- **Camera EXIF**: ${metadata.exif ? JSON.stringify(metadata.exif) : 'No embedded tags found'}

## Recommended Search Engines & Queries
${data.reverseEngineLinks.map((e) => `- **${e.name}**: ${e.queryUrl}`).join('\n')}

## Social Media Search Vectors
${data.socialScanTargets.map((s) => `- **${s.platform}**: ${s.deepUrl}`).join('\n')}

## OSINT Search Dorks
${(data.analysis.osintDorks || []).map((d) => `\`\`\`text\n${d}\n\`\`\``).join('\n')}
`;
  };

  const generateJson = () => {
    return JSON.stringify(
      {
        dossierMetadata: {
          generatedAt: data.timestamp,
          system: 'VisualTrace OSINT Engine',
          imageMetadata: metadata,
        },
        investigation: data,
      },
      null,
      2
    );
  };

  const currentContent = activeFormat === 'markdown' ? generateMarkdown() : generateJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], {
      type: activeFormat === 'markdown' ? 'text/markdown' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_dossier_${data.analysis.subject.replace(/[^a-zA-Z0-9]/g, '_')}.${
      activeFormat === 'markdown' ? 'md' : 'json'
    }`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Export Investigation Dossier</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFormat === 'markdown'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Markdown (.md)
            </button>
            <button
              onClick={() => setActiveFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFormat === 'json'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              JSON (.json)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Dossier</span>
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-3 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed max-h-[360px] whitespace-pre-wrap select-all">
          {currentContent}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800">
          <span className="text-xs text-slate-500 font-mono">
            {activeFormat === 'markdown' ? 'Markdown Document' : 'JSON Object'} · {currentContent.length} chars
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
