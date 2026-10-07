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
  onDropFiles: (destinationFolder: string) => void;
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
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    onDropFiles(folderPath);
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
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
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
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                isDragOver
                  ? 'bg-cyan-500/25 ring-1 ring-cyan-400 text-cyan-200 scale-[1.02]'
                  : 'hover:bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Folder
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isDragOver ? 'text-cyan-300 fill-cyan-400/20' : 'text-amber-400/80 group-hover:text-amber-400'
                  }`}
                />
                <span className="truncate">{folder.name}</span>
              </div>

              {folder.direct_children_count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 text-slate-400">
                  {folder.direct_children_count}
                </span>
              )}
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
          <form onSubmit={handleCreateSubmit} className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              placeholder="Tên thư mục mới..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 bg-[#0f1117] border border-cyan-500/50 rounded px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded text-xs transition-colors"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-1.5 py-1 text-slate-400 hover:text-white text-xs"
            >
              Hủy
            </button>
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
