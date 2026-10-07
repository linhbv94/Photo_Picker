import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { SubfolderItem } from '../types';
import { t, Language } from '../i18n/translations';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  parentFolderName: string;
  subfolders: SubfolderItem[];
  language?: Language;
  onCreateSubfolder: (name: string) => void;
  onDropFiles: (destinationFolder: string, droppedPaths?: string[]) => void;
  onFolderContextMenu: (e: React.MouseEvent, folder: SubfolderItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  parentFolderName,
  subfolders,
  language = 'vi',
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
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragEnter = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
    setDragOverFolderId(folderId);
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
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
        title="Cmd/Ctrl+B"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <aside className="w-56 h-full bg-[#141821]/95 border-r border-white/5 flex flex-col shrink-0 select-none z-20">
      {/* Header */}
      <div className="h-10 px-3 border-b border-white/5 flex items-center justify-between text-xs font-medium text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate font-semibold text-slate-200" title={parentFolderName || 'Thư mục'}>
            {parentFolderName || 'Thư mục'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title={t('newFolder', language)}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Cmd/Ctrl+B"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subfolder list */}
      <div
        className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1"
        onDragLeave={handleContainerDragLeave}
      >
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase pointer-events-none">
          {t('subfolders', language)} ({subfolders.length})
        </div>

        {subfolders.map((folder) => {
          const isDragOver = dragOverFolderId === folder.id;
          return (
            <div
              key={folder.id}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragEnter={(e) => handleDragEnter(e, folder.id)}
              onDrop={(e) => handleDrop(e, folder.id)}
              onContextMenu={(e) => onFolderContextMenu(e, folder)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                isDragOver
                  ? 'bg-cyan-500/35 ring-2 ring-cyan-400 border border-cyan-300 text-white scale-[1.03] shadow-lg shadow-cyan-500/30'
                  : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate pointer-events-none">
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
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-400 text-black shadow-sm shrink-0 pointer-events-none">
                  {t('dropHere', language)}
                </span>
              ) : folder.direct_children_count > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 text-slate-400 pointer-events-none">
                  {folder.direct_children_count}
                </span>
              ) : null}
            </div>
          );
        })}

        {subfolders.length === 0 && (
          <div className="px-3 py-4 text-center text-slate-500 text-[11px] italic">
            {t('emptySubfolders', language)}
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
              placeholder={t('newFolderPrompt', language)}
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
                {t('cancel', language)}
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-2.5 py-0.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded text-xs transition-colors"
              >
                {t('create', language)}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all text-xs font-medium"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('newFolder', language)}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
