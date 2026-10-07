import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { SubfolderItem } from '../types';
import { t, Language } from '../i18n/translations';

const DRAG_MIME = 'application/x-photo_picker_paths';

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

  useEffect(() => {
    const handleDragEnd = () => {
      setDragOverFolderId(null);
    };
    window.addEventListener('dragend', handleDragEnd);
    return () => window.removeEventListener('dragend', handleDragEnd);
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateSubfolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const isInternalDrag = (e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types || []);
    return types.includes(DRAG_MIME) || types.includes('text/plain');
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    if (!isInternalDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleFolderDragEnter = (e: React.DragEvent, folderId: string) => {
    if (!isInternalDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
    setDragOverFolderId(folderId);
  };

  const handleFolderDragLeave = (e: React.DragEvent<HTMLDivElement>, folderId: string) => {
    const nextTarget = e.relatedTarget as Node | null;
    if (nextTarget && e.currentTarget.contains(nextTarget)) {
      return;
    }
    if (nextTarget === null) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX < rect.right &&
        e.clientY >= rect.top &&
        e.clientY < rect.bottom
      ) {
        return;
      }
    }
    setDragOverFolderId((current) => (current === folderId ? null : current));
  };

  const handleFolderDrop = (e: React.DragEvent, folderPath: string) => {
    setDragOverFolderId(null);
    if (!isInternalDrag(e)) return;

    e.preventDefault();
    e.stopPropagation();

    let droppedPaths: string[] | undefined;
    try {
      const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          droppedPaths = [...new Set(parsed.filter((p): p is string => typeof p === 'string' && p.trim().length > 0))];
        }
      }
    } catch {
      // Fallback
    }

    if (droppedPaths && droppedPaths.length > 0) {
      onDropFiles(folderPath, droppedPaths);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="h-full w-4 bg-slate-100/90 hover:bg-cyan-50 dark:bg-[#141821]/80 dark:hover:bg-cyan-500/20 border-r border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors shrink-0 z-30"
        title="Cmd/Ctrl+B"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <aside className="w-56 h-full bg-slate-50/95 dark:bg-[#141821]/95 border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0 select-none z-20">
      {/* Header */}
      <div className="h-10 px-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <FolderOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="truncate font-semibold text-slate-800 dark:text-slate-200" title={parentFolderName || t('subfolders', language)}>
            {parentFolderName || t('subfolders', language)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating((prev) => !prev)}
            className={`p-1 rounded transition-colors ${
              isCreating
                ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300'
                : 'hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title={t('newFolder', language)}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded transition-colors"
            title="Cmd/Ctrl+B"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subfolder list */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase pointer-events-none">
          {t('subfolders', language)} ({subfolders.length})
        </div>

        {/* Inline New Folder Input when button at header is clicked */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="p-2 mb-2 rounded-lg bg-white dark:bg-[#0f1117] border border-cyan-500/50 shadow-md flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
            <input
              type="text"
              autoFocus
              placeholder={t('newFolderPrompt', language)}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="w-full min-w-0 bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {t('cancel', language)}
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-2.5 py-0.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold rounded text-xs transition-colors shadow-2xs"
              >
                {t('create', language)}
              </button>
            </div>
          </form>
        )}

        {subfolders.map((folder) => {
          const isDragOver = dragOverFolderId === folder.id;
          return (
            <div
              key={folder.id}
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragEnter={(e) => handleFolderDragEnter(e, folder.id)}
              onDragLeave={(e) => handleFolderDragLeave(e, folder.id)}
              onDrop={(e) => handleFolderDrop(e, folder.id)}
              onContextMenu={(e) => onFolderContextMenu(e, folder)}
              className={`group flex items-center justify-between px-2.5 py-2 rounded-lg transition-all cursor-pointer ${
                isDragOver
                  ? 'bg-cyan-500/35 ring-2 ring-cyan-400 border border-cyan-300 text-white scale-[1.03] shadow-lg shadow-cyan-500/30'
                  : 'hover:bg-slate-200/60 dark:hover:bg-white/5 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate pointer-events-none">
                <Folder
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isDragOver
                      ? 'text-cyan-300 fill-cyan-400 scale-125'
                      : 'text-amber-500 group-hover:text-amber-600 dark:text-amber-400/80 dark:group-hover:text-amber-400'
                  }`}
                />
                <span className={`truncate ${isDragOver ? 'font-bold text-white' : ''}`}>
                  {folder.name}
                </span>
              </div>

              {isDragOver ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 shadow-sm shrink-0 pointer-events-none">
                  {t('dropHere', language)}
                </span>
              ) : folder.direct_children_count > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-white/5 text-slate-600 dark:text-slate-400 pointer-events-none">
                  {folder.direct_children_count}
                </span>
              ) : null}
            </div>
          );
        })}

        {subfolders.length === 0 && !isCreating && (
          <div className="px-3 py-4 text-center text-slate-400 dark:text-slate-500 text-[11px] italic">
            {t('emptySubfolders', language)}
          </div>
        )}
      </div>
    </aside>
  );
};
