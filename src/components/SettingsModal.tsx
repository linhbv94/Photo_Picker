import React, { useState } from 'react';
import { X, Camera, Keyboard, Info, Sliders, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearCache,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'shortcuts' | 'about'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-[#141821] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-xs">
        {/* Header */}
        <div className="h-12 px-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white text-sm">Cài đặt & Thông tin VXTriage</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-white/5 flex gap-4 text-slate-400 font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cấu hình chung</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'shortcuts'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Phím tắt</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Giới thiệu</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4 text-slate-300">
              <div className="bg-[#0f1117] p-3 rounded-lg border border-white/5 space-y-2">
                <span className="font-medium text-white block">Thao tác Kéo Thả vào Thư mục</span>
                <span className="text-slate-400 text-[11px] block">
                  Mặc định: Di chuyển tệp tin (Move). Giữ phím Option (Mac) hoặc Alt (Win) khi thả để Sao chép (Copy).
                </span>
              </div>

              <div className="bg-[#0f1117] p-3 rounded-lg border border-white/5 space-y-2">
                <span className="font-medium text-white block">Quy chuẩn Tên tệp Tự động</span>
                <span className="text-slate-400 text-[11px] block">
                  Định dạng chuẩn: <code className="text-cyan-300 font-mono">YYYYMMDD_HHMM_xx.ext</code> (tự động phân giải microsecond và tên gốc để giữ thứ tự).
                </span>
              </div>

              <div className="bg-[#0f1117] p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-white block">Bộ nhớ đệm (Cache)</span>
                  <span className="text-slate-400 text-[11px] block">
                    Xóa cache metadata và thumbnail tạm thời
                  </span>
                </div>
                <button
                  onClick={onClearCache}
                  className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 transition-colors font-medium text-xs"
                >
                  Xóa Cache
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              {[
                { key: 'Space', desc: 'Bật / Tắt xem nhanh ảnh (Quick Look chuẩn Mac / Peek HUD)' },
                { key: 'Enter', desc: 'Mở ảnh bằng Trình xem mặc định hệ thống (System Viewer)' },
                { key: 'M hoặc 1', desc: 'Đánh dấu tuyển chọn (Toggle Mark)' },
                { key: 'Shift + Click', desc: 'Đánh dấu dải ảnh liên tiếp (Range Marking)' },
                { key: 'Mũi tên ↑ ↓ ← →', desc: 'Di chuyển con trỏ tiêu điểm (Focus selection)' },
                { key: 'R', desc: 'Xoay 90° cùng chiều kim đồng hồ (Lossless DCT)' },
                { key: 'F2', desc: 'Mở hộp thoại đổi tên hàng loạt (Batch Rename)' },
                { key: 'Cmd/Ctrl + A', desc: 'Đánh dấu tất cả các ảnh đang hiển thị' },
                { key: 'Cmd/Ctrl + Alt + U', desc: 'Bỏ đánh dấu toàn bộ' },
                { key: 'Cmd/Ctrl + B', desc: 'Bật / Tắt cây thư mục bên trái (Left Sidebar)' },
                { key: 'Cmd/Ctrl + I', desc: 'Bật / Tắt ngăn thông tin chi tiết EXIF (Right Drawer)' },
                { key: 'Cmd/Ctrl + 1 / 2', desc: 'Chuyển đổi giữa chế độ Lưới (Grid) và Bảng (Detail)' },
                { key: 'Cmd/Ctrl + O', desc: 'Chọn và mở thư mục ảnh mới' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-[#0f1117] border border-white/5"
                >
                  <span className="text-slate-300">{item.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[11px] shrink-0 ml-3">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 shadow-xl shadow-cyan-500/20">
                <div className="w-full h-full bg-[#0f1117] rounded-2xl flex items-center justify-center">
                  <Camera className="w-8 h-8 text-cyan-400" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">VXTriage Desktop</h3>
                <span className="text-xs text-slate-400">Phiên bản 1.0.0 (zTools Suite)</span>
              </div>

              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                Tiện ích tuyển chọn và phân loại ảnh cá nhân siêu nhẹ, hỗ trợ lọc theo siêu dữ liệu EXIF máy ảnh, xoay Lossless DCT và đổi tên hàng loạt an toàn.
              </p>

              <div className="pt-2">
                <a
                  href="https://github.com/linhbv94/Photo_Picker"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-cyan-200 border border-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>github.com/linhbv94/Photo_Picker</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
