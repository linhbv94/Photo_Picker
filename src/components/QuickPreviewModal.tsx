import React, { useEffect } from 'react';
import {
  X,
  RotateCw,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { FileItem } from '../types';
import { tauriApi } from '../services/tauriApi';

interface QuickPreviewModalProps {
  isOpen: boolean;
  item: FileItem | null;
  currentIndex: number;
  totalCount: number;
  isMarked: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleMark: () => void;
  onRotate: () => void;
  onOpenSystemViewer: () => void;
}

export const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
  isOpen,
  item,
  currentIndex,
  totalCount,
  isMarked,
  onClose,
  onNext,
  onPrev,
  onToggleMark,
  onRotate,
  onOpenSystemViewer,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRotate();
      } else if (e.key === 'm' || e.key === 'M' || e.key === '1') {
        e.preventDefault();
        onToggleMark();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onOpenSystemViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev, onRotate, onToggleMark, onOpenSystemViewer]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-xl animate-in fade-in duration-150 select-none">
      {/* Top Bar */}
      <div className="h-11 px-4 flex items-center justify-between border-b border-white/10 text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-white truncate max-w-md">{item.filename}</span>
          <span className="text-slate-500">
            ({currentIndex + 1} / {totalCount})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSystemViewer}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 transition-colors text-xs"
            title="Mở bằng Trình xem mặc định (Enter)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Mở System Viewer</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Đóng xem nhanh (Space / Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-6 overflow-hidden">
        {/* Nav Buttons */}
        <button
          onClick={onPrev}
          className="absolute left-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all hover:scale-110"
          title="Ảnh trước (Mũi tên Trái)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <img
          src={tauriApi.toAssetUrl(item.path)}
          alt={item.filename}
          className="max-h-full max-w-full object-contain rounded shadow-2xl drop-shadow-2xl"
        />

        <button
          onClick={onNext}
          className="absolute right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all hover:scale-110"
          title="Ảnh sau (Mũi tên Phải)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Floating Bar */}
      <div className="h-14 border-t border-white/10 px-6 flex items-center justify-between text-xs bg-black/40">
        <div className="flex items-center gap-4 text-slate-400">
          {item.exif?.camera_model && (
            <span className="text-cyan-300 font-medium">📷 {item.exif.camera_model}</span>
          )}
          {item.exif?.lens_model && <span>{item.exif.lens_model}</span>}
          {item.exif?.aperture_f_number && (
            <span>f/{item.exif.aperture_f_number.toFixed(1)}</span>
          )}
          {item.exif?.exposure_time && <span>{item.exif.exposure_time}s</span>}
          {item.exif?.iso_rating && <span>ISO {item.exif.iso_rating}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRotate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors font-medium"
            title="Xoay 90° cùng chiều kim đồng hồ (Phím R)"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Xoay 90°</span>
          </button>

          <button
            onClick={onToggleMark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium ${
              isMarked
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/30'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
            title="Đánh dấu chọn (Phím M hoặc 1)"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{isMarked ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
