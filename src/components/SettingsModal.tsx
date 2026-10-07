import React, { useState } from 'react';
import { X, Camera, Keyboard, Info, Sliders, ExternalLink, Moon, Sun, Monitor } from 'lucide-react';
import { t } from '../i18n/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCache: () => void;
  theme: 'system' | 'dark' | 'light' | 'black';
  onThemeChange: (theme: 'system' | 'dark' | 'light' | 'black') => void;
  language: 'vi' | 'en';
  onLanguageChange: (lang: 'vi' | 'en') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearCache,
  theme,
  onThemeChange,
  language,
  onLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'shortcuts' | 'about'>('general');

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#141821] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-xs transition-colors duration-200"
      >
        {/* Header */}
        <div className="h-13 px-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-black/20">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold text-slate-900 dark:text-white text-sm">{t('settingsTitle', language)}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 gap-4 text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-cyan-500 text-cyan-800 dark:text-cyan-300 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('tabGeneral', language)}</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'shortcuts'
                ? 'border-cyan-500 text-cyan-800 dark:text-cyan-300 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{t('tabShortcuts', language)}</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'border-cyan-500 text-cyan-800 dark:text-cyan-300 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{t('tabAbout', language)}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4 text-slate-700 dark:text-slate-300">
              {/* Theme Selection */}
              <div className="bg-slate-50/70 dark:bg-[#0f1117] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-2.5">
                <span className="font-semibold text-slate-900 dark:text-white block">{t('themeLabel', language)}</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'dark', label: t('themeDark', language), icon: Moon },
                    { id: 'black', label: t('themeBlack', language), icon: Moon },
                    { id: 'light', label: t('themeLight', language), icon: Sun },
                    { id: 'system', label: t('themeSystem', language), icon: Monitor },
                  ].map((tItem) => {
                    const Icon = tItem.icon;
                    const isSelected = theme === tItem.id;
                    return (
                      <button
                        key={tItem.id}
                        type="button"
                        onClick={() => onThemeChange(tItem.id as any)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition-all text-left ${
                          isSelected
                            ? 'bg-cyan-50/90 dark:bg-cyan-500/20 border-cyan-500 text-cyan-900 dark:text-cyan-200 font-semibold shadow-xs ring-1 ring-cyan-500/30'
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                        <span>{tItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div className="bg-slate-50/70 dark:bg-[#0f1117] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-2.5">
                <span className="font-semibold text-slate-900 dark:text-white block">{t('langLabel', language)}</span>
                <div className="flex gap-3">
                  {[
                    { id: 'vi', label: t('langVi', language) },
                    { id: 'en', label: t('langEn', language) },
                  ].map((lang) => {
                    const isSelected = language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => onLanguageChange(lang.id as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-cyan-50/90 dark:bg-cyan-500/20 border-cyan-500 text-cyan-900 dark:text-cyan-200 font-semibold shadow-xs ring-1 ring-cyan-500/30'
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        <span>{lang.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drag and Drop hint */}
              <div className="bg-slate-50/70 dark:bg-[#0f1117] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5">
                <span className="font-semibold text-slate-900 dark:text-white block">Thao tác Kéo Thả vào Thư mục</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] block leading-relaxed">
                  Mặc định: Di chuyển tệp tin (Move). Giữ phím Option (Mac) hoặc Alt (Win) khi thả để Sao chép (Copy).
                </span>
              </div>

              {/* Auto rename naming scheme */}
              <div className="bg-slate-50/70 dark:bg-[#0f1117] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5">
                <span className="font-semibold text-slate-900 dark:text-white block">Quy chuẩn Tên tệp Tự động</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] block leading-relaxed">
                  Định dạng chuẩn: <code className="text-cyan-700 dark:text-cyan-300 font-mono font-medium">YYYYMMDD_HHMM_xx.ext</code> (tự động phân giải microsecond và tên gốc để giữ thứ tự).
                </span>
              </div>

              {/* Clear Cache */}
              <div className="bg-slate-50/70 dark:bg-[#0f1117] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Bộ nhớ đệm (Cache)</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] block">
                    Làm mới cache metadata và thumbnail tạm thời
                  </span>
                </div>
                <button
                  onClick={onClearCache}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 transition-colors font-medium text-xs shadow-2xs"
                >
                  Xóa Cache
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              {[
                { key: 'Click Thumbnail / X', desc: 'Đánh dấu chọn ảnh (Toggle Mark với dấu Tick giữa ảnh)' },
                { key: 'Click Thông tin dưới', desc: 'Chọn tiêu điểm xem trước (Focus selection)' },
                { key: 'Shift + Click', desc: 'Đánh dấu dải ảnh liên tiếp từ ảnh trước đó (Range Marking)' },
                { key: 'Esc', desc: 'Hủy đánh dấu toàn bộ ảnh đang chọn (Unmark All)' },
                { key: 'Space', desc: 'Bật / Tắt xem nhanh ảnh phóng to (Quick Look / Peek HUD)' },
                { key: 'Double Click / Enter', desc: 'Mở ảnh bằng Trình xem mặc định hệ thống (Preview.app / Win Photos)' },
                { key: 'Mũi tên ↑ ↓ ← →', desc: 'Di chuyển con trỏ tiêu điểm qua lại giữa các ảnh' },
                { key: 'R', desc: 'Xoay 90° cùng chiều kim đồng hồ không giảm chất lượng (Lossless DCT)' },
                { key: 'Cmd/Ctrl + R', desc: 'Mở hộp thoại đổi tên hàng loạt (Batch Rename)' },
                { key: 'Cmd/Ctrl + A', desc: 'Đánh dấu tất cả các ảnh đang hiển thị' },
                { key: 'Cmd/Ctrl + B', desc: 'Bật / Tắt cây thư mục bên trái (Left Sidebar)' },
                { key: 'Cmd/Ctrl + I', desc: 'Bật / Tắt ngăn thông tin chi tiết EXIF (Right Drawer)' },
                { key: 'Cmd/Ctrl + 1 / 2', desc: 'Chuyển đổi giữa chế độ Lưới (Grid) và Bảng (Detail)' },
                { key: 'Cmd/Ctrl + O', desc: 'Chọn và mở thư mục ảnh mới' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-[#0f1117] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-cyan-800 dark:text-cyan-300 font-mono text-[11px] shrink-0 ml-3 border border-slate-300 dark:border-transparent">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 shadow-xl shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-50 dark:bg-[#0f1117] rounded-2xl flex items-center justify-center">
                  <Camera className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">VXPhotos Desktop</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Phiên bản 1.0.0 (zTools Suite)</span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                Tiện ích tuyển chọn và phân loại ảnh cá nhân siêu nhẹ, hỗ trợ lọc theo siêu dữ liệu EXIF máy ảnh, xoay Lossless DCT và đổi tên hàng loạt an toàn.
              </p>

              <div className="pt-2">
                <a
                  href="https://github.com/linhbv94/Photo_Picker"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-cyan-800 dark:text-cyan-300 border border-slate-200 dark:border-white/10 transition-colors font-medium"
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
