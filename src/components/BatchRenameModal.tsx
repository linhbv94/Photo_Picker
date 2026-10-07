import React from 'react';
import { X, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RenameDiffItem } from '../types';

interface BatchRenameModalProps {
  isOpen: boolean;
  diffItems: RenameDiffItem[];
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  diffItems,
  onClose,
  onConfirm,
  isProcessing,
}) => {
  if (!isOpen) return null;

  const conflictCount = diffItems.filter((i) => i.has_conflict).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-[#141821] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="h-12 px-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">Xem trước Đổi tên Hàng loạt</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {diffItems.length} ảnh
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note / Conflict warning */}
        <div className="px-5 py-3 bg-[#0f1117] border-b border-white/5 text-xs flex items-center justify-between">
          <span className="text-slate-400">
            Quy chuẩn tên: <code className="text-cyan-300 font-mono">YYYYMMDD_HHMM_xx.ext</code> (dựa theo ngày chụp EXIF)
          </span>
          {conflictCount > 0 ? (
            <div className="flex items-center gap-1.5 text-rose-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Phát hiện {conflictCount} tệp xung đột</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Không có xung đột</span>
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
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-black/30 border-white/5 text-slate-300'
              }`}
            >
              <span className="truncate max-w-[220px] text-slate-400" title={item.original_filename}>
                {item.original_filename}
              </span>

              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 mx-2" />

              <span className="truncate max-w-[240px] text-cyan-300 font-semibold" title={item.new_filename}>
                {item.new_filename}
              </span>

              {item.has_conflict && (
                <span className="text-[10px] text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded ml-2 shrink-0">
                  Trùng tên
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-5 border-t border-white/10 flex items-center justify-end gap-3 bg-black/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing || conflictCount > 0}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isProcessing ? 'Đang đổi tên...' : 'Xác nhận Đổi tên'}
          </button>
        </div>
      </div>
    </div>
  );
};
