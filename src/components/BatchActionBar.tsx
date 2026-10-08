import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Edit3, Copy, Scissors, FolderInput, X, Zap, ChevronUp, Trash2 } from 'lucide-react';
import { SubfolderItem } from '../types';
import { t, Language } from '../i18n/translations';

interface BatchActionBarProps {
  markedCount: number;
  subfolders: SubfolderItem[];
  language?: Language;
  onRotate: () => void;
  onRename: () => void;
  onCopy: () => void;
  onCut: () => void;
  onMoveToFolder: (folderPath: string) => void;
  onDeleteToTrash: () => void;
  onUnmarkAll: () => void;
}

const ActionTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="pointer-events-none absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium shadow-xl border border-white/15 opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap z-50 scale-95 group-hover:scale-100 drop-shadow-md">
    {text}
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800" />
  </div>
);

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  markedCount,
  subfolders,
  language = 'vi',
  onRotate,
  onRename,
  onCopy,
  onCut,
  onMoveToFolder,
  onDeleteToTrash,
  onUnmarkAll,
}) => {
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const folderMenuRef = useRef<HTMLDivElement>(null);
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent);

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-dropdown shadow-2xl border border-amber-500/40 animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs whitespace-nowrap min-w-fit select-none">
      {/* Badge Count: Keep Label & Icon ('X selected') */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-400/30 whitespace-nowrap shrink-0">
        <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
        <span>{t('selectedCount', language, { count: markedCount })}</span>
      </div>

      <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />

      {/* Action 1: Rotate 90° (Icon Only, Tooltip on Hover) */}
      <button
        onClick={onRotate}
        className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-all active:scale-95 shrink-0 shadow-2xs group relative"
        aria-label={t('rotate90', language)}
      >
        <RotateCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <ActionTooltip text={`${t('rotate90', language)} (R)`} />
      </button>

      {/* Action 2: Batch Rename (Icon Only) */}
      <button
        onClick={onRename}
        className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-all active:scale-95 shrink-0 shadow-2xs group relative"
        aria-label={t('batchRenameBtn', language)}
      >
        <Edit3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <ActionTooltip text={`${t('batchRenameBtn', language)} (${isMac ? 'Cmd+R' : 'Ctrl+R'})`} />
      </button>

      {/* Action 3: Copy to Clipboard (Icon Only) */}
      <button
        onClick={onCopy}
        className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-all active:scale-95 shrink-0 shadow-2xs group relative"
        aria-label={t('copyFiles', language)}
      >
        <Copy className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <ActionTooltip text={`${t('copyFiles', language)} (${isMac ? 'Cmd+C' : 'Ctrl+C'})`} />
      </button>

      {/* Action 4: Cut to Clipboard (Icon Only) */}
      <button
        onClick={onCut}
        className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-all active:scale-95 shrink-0 shadow-2xs group relative"
        aria-label={t('cutFiles', language)}
      >
        <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <ActionTooltip text={`${t('cutFiles', language)} (${isMac ? 'Cmd+X' : 'Ctrl+X'})`} />
      </button>

      {/* Action 5: Move to Subfolder (Icon Only + Dropdown) */}
      {subfolders.length > 0 && (
        <div ref={folderMenuRef} className="relative shrink-0 group">
          <button
            onClick={() => setIsFolderMenuOpen((prev) => !prev)}
            className={`h-8 px-2 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-2xs ${
              isFolderMenuOpen
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white'
            }`}
            aria-label={t('moveTo', language)}
          >
            <FolderInput className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            <ChevronUp className={`w-3 h-3 text-slate-400 transition-transform ${isFolderMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {!isFolderMenuOpen && <ActionTooltip text={t('moveTo', language)} />}

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

      {/* Action 6: Delete to Trash (Icon Only) */}
      <button
        onClick={onDeleteToTrash}
        className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/30 transition-all active:scale-95 shrink-0 shadow-2xs group relative"
        aria-label={t('moveToTrash', language)}
      >
        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        <ActionTooltip text={`${t('moveToTrash', language)} (${isMac ? 'Cmd+⌫' : 'Delete'})`} />
      </button>

      <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />

      {/* Action 7: Unmark All (Icon Only) */}
      <button
        onClick={onUnmarkAll}
        className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:hover:text-white dark:border-white/10 transition-all active:scale-95 shrink-0 shadow-2xs group relative"
        aria-label={t('cancelSelection', language)}
      >
        <X className="w-4 h-4 shrink-0" />
        <ActionTooltip text={`${t('cancelSelection', language)} (Esc)`} />
      </button>
    </div>
  );
};
