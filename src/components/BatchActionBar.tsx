import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Edit3, FolderInput, X, Zap, ChevronUp, Trash2 } from 'lucide-react';
import { SubfolderItem } from '../types';
import { t, Language } from '../i18n/translations';

interface BatchActionBarProps {
  markedCount: number;
  subfolders: SubfolderItem[];
  language?: Language;
  onRotate: () => void;
  onRename: () => void;
  onMoveToFolder: (folderPath: string) => void;
  onDeleteToTrash: () => void;
  onUnmarkAll: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  markedCount,
  subfolders,
  language = 'vi',
  onRotate,
  onRename,
  onMoveToFolder,
  onDeleteToTrash,
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-dropdown shadow-2xl border border-amber-500/40 animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs whitespace-nowrap min-w-fit select-none">
      {/* Badge Count (Strict single line) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-400/30 whitespace-nowrap shrink-0">
        <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
        <span>{t('selectedCount', language, { count: markedCount })}</span>
      </div>

      <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0" />

      {/* Action: Rotate */}
      <button
        onClick={onRotate}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-all font-medium active:scale-95 whitespace-nowrap shrink-0 shadow-2xs"
        title="R"
      >
        <RotateCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <span>{t('rotate90', language)}</span>
      </button>

      {/* Action: Rename */}
      <button
        onClick={onRename}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-all font-medium active:scale-95 whitespace-nowrap shrink-0 shadow-2xs"
        title="Cmd/Ctrl+R"
      >
        <Edit3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <span>{t('batchRenameBtn', language)}</span>
      </button>

      {/* Action: Move to Subfolder (Click-to-Toggle Dropdown) */}
      {subfolders.length > 0 && (
        <div ref={folderMenuRef} className="relative shrink-0">
          <button
            onClick={() => setIsFolderMenuOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-medium active:scale-95 whitespace-nowrap shadow-2xs ${
              isFolderMenuOpen
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white'
            }`}
          >
            <FolderInput className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>{t('moveTo', language)}</span>
            <ChevronUp className={`w-3 h-3 text-slate-400 transition-transform ${isFolderMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFolderMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl glass-dropdown p-1.5 z-50 shadow-2xl border border-slate-200 dark:border-white/15 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-200 dark:border-white/5 mb-1">
                {t('chooseSubfolder', language)}
              </div>
              {subfolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onMoveToFolder(f.id);
                    setIsFolderMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-white hover:bg-cyan-50 dark:hover:bg-cyan-500/20 transition-colors flex items-center gap-2 truncate"
                >
                  <span className="shrink-0">📁</span>
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action: Delete to Trash */}
      <button
        onClick={onDeleteToTrash}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/30 transition-all font-medium active:scale-95 whitespace-nowrap shrink-0 shadow-2xs"
        title="Cmd+Delete / Delete"
      >
        <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>{t('moveToTrash', language)}</span>
      </button>

      <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0" />

      {/* Action: Unmark All (Strict single line) */}
      <button
        onClick={onUnmarkAll}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:hover:text-white dark:border-white/10 transition-all font-medium active:scale-95 whitespace-nowrap shrink-0 shadow-2xs"
        title="Esc"
      >
        <X className="w-3.5 h-3.5 shrink-0" />
        <span>{t('cancelSelection', language)}</span>
      </button>
    </div>
  );
};
