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
  currentFolder?: string;
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
}) => {
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

  const isMac =
    typeof navigator !== 'undefined' &&
    (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Macintosh/.test(navigator.userAgent));

  const menus: Record<string, Array<{ label: string; shortcut?: string; action: () => void }>> = {
    File: [
      { label: 'Mở Thư mục...', shortcut: 'Cmd/Ctrl+O', action: onOpenFolder },
      { label: 'Cài đặt...', shortcut: 'Cmd/Ctrl+,', action: onOpenSettings },
    ],
    Edit: [
      { label: 'Chọn Tất cả', shortcut: 'Cmd/Ctrl+A', action: onSelectAll },
      { label: 'Hủy chọn Toàn bộ', shortcut: 'Esc', action: onUnmarkAll },
    ],
    View: [
      { label: 'Chế độ Lưới (Grid)', shortcut: 'Cmd/Ctrl+1', action: () => onSwitchView('grid') },
      { label: 'Chế độ Bảng (Detail)', shortcut: 'Cmd/Ctrl+2', action: () => onSwitchView('detail') },
      { label: 'Bật/Tắt Cây thư mục', shortcut: 'Cmd/Ctrl+B', action: onToggleSidebar },
      { label: 'Bật/Tắt Thông tin EXIF', shortcut: 'Cmd/Ctrl+I', action: onToggleInfo },
    ],
    Tools: [
      { label: 'Xoay 90° cùng chiều kim đồng hồ', shortcut: 'R', action: onRotateCurrent },
      { label: 'Đổi tên hàng loạt...', shortcut: 'Cmd/Ctrl+R', action: onRenameCurrent },
    ],
    Help: [
      { label: 'Giới thiệu VXPhotos', action: onOpenSettings },
    ],
  };

  return (
    <div
      data-tauri-drag-region
      className={`h-10 w-full bg-[#0f1117]/95 border-b border-white/5 flex items-center justify-between ${
        isMac ? 'pl-[76px] pr-3' : 'px-3'
      } select-none text-xs shrink-0 z-40 backdrop-blur-md`}
    >
      {/* Left: App Brand & (Windows only) Menus */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold tracking-wide cursor-default">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="text-white text-sm font-bold">VXPhotos</span>
        </div>

        {/* Menu Bar Items (Visible only on Windows / Linux) */}
        {!isMac && (
          <div ref={menuRef} className="flex items-center gap-0.5 ml-2 text-slate-300">
            {Object.keys(menus).map((menuKey) => (
              <div key={menuKey} className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === menuKey ? null : menuKey)}
                  onMouseEnter={() => {
                    if (activeMenu !== null) {
                      setActiveMenu(menuKey);
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors hover:bg-white/10 hover:text-white ${
                    activeMenu === menuKey ? 'bg-white/15 text-cyan-300' : ''
                  }`}
                >
                  {menuKey}
                </button>

                {activeMenu === menuKey && (
                  <div className="absolute left-0 top-full mt-1 min-w-[220px] rounded-md glass-dropdown py-1 z-50 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-100">
                    {menus[menuKey].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 flex items-center justify-between text-xs hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-slate-500 ml-3">{item.shortcut}</span>
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
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenFolder}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all active:scale-95 text-xs font-medium mr-2"
          title="Chọn thư mục ảnh (Cmd/Ctrl+O)"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Mở thư mục</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          title="Cài đặt & Giới thiệu (Cmd/Ctrl+,)"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Windows style window controls (Hidden on macOS) */}
        {!isMac && (
          <div className="flex items-center ml-2 border-l border-white/10 pl-2">
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-rose-500 hover:text-white text-slate-400 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
