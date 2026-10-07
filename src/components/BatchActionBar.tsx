import React from 'react';
import { RotateCw, Edit3, FolderInput, X, Zap } from 'lucide-react';
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
  if (markedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-xl glass-dropdown shadow-2xl border border-amber-400/30 animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs">
      {/* Badge Count */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
        <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        <span>ĐÃ CHỌN {markedCount} ẢNH</span>
      </div>

      <div className="h-4 w-px bg-white/10 mx-1" />

      {/* Action Buttons */}
      <button
        onClick={onRotate}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all font-medium active:scale-95"
        title="Xoay 90° các ảnh đã chọn (R)"
      >
        <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
        <span>Xoay 90°</span>
      </button>

      <button
        onClick={onRename}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all font-medium active:scale-95"
        title="Đổi tên hàng loạt theo ngày chụp (F2)"
      >
        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
        <span>Đổi tên hàng loạt</span>
      </button>

      {/* Subfolder Move Selector */}
      {subfolders.length > 0 && (
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all font-medium">
            <FolderInput className="w-3.5 h-3.5 text-amber-400" />
            <span>Chuyển vào...</span>
          </button>

          <div className="absolute bottom-full left-0 mb-1 w-48 rounded-lg glass-dropdown py-1 hidden group-hover:block border border-white/10 shadow-2xl">
            {subfolders.map((f) => (
              <button
                key={f.id}
                onClick={() => onMoveToFolder(f.id)}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-cyan-500/20 truncate"
              >
                📁 {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-4 w-px bg-white/10 mx-1" />

      {/* Unmark All Button */}
      <button
        onClick={onUnmarkAll}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/30 transition-all font-medium active:scale-95"
        title="Hủy đánh dấu toàn bộ (Phím Esc)"
      >
        <X className="w-3.5 h-3.5" />
        <span>Hủy chọn tất cả (Esc)</span>
      </button>
    </div>
  );
};
