import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Edit3, FolderInput, X, Zap, ChevronUp } from 'lucide-react';
import { SubfolderItem } from '../types';

interface BatchActionBarProps {
  markedCount: number;
  subfolders: SubfolderItem[];
  onRotate: () => void;
  onRename: () => void;
  onMoveToFolder: (folderPath: string) => void;
  onUnmarkAll: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  markedCount,
  subfolders,
  onRotate,
  onRename,
  onMoveToFolder,
  onUnmarkAll,
}) => {
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setIsFolderMenuOpen(false);
      }
    };
    if (isFolderMenuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isFolderMenuOpen]);

  if (markedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-2.5 rounded-2xl glass-dropdown shadow-2xl border border-amber-400/30 animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs whitespace-nowrap min-w-fit select-none">
      {/* Badge Count (Strict single line) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 whitespace-nowrap shrink-0">
        <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
        <span>ĐÃ CHỌN {markedCount} ẢNH</span>
      </div>

      <div className="h-5 w-px bg-white/10 shrink-0" />

      {/* Action: Rotate */}
      <button
        onClick={onRotate}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all font-medium active:scale-95 whitespace-nowrap shrink-0"
        title="Xoay 90° các ảnh đã chọn (R)"
      >
        <RotateCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Xoay 90°</span>
      </button>

      {/* Action: Rename */}
      <button
        onClick={onRename}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all font-medium active:scale-95 whitespace-nowrap shrink-0"
        title="Đổi tên hàng loạt theo ngày chụp (Cmd/Ctrl+R)"
      >
        <Edit3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Đổi tên hàng loạt</span>
      </button>

      {/* Action: Move to Subfolder (Click-to-Toggle Dropdown, never vanishes accidentally) */}
      {subfolders.length > 0 && (
        <div ref={folderMenuRef} className="relative shrink-0">
          <button
            onClick={() => setIsFolderMenuOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all font-medium active:scale-95 whitespace-nowrap ${
              isFolderMenuOpen
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Chuyển ảnh vào thư mục con"
          >
            <FolderInput className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Chuyển vào...</span>
            <ChevronUp className={`w-3 h-3 text-slate-400 transition-transform ${isFolderMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFolderMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl glass-dropdown p-1.5 z-50 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 border-b border-white/5 mb-1">
                Chọn thư mục đích
              </div>
              {subfolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onMoveToFolder(f.id);
                    setIsFolderMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-200 hover:text-white hover:bg-cyan-500/20 transition-colors flex items-center gap-2 truncate"
                >
                  <span className="shrink-0">📁</span>
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-5 w-px bg-white/10 shrink-0" />

      {/* Action: Unmark All (Strict single line) */}
      <button
        onClick={onUnmarkAll}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/30 transition-all font-medium active:scale-95 whitespace-nowrap shrink-0"
        title="Hủy đánh dấu toàn bộ (Phím Esc)"
      >
        <X className="w-3.5 h-3.5 shrink-0" />
        <span>Hủy chọn tất cả (Esc)</span>
      </button>
    </div>
  );
};
