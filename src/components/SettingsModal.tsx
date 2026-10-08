import { AppUpdates } from './AppUpdates';
import { appVersion } from '../services/app_updater';
import React, { useState } from 'react';
import { X, Camera, Keyboard, Info, Sliders, ExternalLink, RotateCcw, Sparkles, Coffee, QrCode } from 'lucide-react';
import { t, Language } from '../i18n/translations';
import { startDragging } from '../services/tauriApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCache: () => void;
  theme: 'system' | 'dark' | 'light' | 'black';
  onThemeChange: (theme: 'system' | 'dark' | 'light' | 'black') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
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

  const handleResetDefaults = () => {
    onThemeChange('system');
    onLanguageChange('vi');
  };

  const shortcutItems = [
    { key: 'Click Thumbnail / X', desc: t('sc_toggle_mark', language) },
    { key: 'Click Card Info', desc: t('sc_focus_select', language) },
    { key: 'Shift + Click', desc: t('sc_range_mark', language) },
    { key: 'Esc', desc: t('sc_unmark_all', language) },
    { key: 'Space', desc: t('sc_quick_look', language) },
    { key: 'Double Click / Enter', desc: t('sc_system_viewer', language) },
    { key: '↑ ↓ ← →', desc: t('sc_navigate', language) },
    { key: 'R', desc: t('sc_lossless_rotate', language) },
    { key: 'Cmd/Ctrl + R', desc: t('sc_batch_rename', language) },
    { key: 'Cmd/Ctrl + A', desc: t('sc_select_all', language) },
    { key: 'Cmd/Ctrl + B', desc: t('sc_toggle_sidebar', language) },
    { key: 'Cmd/Ctrl + I', desc: t('sc_toggle_info', language) },
    { key: 'Cmd/Ctrl + 1 / 2', desc: t('sc_switch_view', language) },
    { key: 'Cmd/Ctrl + O', desc: t('sc_open_folder', language) },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
    >
      {/* Top 32px Drag Strip across modal backdrop */}
      <div
        data-tauri-drag-region
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        onMouseDown={(e) => {
          if (e.button === 0) startDragging();
        }}
        className="absolute top-0 left-0 w-full h-8 z-10 pointer-events-auto"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 w-full max-w-2xl h-[560px] max-h-[calc(100dvh-32px)] bg-white dark:bg-[#141821] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col text-xs transition-colors duration-200"
      >
        {/* Header */}
        <div
          data-tauri-drag-region
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          onMouseDown={(e) => {
            if (
              e.button === 0 &&
              !(e.target as HTMLElement).closest('button, input, select, textarea, [role="button"]')
            ) {
              startDragging();
            }
          }}
          className="h-14 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-black/20 shrink-0 cursor-default select-none"
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <span className="text-base font-semibold text-slate-900 dark:text-white">
              ⚙️ {t('settingsTitle', language)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors pointer-events-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Sidebar + Main Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Tab Sidebar */}
          <div className="w-48 border-r border-slate-200 dark:border-white/10 p-3 space-y-1.5 bg-slate-50/50 dark:bg-black/20 overflow-y-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-left transition-all ${
                activeTab === 'general'
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{t('tabGeneral', language)}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shortcuts')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-left transition-all ${
                activeTab === 'shortcuts'
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>{t('tabShortcuts', language)}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-left transition-all ${
                activeTab === 'about'
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>{t('tabAbout', language)}</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6 bg-white dark:bg-[#141821]">
            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                {/* Theme Selection */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-cyan-700 dark:text-cyan-400 mb-3">
                    {t('themeLabel', language)}
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'system', label: t('themeSystem', language) },
                      { id: 'dark', label: t('themeDark', language) },
                      { id: 'light', label: t('themeLight', language) },
                      { id: 'black', label: t('themeBlack', language) },
                    ].map((tItem) => {
                      const isSelected = theme === tItem.id;
                      return (
                        <label
                          key={tItem.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-50/80 dark:bg-cyan-500/20 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-xs ring-1 ring-cyan-500/30'
                              : 'bg-slate-50/70 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/70 dark:hover:bg-white/5'
                          }`}
                        >
                          <input
                            type="radio"
                            name="theme"
                            checked={isSelected}
                            onChange={() => onThemeChange(tItem.id as any)}
                            className="text-cyan-600 accent-cyan-600"
                          />
                          <span className="font-medium text-xs">{tItem.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Language Selection */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-cyan-700 dark:text-cyan-400 mb-3">
                    {t('langLabel', language)}
                  </h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="language"
                        checked={language === 'vi'}
                        onChange={() => onLanguageChange('vi')}
                        className="text-cyan-600 accent-cyan-600 w-4 h-4"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                        🇻🇳 {t('langVi', language)}
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="language"
                        checked={language === 'en'}
                        onChange={() => onLanguageChange('en')}
                        className="text-cyan-600 accent-cyan-600 w-4 h-4"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                        🇺🇸 {t('langEn', language)}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Cache Management */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-cyan-700 dark:text-cyan-400 mb-3">
                    {t('cacheTitle', language)}
                  </h4>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {t('cacheTitle', language)}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('cacheDesc', language)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClearCache}
                      className="px-3.5 py-1.5 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-300 dark:border-white/10 rounded-lg transition-colors font-medium text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-200 shadow-2xs"
                    >
                      <span>{t('clearCacheBtn', language)}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-cyan-700 dark:text-cyan-400 mb-2">
                  {t('tabShortcuts', language)}
                </h4>
                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                  {shortcutItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/5"
                    >
                      <span className="text-slate-600 dark:text-slate-400 truncate mr-2">{item.desc}</span>
                      <kbd className="font-mono text-cyan-800 dark:text-cyan-300 font-semibold bg-white dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 shadow-2xs shrink-0">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ABOUT (4 frames according to standards) */}
            {activeTab === 'about' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Khung 1: Thông tin ứng dụng */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0 font-bold text-2xl">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        VXPhotos Desktop
                      </h3>
                      <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 rounded-full border border-cyan-300 dark:border-cyan-500/30">
                        v{appVersion}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {t('aboutAppTagline', language)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
                      <span className="font-semibold text-cyan-700 dark:text-cyan-400">
                        {t('aboutAuthor', language)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <a
                        href="https://github.com/linhbv94/Photo_Picker"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-mono text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>github.com/linhbv94/Photo_Picker</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Khung 2: Update trạng thái & kiểm tra */}
                <AppUpdates language={language} />

                {/* Khung 3: Giới thiệu ngắn 2-3 câu về công dụng / điểm nổi bật */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/5 space-y-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('tabAbout', language)}</span>
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {t('aboutDesc', language)}
                  </p>
                </div>

                {/* Khung 4: QR ủng hộ placeholder */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('supportCoffee', language)}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      Placeholder
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/15 bg-white dark:bg-black/20">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                      <QrCode className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {t('supportCoffee', language)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('supportPlaceholder', language)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-black/30 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetDefaults', language)}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-semibold transition-all shadow-sm active:scale-95"
          >
            {t('closeBtn', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
