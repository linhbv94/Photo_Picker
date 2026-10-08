import React, { useState, useRef, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  FolderOpen,
  Settings,
  Minus,
  Square,
  X,
  Camera,
} from 'lucide-react';
import { t, Language } from '../i18n/translations';

interface WindowBarProps {
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onSelectAll: () => void;
  onUnmarkAll: () => void;
  onRotateCurrent: () => void;
  onRenameCurrent: () => void;
  onToggleSidebar: () => void;
  onToggleInfo: () => void;
  onSwitchView: (mode: 'grid' | 'detail') => void;
  language?: Language;
}

export const WindowBar: React.FC<WindowBarProps> = ({
  onOpenFolder,
  onOpenSettings,
  onSelectAll,
  onUnmarkAll,
  onRotateCurrent,
  onRenameCurrent,
  onToggleSidebar,
  onToggleInfo,
  onSwitchView,
  language = 'vi',
}) => {
  const isMac =
    typeof navigator !== 'undefined' &&
    (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Macintosh/.test(navigator.userAgent));

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isMac) {
      getCurrentWindow().setDecorations(false).catch(() => {});
    }
  }, [isMac]);

  const handleMinimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch {}
  };

  const handleMaximize = async () => {
    try {
      await getCurrentWindow().toggleMaximize();
    } catch {}
  };

  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch {}
  };

  const menus: Record<string, Array<{ label: string; shortcut?: string; action: () => void }>> = {
    [t('file', language)]: [
      { label: t('openFolder', language), shortcut: 'Cmd/Ctrl+O', action: onOpenFolder },
      { label: t('settings', language), shortcut: 'Cmd/Ctrl+,', action: onOpenSettings },
    ],
    [t('edit', language)]: [
      { label: t('selectAll', language), shortcut: 'Cmd/Ctrl+A', action: onSelectAll },
      { label: t('deselectAll', language), shortcut: 'Esc', action: onUnmarkAll },
    ],
    [t('view', language)]: [
      { label: `${t('viewGrid', language)}`, shortcut: 'Cmd/Ctrl+1', action: () => onSwitchView('grid') },
      { label: `${t('viewDetail', language)}`, shortcut: 'Cmd/Ctrl+2', action: () => onSwitchView('detail') },
      { label: t('toggleSidebar', language), shortcut: 'Cmd/Ctrl+B', action: onToggleSidebar },
      { label: t('toggleInfoPanel', language), shortcut: 'Cmd/Ctrl+I', action: onToggleInfo },
    ],
    [t('tools', language)]: [
      { label: t('losslessRotate90', language), shortcut: 'R', action: onRotateCurrent },
      { label: t('batchRename', language), shortcut: 'Cmd/Ctrl+R', action: onRenameCurrent },
    ],
    [t('help', language)]: [
      { label: t('about', language), action: onOpenSettings },
    ],
  };

  return (
    <div
      data-tauri-drag-region
      className={`h-8 w-full bg-slate-50/95 dark:bg-[#0f1117]/95 border-b border-slate-200 dark:border-white/5 flex items-center justify-between ${
        isMac ? 'pl-[82px] pr-3' : 'pl-2 pr-2'
      } select-none text-xs shrink-0 z-40 backdrop-blur-md`}
    >
      {/* Left: Brand (Mac) or Menu Bar (Windows) */}
      <div className="flex items-center gap-2">
        {/* macOS Brand: Icon + App Title (System font) */}
        {isMac && (
          <div className="flex items-center gap-1.5 shrink-0 cursor-default">
            <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="text-slate-900 dark:text-white text-xs font-semibold shrink-0 leading-none">
              VXPhotos
            </span>
          </div>
        )}

        {/* Windows Menus (Icon & Title hidden per desktop UI standard) */}
        {!isMac && (
          <div ref={menuRef} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} className="flex items-center gap-0.5 text-slate-700 dark:text-slate-300 shrink-0">
            {Object.keys(menus).map((menuKey) => (
              <div key={menuKey} className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === menuKey ? null : menuKey)}
                  onMouseEnter={() => {
                    if (activeMenu !== null) {
                      setActiveMenu(menuKey);
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white ${
                    activeMenu === menuKey ? 'bg-slate-200 dark:bg-white/15 text-cyan-800 dark:text-cyan-300 font-semibold' : ''
                  }`}
                >
                  {menuKey}
                </button>

                {activeMenu === menuKey && (
                  <div className="absolute left-0 top-full mt-1 min-w-[200px] rounded-lg bg-white dark:bg-slate-900/95 backdrop-blur-md py-1 z-50 shadow-2xl border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-100">
                    {menus[menuKey].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          item.action();
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 flex items-center justify-between text-xs hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-slate-400 font-mono ml-3">{item.shortcut}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-1.5"
      >
        <button
          onClick={onOpenFolder}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 dark:text-cyan-300 dark:border-cyan-500/30 transition-all active:scale-95 text-xs font-medium mr-1 shadow-2xs leading-none"
          title={t('openFolder', language)}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{t('openFolder', language)}</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors leading-none"
          title={t('settings', language)}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Windows style window controls (Hidden on macOS) */}
        {!isMac && (
          <div className="flex items-center ml-2 border-l border-slate-200 dark:border-white/10 pl-1.5">
            <button
              type="button"
              onClick={handleMinimize}
              className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 hover:bg-rose-500 hover:text-white text-slate-500 dark:text-slate-400 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
