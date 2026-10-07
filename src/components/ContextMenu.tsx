import React, { useEffect, useRef } from 'react';
import {
  Eye,
  Info,
  Check,
  RotateCw,
  RotateCcw,
  Edit3,
  FolderInput,
  Copy,
  ExternalLink,
  Trash2,
  FolderOpen,
  FolderPlus,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { SubfolderItem } from '../types';

export type ContextMenuType = 'card' | 'folder' | 'canvas';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: ContextMenuType;
  targetId?: string;
  targetPath?: string;
  isMarkedTarget?: boolean;
}

interface ContextMenuProps {
  state: ContextMenuState;
  markedCount: number;
  subfolders: SubfolderItem[];
  onClose: () => void;
  onQuickPreview: () => void;
  onOpenSystemViewer: () => void;
  onToggleInfo: () => void;
  onToggleMark: () => void;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onBatchRename: () => void;
  onMoveToFolder: (folderPath: string) => void;
  onCopyPath: () => void;
  onRevealInFinder: () => void;
  onMoveToTrash: () => void;
  onSetRootFolder: (folderPath: string) => void;
  onCreateSubfolder: () => void;
  onRefresh: () => void;
  onUnmarkAll: () => void;
  onOpenOtherFolder: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  markedCount,
  subfolders,
  onClose,
  onQuickPreview,
  onOpenSystemViewer,
  onToggleInfo,
  onToggleMark,
  onRotateCw,
  onRotateCcw,
  onBatchRename,
  onMoveToFolder,
  onCopyPath,
  onRevealInFinder,
  onMoveToTrash,
  onSetRootFolder,
  onCreateSubfolder,
  onRefresh,
  onUnmarkAll,
  onOpenOtherFolder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [state.isOpen, onClose]);

  if (!state.isOpen) return null;

  // Keep menu within viewport
  const x = Math.min(state.x, window.innerWidth - 240);
  const y = Math.min(state.y, window.innerHeight - 340);

  const effectiveCount = state.isMarkedTarget ? markedCount : 1;

  return (
    <div
      ref={menuRef}
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-50 min-w-[210px] rounded-lg glass-dropdown py-1 text-xs border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {state.type === 'card' && (
        <>
          <button
            onClick={() => {
              onOpenSystemViewer();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mở System Viewer</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Enter</span>
          </button>

          <button
            onClick={() => {
              onQuickPreview();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xem nhanh (Quick Look)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Space</span>
          </button>

          <button
            onClick={() => {
              onToggleInfo();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Xem chi tiết EXIF</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Cmd+I</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              onToggleMark();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Đánh dấu tuyển chọn</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">M</span>
          </button>

          <button
            onClick={() => {
              onRotateCw();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Xoay 90° ({effectiveCount} ảnh)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">R</span>
          </button>

          <button
            onClick={() => {
              onRotateCcw();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Xoay ngược chiều 90°</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Shift+R</span>
          </button>

          <button
            onClick={() => {
              onBatchRename();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Đổi tên theo ngày chụp...</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">F2</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* Subfolder Submenu */}
          {subfolders.length > 0 && (
            <div className="relative group">
              <div className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <FolderInput className="w-3.5 h-3.5 text-amber-400" />
                  <span>Di chuyển vào thư mục con</span>
                </div>
                <span>▶</span>
              </div>

              <div className="absolute left-full top-0 ml-0.5 w-44 rounded-lg glass-dropdown py-1 hidden group-hover:block border border-white/10 shadow-2xl">
                {subfolders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onMoveToFolder(f.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 hover:text-cyan-200 truncate"
                  >
                    📁 {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onCopyPath();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Sao chép đường dẫn</span>
          </button>

          <button
            onClick={() => {
              onRevealInFinder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Mở trong Finder / Explorer</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              onMoveToTrash();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Chuyển vào Thùng rác</span>
          </button>
        </>
      )}

      {state.type === 'folder' && (
        <>
          <button
            onClick={() => {
              if (state.targetPath) onSetRootFolder(state.targetPath);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Đặt làm Thư mục chính</span>
          </button>

          <button
            onClick={() => {
              onCreateSubfolder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
            <span>Tạo thư mục con bên trong...</span>
          </button>

          {markedCount > 0 && state.targetPath && (
            <button
              onClick={() => {
                onMoveToFolder(state.targetPath!);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Chuyển {markedCount} ảnh đang chọn vào đây</span>
            </button>
          )}

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              onRevealInFinder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Mở trong Finder / Explorer</span>
          </button>
        </>
      )}

      {state.type === 'canvas' && (
        <>
          <button
            onClick={() => {
              onRefresh();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Làm mới danh sách (Refresh)</span>
          </button>

          <button
            onClick={() => {
              onCreateSubfolder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
            <span>Tạo thư mục con mới...</span>
          </button>

          {markedCount > 0 && (
            <button
              onClick={() => {
                onUnmarkAll();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Bỏ đánh dấu tất cả ({markedCount})</span>
            </button>
          )}

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              onOpenOtherFolder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Mở thư mục khác...</span>
          </button>
        </>
      )}
    </div>
  );
};
