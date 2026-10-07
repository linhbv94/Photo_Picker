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
import { t, Language } from '../i18n/translations';

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
  language?: Language;
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
  language = 'vi',
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

  const effectiveCount = state.isMarkedTarget ? markedCount : 1;

  const isMac =
    typeof navigator !== 'undefined' &&
    (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Macintosh/.test(navigator.userAgent));

  const revealLabel = isMac ? t('revealInFinder', language) : t('revealInExplorer', language);
  const deleteShortcut = isMac ? 'Cmd+⌫' : 'Del';

  // Responsive boundary positioning
  const menuHeight = state.type === 'card' ? 440 : 200;
  const x = Math.max(10, Math.min(state.x, window.innerWidth - 240));
  const y = Math.max(10, Math.min(state.y, window.innerHeight - menuHeight - 16));

  return (
    <div
      ref={menuRef}
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-50 min-w-[220px] max-h-[calc(100vh-32px)] overflow-y-auto rounded-xl glass-dropdown py-1 text-xs border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {state.type === 'card' && (
        <>
          <button
            onClick={() => {
              onOpenSystemViewer();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{t('openSystemViewer', language)}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Enter</span>
          </button>

          <button
            onClick={() => {
              onQuickPreview();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{t('quickLook', language)}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Space</span>
          </button>

          <button
            onClick={() => {
              onToggleInfo();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('viewExifDetails', language)}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Cmd+I</span>
          </button>

          <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />

          <button
            onClick={() => {
              onToggleMark();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{t('toggleMarkSelection', language)}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">M</span>
          </button>

          <button
            onClick={() => {
              onRotateCw();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t('rotate90N', language, { count: effectiveCount })}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">R</span>
          </button>

          <button
            onClick={() => {
              onRotateCcw();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t('rotate270', language)}</span>
            </div>
          </button>

          <button
            onClick={() => {
              onBatchRename();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t('batchRenameBtn', language)}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Cmd+R</span>
          </button>

          <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />

          {/* Reveal in Finder / File Explorer */}
          <button
            onClick={() => {
              onRevealInFinder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{revealLabel}</span>
            </div>
          </button>

          <button
            onClick={() => {
              onCopyPath();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t('copyPath', language)}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Cmd+C</span>
          </button>

          {/* Prominent Delete to Trash Option */}
          <button
            onClick={() => {
              onMoveToTrash();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors font-medium"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>{effectiveCount > 1 ? t('moveToTrashCount', language, { count: effectiveCount }) : t('moveToTrash', language)}</span>
            </div>
            <span className="text-[10px] opacity-75 font-mono">{deleteShortcut}</span>
          </button>

          {subfolders.length > 0 && (
            <>
              <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
              <div className="px-3 py-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                {t('moveToSubfolder', language)}:
              </div>
              {subfolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    onMoveToFolder(folder.id);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-1.5 flex items-center gap-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
                >
                  <FolderInput className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </>
          )}
        </>
      )}

      {state.type === 'folder' && (
        <>
          <button
            onClick={() => {
              if (state.targetPath) onSetRootFolder(state.targetPath);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{t('openAsRoot', language)}</span>
          </button>

          <button
            onClick={() => {
              onRevealInFinder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{revealLabel}</span>
          </button>

          <button
            onClick={() => {
              onCopyPath();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{t('copyPath', language)}</span>
          </button>

          <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />

          <button
            onClick={() => {
              onCreateSubfolder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{t('newFolder', language)}</span>
          </button>

          <button
            onClick={() => {
              onRefresh();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{t('refreshSubfolder', language)}</span>
          </button>

          <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />

          <button
            onClick={() => {
              onMoveToTrash();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('deleteFolderToTrash', language)}</span>
          </button>
        </>
      )}

      {state.type === 'canvas' && (
        <>
          <button
            onClick={() => {
              onUnmarkAll();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <span>{t('unmarkAllMenu', language, { count: markedCount })}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Esc</span>
          </button>

          {markedCount > 0 && (
            <button
              onClick={() => {
                onMoveToTrash();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('moveToTrashCount', language, { count: markedCount })}</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">{deleteShortcut}</span>
            </button>
          )}

          <button
            onClick={() => {
              onRefresh();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{t('refreshFolder', language)}</span>
          </button>

          <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />

          <button
            onClick={() => {
              onOpenOtherFolder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{t('openFolder', language)}</span>
          </button>
        </>
      )}
    </div>
  );
};
