import { AppUpdates } from './AppUpdates';
import { appVersion } from '../services/app_updater';
import React, { useState } from 'react';
import { X, Camera, Keyboard, Info, Sliders, ExternalLink, Moon, Sun, Monitor } from 'lucide-react';
import { t, Language } from '../i18n/translations';

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
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-cyan-700 dark:text-cyan-400" />
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
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10'
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
                <span className="font-semibold text-slate-900 dark:text-white block">{t('dragDropTitle', language)}</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] block leading-relaxed">
                  {t('dragDropDesc', language)}
                </span>
              </div>

              {/* Auto rename naming scheme */}
              <div className="bg-slate-50/70 dark:bg-[#0f1117] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5">
                <span className="font-semibold text-slate-900 dark:text-white block">{t('renameStandardTitle', language)}</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] block leading-relaxed">
                  {t('renameStandardDesc', language)}
                </span>
              </div>

              {/* Clear Cache */}
              <div className="bg-slate-50/70 dark:bg-[#0f1117] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">{t('cacheTitle', language)}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] block">
                    {t('cacheDesc', language)}
                  </span>
                </div>
                <button
                  onClick={onClearCache}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 transition-colors font-medium text-xs shadow-2xs"
                >
                  {t('clearCacheBtn', language)}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              {shortcutItems.map((item, idx) => (
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
                <span className="text-xs text-slate-500 dark:text-slate-400">v{appVersion}</span>
              </div>

              <AppUpdates language={language} />

              <p className="text-slate-600 dark:text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                {t('aboutDesc', language)}
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
