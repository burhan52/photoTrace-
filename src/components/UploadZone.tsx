import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Link,
  Crop,
  Search,
  Sparkles,
  Clipboard,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PRESET_IMAGES, PresetItem } from '../presets';
import { CropModal } from './CropModal';

interface UploadZoneProps {
  onImageSelected: (file: File | Blob, dataUrl: string, clues: string) => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [userClues, setUserClues] = useState('');
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoading]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WEBP, GIF, HEIC).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImageSrc(result);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadUrl = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setUrlError(null);

    try {
      // Fetch image through browser
      const res = await fetch(urlInput.trim());
      if (!res.ok) throw new Error('Could not fetch image from URL');
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImageSrc(result);
        setSelectedFile(blob);
        setUrlLoading(false);
        setShowUrlField(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setUrlLoading(false);
      setUrlError('Unable to load image directly due to CORS. Try copying and pasting the image instead.');
    }
  };

  const handleSelectPreset = async (preset: PresetItem) => {
    try {
      const res = await fetch(preset.imageSrc);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImageSrc(result);
        setSelectedFile(blob);
        setUserClues(preset.suggestedClue);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load preset:', err);
    }
  };

  const handleApplyCropped = (croppedDataUrl: string) => {
    setSelectedImageSrc(croppedDataUrl);
    // Convert base64 to Blob
    fetch(croppedDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        setSelectedFile(blob);
      });
  };

  const handleStartSearch = () => {
    if (!selectedFile || !selectedImageSrc) return;
    onImageSelected(selectedFile, selectedImageSrc, userClues);
  };

  const handleClear = () => {
    setSelectedImageSrc(null);
    setSelectedFile(null);
    setUserClues('');
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Intro Heading */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Multi-Engine Reverse Search & AI Visual OSINT
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white max-w-2xl mx-auto" style={{ textWrap: 'balance' }}>
          Discover Everywhere a Photo Appears Online
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl mx-auto">
          Scan search engines, social media platforms, news articles, and reverse indexes to identify persons, landmarks, sources, and digital appearances.
        </p>
      </div>

      {/* Main Upload Box */}
      {!selectedImageSrc ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-slate-900/60 backdrop-blur-sm ${
            dragOver
              ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-semibold text-white mb-1">
            Drop photo here or choose from device
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Supports JPEG, PNG, WEBP, GIF, and HEIC up to 25MB · Paste with <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300">Ctrl+V</kbd>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all active:scale-95"
            >
              Browse Image File
            </button>
            <button
              onClick={() => setShowUrlField(!showUrlField)}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Link className="w-3.5 h-3.5 text-slate-400" />
              Search from Web URL
            </button>
          </div>

          {/* URL Input Accordion */}
          {showUrlField && (
            <div className="mt-5 max-w-lg mx-auto p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-left">
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Image Web URL:</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleLoadUrl}
                  disabled={urlLoading || !urlInput.trim()}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {urlLoading ? 'Fetching...' : 'Load'}
                </button>
              </div>
              {urlError && <p className="text-[11px] text-rose-400 mt-2">{urlError}</p>}
            </div>
          )}

          {/* Sample Preset Presets */}
          <div className="mt-10 pt-6 border-t border-slate-800/80">
            <div className="text-xs font-medium text-slate-400 mb-3 flex items-center justify-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Or test instantly with sample investigative photos:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="group flex items-center gap-3 p-2.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all text-left"
                >
                  <img
                    src={preset.imageSrc}
                    alt={preset.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-700/60 group-hover:scale-105 transition-transform shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {preset.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{preset.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview & Scan Execution Card */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Image preview & crop affordances */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative group w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center max-h-[340px]">
                <img
                  src={selectedImageSrc}
                  alt="Ready to scan"
                  className="max-h-[340px] w-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setIsCropOpen(true)}
                    className="p-2 bg-slate-900/90 text-cyan-400 hover:text-white rounded-lg border border-slate-700 shadow-md transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Crop className="w-4 h-4" />
                    Crop / ROI
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-2 bg-slate-900/90 text-rose-400 hover:text-white rounded-lg border border-slate-700 shadow-md transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fast crop / change triggers */}
              <div className="flex items-center justify-between w-full mt-2.5 text-xs text-slate-400 px-1">
                <button
                  onClick={() => setIsCropOpen(true)}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1 font-medium"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Crop Face or Object
                </button>
                <button
                  onClick={handleClear}
                  className="hover:text-rose-400 transition-colors"
                >
                  Change Photo
                </button>
              </div>
            </div>

            {/* Right: Search Setup & Investigator Clues */}
            <div className="md:col-span-7 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-base font-semibold text-white mb-1">
                  Ready for Visual Trace & Identification
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  We will query Gemini AI visual intelligence, Google Search grounding, 6 reverse search engines, and target social media platforms to locate online occurrences.
                </p>

                {/* Optional Context/Clues Input */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Investigative Clues / Known Context <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Suspected tech conference, possible location in Europe, person might be a founder or artist..."
                    value={userClues}
                    onChange={(e) => setUserClues(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Adding context helps disambiguate common faces or generic scenes.
                  </p>
                </div>

                {/* Engines included info */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-5">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Targeted Discovery Vectors:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300 font-mono">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Google Lens</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Yandex Facial</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Bing Visual</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">TinEye Origin</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">X / Twitter</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Reddit & Instagram</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleStartSearch}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Scanning Web & Social Footprint...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Search All Engines & Social Media</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Region of Interest Crop Modal */}
      {selectedImageSrc && (
        <CropModal
          imageSrc={selectedImageSrc}
          isOpen={isCropOpen}
          onClose={() => setIsCropOpen(false)}
          onApplyCrop={handleApplyCropped}
        />
      )}
    </div>
  );
};
