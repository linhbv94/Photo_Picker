import React from 'react';
import {
  LayoutGrid,
  List,
  Search,
  Sliders,
  Info,
  Camera,
  Smartphone,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import { FilterMode, ViewMode } from '../types';
import { t, Language } from '../i18n/translations';

interface TopToolbarProps {
  currentPath: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterMode: FilterMode;
  onFilterModeChange: (filter: FilterMode) => void;
  availableCameraModels: string[];
  selectedCameraModel: string | null;
  onSelectCameraModel: (model: string | null) => void;
  zoomSize: number;
  onZoomSizeChange: (size: number) => void;
  isInfoOpen: boolean;
  onToggleInfo: () => void;
  language?: Language;
  counts: {
    total: number;
    camera: number;
    phone: number;
    screenshot: number;
  };
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  currentPath,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterMode,
  onFilterModeChange,
  availableCameraModels,
  selectedCameraModel,
  onSelectCameraModel,
  zoomSize,
  onZoomSizeChange,
  isInfoOpen,
  onToggleInfo,
  language = 'vi',
  counts,
}) => {
  return (
    <header
      className="h-11 w-full bg-white/90 dark:bg-[#141821]/80 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-3 select-none text-xs shrink-0 z-20 backdrop-blur-md gap-3"
      title={currentPath || ''}
    >
      {/* Left: Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <button
          onClick={() => {
            onFilterModeChange('all');
            onSelectCameraModel(null);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs font-medium ${
            filterMode === 'all' && !selectedCameraModel
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{t('filterAll', language)} ({counts.total})</span>
        </button>

        <button
          onClick={() => {
            onFilterModeChange('camera');
            onSelectCameraModel(null);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs font-medium ${
            filterMode === 'camera' && !selectedCameraModel
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Camera className="w-3 h-3 text-cyan-600 dark:text-cyan-300" />
          <span>{t('filterCamera', language)} ({counts.camera})</span>
        </button>

        {counts.phone > 0 && (
          <button
            onClick={() => onFilterModeChange('camera')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium"
          >
            <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{t('filterMobile', language)} ({counts.phone})</span>
          </button>
        )}

        <button
          onClick={() => {
            onFilterModeChange('screenshot');
            onSelectCameraModel(null);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs font-medium ${
            filterMode === 'screenshot'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Monitor className="w-3 h-3" />
          <span>{t('filterScreenshot', language)} ({counts.screenshot})</span>
        </button>

        {/* Camera Models Dropdown */}
        {availableCameraModels.length > 0 && (
          <select
            value={selectedCameraModel || ''}
            onChange={(e) => onSelectCameraModel(e.target.value || null)}
            className="bg-white dark:bg-[#0f1117] border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs rounded-full px-2.5 py-1 outline-none focus:ring-1 focus:ring-cyan-500 shadow-2xs"
          >
            <option value="">{t('allCameras', language)}</option>
            {availableCameraModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Middle: Search Box */}
      <div className="relative max-w-xs flex-1 hidden md:block">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('searchPlaceholder', language)}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white dark:bg-[#0f1117] border border-slate-300 dark:border-white/10 rounded-md pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500 shadow-2xs"
        />
      </div>

      {/* Right: View mode & Zoom & Info Drawer */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Zoom slider (only in Grid mode) */}
        {viewMode === 'grid' && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" title={`${t('zoomTooltip', language)}: ${zoomSize}px`}>
            <Sliders className="w-3.5 h-3.5" />
            <input
              type="range"
              min="80"
              max="360"
              step="10"
              value={zoomSize}
              onChange={(e) => onZoomSizeChange(Number(e.target.value))}
              className="w-20 accent-cyan-500 h-1 bg-slate-300 dark:bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* View mode switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-[#0f1117] rounded-md p-0.5 border border-slate-200 dark:border-white/5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Cmd/Ctrl+1"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('detail')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'detail'
                ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Cmd/Ctrl+2"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Info Drawer Toggle */}
        <button
          onClick={onToggleInfo}
          className={`p-1.5 rounded transition-all border ${
            isInfoOpen
              ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-400 dark:border-cyan-500/40 shadow-xs'
              : 'border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Cmd/Ctrl+I"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
