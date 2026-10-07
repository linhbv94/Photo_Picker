import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { SubfolderItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  parentFolderName: string;
  subfolders: SubfolderItem[];
  onCreateSubfolder: (name: string) => void;
  onDropFiles: (destinationFolder: string, droppedPaths?: string[]) => void;
  onFolderContextMenu: (e: React.MouseEvent, folder: SubfolderItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  parentFolderName,
  subfolders,
  onCreateSubfolder,
  onDropFiles,
  onFolderContextMenu,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateSubfolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget;
    const related = e.relatedTarget as Node | null;
    if (!target.contains(related)) {
      setDragOverFolderId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    let droppedPaths: string[] | undefined;
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (raw) {
        droppedPaths = JSON.parse(raw);
      }
    } catch {
      // Fallback if not valid JSON
    }
    onDropFiles(folderPath, droppedPaths);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="h-full w-4 bg-[#141821]/80 hover:bg-cyan-500/20 border-r border-white/5 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-colors shrink-0 z-30"
        title="Mở thanh thư mục (Cmd/Ctrl+B)"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <aside className="w-56 h-full bg-[#141821]/90 border-r border-white/5 flex flex-col shrink-0 select-none z-30 text-xs backdrop-blur-md">
      {/* Header */}
      <div className="h-9 px-3 border-b border-white/5 flex items-center justify-between text-slate-300 font-medium">
        <div className="flex items-center gap-1.5 truncate">
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate text-slate-200" title={parentFolderName}>
            {parentFolderName || 'Thư mục'}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded transition-colors"
          title="Thu gọn (Cmd/Ctrl+B)"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subfolder list */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Thư mục con ({subfolders.length})
        </div>

        {subfolders.map((folder) => {
          const isDragOver = dragOverFolderId === folder.id;
          return (
            <div
              key={folder.id}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              onContextMenu={(e) => onFolderContextMenu(e, folder)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                isDragOver
                  ? 'bg-cyan-500/35 ring-2 ring-cyan-400 border border-cyan-300 text-white scale-[1.03] shadow-lg shadow-cyan-500/30'
                  : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Folder
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isDragOver
                      ? 'text-cyan-300 fill-cyan-400 scale-125'
                      : 'text-amber-400/80 group-hover:text-amber-400'
                  }`}
                />
                <span className={`truncate ${isDragOver ? 'font-bold text-white' : ''}`}>
                  {folder.name}
                </span>
              </div>

              {isDragOver ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-400 text-black shadow-sm shrink-0">
                  Thả vào đây
                </span>
              ) : folder.direct_children_count > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 text-slate-400">
                  {folder.direct_children_count}
                </span>
              ) : null}
            </div>
          );
        })}

        {subfolders.length === 0 && (
          <div className="px-3 py-4 text-center text-slate-500 text-[11px] italic">
            Chưa có thư mục con
          </div>
        )}
      </div>

      {/* New Folder Action Footer */}
      <div className="p-2 border-t border-white/5 bg-black/20">
        {isCreating ? (
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-1.5 w-full">
            <input
              type="text"
              autoFocus
              placeholder="Tên thư mục mới..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full min-w-0 bg-[#0f1117] border border-cyan-500/50 rounded px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-0.5 text-slate-400 hover:text-white text-xs rounded hover:bg-white/5 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-2.5 py-0.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded text-xs transition-colors"
              >
                Lưu
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all text-xs font-medium"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thư mục mới</span>
          </button>
        )}
      </div>
    </aside>
  );
};
