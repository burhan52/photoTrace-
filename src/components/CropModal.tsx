import React, { useState, useRef, useEffect } from 'react';
import { Crop, Check, X, RotateCcw } from 'lucide-react';

interface CropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyCrop: (croppedDataUrl: string) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onApplyCrop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 20,
    y: 20,
    width: 60,
    height: 60,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setCropBox({ x: 15, y: 15, width: 70, height: 70 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    setCropBox((prev) => {
      const newX = Math.max(0, Math.min(100 - prev.width, prev.x + dx));
      const newY = Math.max(0, Math.min(100 - prev.height, prev.y + dy));
      return { ...prev, x: newX, y: newY };
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePresetPreset = (preset: 'face' | 'center' | 'wide' | 'reset') => {
    if (preset === 'face') {
      setCropBox({ x: 25, y: 10, width: 50, height: 50 });
    } else if (preset === 'center') {
      setCropBox({ x: 20, y: 20, width: 60, height: 60 });
    } else if (preset === 'wide') {
      setCropBox({ x: 5, y: 20, width: 90, height: 60 });
    } else {
      setCropBox({ x: 0, y: 0, width: 100, height: 100 });
    }
  };

  const applyCrop = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceX = (cropBox.x / 100) * img.naturalWidth;
    const sourceY = (cropBox.y / 100) * img.naturalHeight;
    const sourceW = (cropBox.width / 100) * img.naturalWidth;
    const sourceH = (cropBox.height / 100) * img.naturalHeight;

    canvas.width = sourceW;
    canvas.height = sourceH;
    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onApplyCrop(croppedDataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Crop Region of Interest</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Focus reverse search specifically on a face, emblem, sign, or object. Drag the selection box below.
        </p>

        {/* Quick presets */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-500 font-medium">Quick focus:</span>
          <button
            onClick={() => handlePresetPreset('face')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Portrait / Face (1:1)
          </button>
          <button
            onClick={() => handlePresetPreset('center')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Center Object
          </button>
          <button
            onClick={() => handlePresetPreset('wide')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Landscape Banner
          </button>
          <button
            onClick={() => handlePresetPreset('reset')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Full Image
          </button>
        </div>

        {/* Interactive Canvas/Image Viewport */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative mt-4 flex-1 min-h-[300px] max-h-[460px] flex items-center justify-center bg-slate-950 rounded-lg overflow-hidden select-none border border-slate-800"
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Source to crop"
            className="max-h-[440px] max-w-full object-contain pointer-events-none"
          />

          {/* Semi-transparent dark overlay */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          {/* Crop highlight box */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.width}%`,
              height: `${cropBox.height}%`,
            }}
            className="absolute border-2 border-cyan-400 cursor-move bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          >
            {/* Rule of thirds grid lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-cyan-300" />
              <div className="border-r border-b border-cyan-300" />
              <div className="border-b border-cyan-300" />
              <div className="border-r border-b border-cyan-300" />
              <div className="border-r border-b border-cyan-300" />
              <div className="border-b border-cyan-300" />
              <div className="border-r border-cyan-300" />
              <div className="border-r border-cyan-300" />
              <div />
            </div>
            <div className="absolute -top-6 left-0 bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-t">
              Target ROI
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-400">
            Coordinates: {Math.round(cropBox.x)}%, {Math.round(cropBox.y)}% · {Math.round(cropBox.width)}% × {Math.round(cropBox.height)}%
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applyCrop}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Crop & Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
