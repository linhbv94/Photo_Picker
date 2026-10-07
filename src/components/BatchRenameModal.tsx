import React from 'react';
import { X, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RenameDiffItem } from '../types';
import { t, Language } from '../i18n/translations';

interface BatchRenameModalProps {
  isOpen: boolean;
  diffItems: RenameDiffItem[];
  language?: Language;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  diffItems,
  language = 'vi',
  onClose,
  onConfirm,
  isProcessing,
}) => {
  if (!isOpen) return null;

  const conflictCount = diffItems.filter((i) => i.has_conflict).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="h-12 px-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-black/20">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white text-sm">{t('batchRenameTitle', language)}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-mono font-medium">
              {t('batchRenameCount', language, { count: diffItems.length })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note / Conflict warning */}
        <div className="px-5 py-3 bg-slate-50/90 dark:bg-[#0f1117] border-b border-slate-200 dark:border-white/5 text-xs flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400">
            {t('renameRuleHint', language)}
          </span>
          {conflictCount > 0 ? (
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('conflictDetected', language, { count: conflictCount })}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('noConflicts', language)}</span>
            </div>
          )}
        </div>

        {/* Diff List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs">
          {diffItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2.5 rounded-lg border ${
                item.has_conflict
                  ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="truncate max-w-[220px] text-slate-500 dark:text-slate-400" title={item.original_filename}>
                {item.original_filename}
              </span>

              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mx-2" />

              <span className="truncate max-w-[240px] text-cyan-800 dark:text-cyan-300 font-semibold" title={item.new_filename}>
                {item.new_filename}
              </span>

              {item.has_conflict && (
                <span className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.5 rounded ml-2 shrink-0">
                  {t('duplicateName', language)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-5 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3 bg-slate-50/70 dark:bg-black/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-300 dark:border-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-medium transition-colors shadow-2xs"
          >
            {t('cancelBtn', language)}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing || conflictCount > 0}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 text-xs font-semibold shadow-xs transition-colors"
          >
            {isProcessing ? t('renamingInProgress', language) : t('confirmRenameBtn', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
