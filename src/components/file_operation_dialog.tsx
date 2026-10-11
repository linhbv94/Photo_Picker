import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface FileDialog {
  title: string; note: string; confirmLabel?: string;
  rows: Array<{ path: string; target?: string; detail?: string; onSelect?: () => void }>;
  onConfirm?: () => void; onClose: () => void;
}

export const FileOperationDialog: React.FC<{ dialog: FileDialog | null }> = ({ dialog }) => {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dialog.onClose(); }
      if (event.key === 'Tab') {
        const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!buttons?.length) return;
        const first = buttons[0]; const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', key, true);
    return () => { window.removeEventListener('keydown', key, true); previous?.focus(); };
  }, [dialog]);
  if (!dialog) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onContextMenu={e => e.stopPropagation()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="file_dialog_title" className="w-full max-w-2xl max-h-[calc(100dvh-32px)] flex flex-col rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-white/10 shadow-2xl text-xs">
        <header className="shrink-0 px-5 py-3 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
          <h2 id="file_dialog_title" className="text-sm font-semibold">{dialog.title}</h2>
          <button aria-label="Đóng / Close" onClick={dialog.onClose} className="rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-white/10"><X className="w-4 h-4" /></button>
        </header>
        <div className="min-h-0 overflow-y-auto p-5 space-y-3">
          <p className="text-amber-800 dark:text-amber-300 whitespace-pre-wrap">{dialog.note}</p>
          <ul className="space-y-2">
            {dialog.rows.map((row, index) => <li key={index} className="rounded-lg border border-slate-200 dark:border-white/10 p-2.5 space-y-1 break-all">
              <button disabled={!row.onSelect} onClick={row.onSelect} className="text-left w-full disabled:cursor-default focus-visible:outline-2 focus-visible:outline-cyan-500">{row.path}</button>
              {row.target && <p className="text-cyan-800 dark:text-cyan-300">→ {row.target}</p>}
              {row.detail && <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{row.detail}</p>}
            </li>)}
          </ul>
        </div>
        <footer className="shrink-0 flex justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-white/10">
          <button onClick={dialog.onClose} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10">{dialog.onConfirm ? 'Hủy / Cancel' : 'Đóng / Close'}</button>
          {dialog.onConfirm && <button onClick={dialog.onConfirm} className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">{dialog.confirmLabel || 'Xác nhận / Confirm'}</button>}
        </footer>
      </div>
    </div>
  );
};
