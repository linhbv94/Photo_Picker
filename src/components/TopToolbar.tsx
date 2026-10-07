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
  counts,
}) => {
  return (
    <header
      className="h-11 w-full bg-[#141821]/80 border-b border-white/5 flex items-center justify-between px-3 select-none text-xs shrink-0 z-20 backdrop-blur-md gap-3"
      title={currentPath ? `Thư mục hiện tại: ${currentPath}` : 'Chưa mở thư mục'}
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
              ? 'bg-cyan-500 text-black shadow-sm shadow-cyan-500/30'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Tất cả ({counts.total})</span>
        </button>

        <button
          onClick={() => {
            onFilterModeChange('camera');
            onSelectCameraModel(null);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs font-medium ${
            filterMode === 'camera' && !selectedCameraModel
              ? 'bg-cyan-500 text-black shadow-sm shadow-cyan-500/30'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Camera className="w-3 h-3 text-cyan-300" />
          <span>Máy ảnh ({counts.camera})</span>
        </button>

        {counts.phone > 0 && (
          <button
            onClick={() => onFilterModeChange('camera')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs font-medium"
          >
            <Smartphone className="w-3 h-3 text-emerald-400" />
            <span>Điện thoại ({counts.phone})</span>
          </button>
        )}

        <button
          onClick={() => {
            onFilterModeChange('screenshot');
            onSelectCameraModel(null);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs font-medium ${
            filterMode === 'screenshot'
              ? 'bg-amber-500 text-black shadow-sm shadow-amber-500/30'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Monitor className="w-3 h-3" />
          <span>Screenshot ({counts.screenshot})</span>
        </button>

        {/* Camera Models Dropdown */}
        {availableCameraModels.length > 0 && (
          <select
            value={selectedCameraModel || ''}
            onChange={(e) => onSelectCameraModel(e.target.value || null)}
            className="bg-[#0f1117] border border-white/10 text-slate-200 text-xs rounded-full px-2.5 py-1 outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <option value="">Lọc theo Thiết bị...</option>
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
          placeholder="Lọc tên tệp..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#0f1117] border border-white/10 rounded-md pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-400"
        />
      </div>

      {/* Right: View mode & Zoom & Info Drawer */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Zoom slider (only in Grid mode) */}
        {viewMode === 'grid' && (
          <div className="flex items-center gap-1.5 text-slate-400" title={`Kích thước ô: ${zoomSize}px`}>
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="80"
              max="360"
              step="10"
              value={zoomSize}
              onChange={(e) => onZoomSizeChange(Number(e.target.value))}
              className="w-20 accent-cyan-400 h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* View mode switcher */}
        <div className="flex items-center bg-[#0f1117] rounded-md p-0.5 border border-white/5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Chế độ Lưới (Cmd/Ctrl+1)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('detail')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'detail' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Chế độ Bảng chi tiết (Cmd/Ctrl+2)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Info Drawer Toggle */}
        <button
          onClick={onToggleInfo}
          className={`p-1.5 rounded transition-all border ${
            isInfoOpen
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
          title="Thông tin EXIF (Cmd/Ctrl+I)"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
