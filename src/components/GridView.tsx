import React from 'react';
import { Camera, Check } from 'lucide-react';
import { FileItem } from '../types';
import { tauriApi } from '../services/tauriApi';

interface GridViewProps {
  items: FileItem[];
  selectedId: string | null;
  markedIds: Set<string>;
  zoomSize: number;
  cacheBust?: number;
  onItemClick: (item: FileItem, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: FileItem) => void;
  onItemContextMenu: (e: React.MouseEvent, item: FileItem) => void;
  onToggleMark: (item: FileItem, e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, item: FileItem) => void;
}

export const GridView: React.FC<GridViewProps> = ({
  items,
  selectedId,
  markedIds,
  zoomSize,
  cacheBust,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  onToggleMark,
  onDragStart,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 select-none">
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${zoomSize}px, 1fr))`,
        }}
      >
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          const isMarked = markedIds.has(item.id);

          const cameraInfo = item.exif?.camera_model || item.exif?.camera_make;
          const dateTaken = item.exif?.date_taken?.split(' ')[0];

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onDoubleClick={() => onItemDoubleClick(item)}
              onContextMenu={(e) => onItemContextMenu(e, item)}
              className={`group relative flex flex-col rounded-lg overflow-hidden transition-all duration-100 border ${
                isSelected
                  ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg shadow-cyan-500/20 z-10'
                  : isMarked
                  ? 'border-amber-400/50 bg-amber-500/10'
                  : 'border-white/5 bg-[#141821]/70 hover:border-white/20 hover:bg-[#141821]'
              }`}
            >
              {/* Thumbnail Container (Click = Mark / Unmark) */}
              <div
                onClick={(e) => onToggleMark(item, e)}
                className="relative w-full overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer select-none"
                style={{ height: `${zoomSize * 0.85}px` }}
                title={isMarked ? 'Bỏ đánh dấu ảnh này' : 'Đánh dấu chọn ảnh này (Click / Phím X)'}
              >
                <img
                  src={`${tauriApi.toAssetUrl(item.path)}?t=${cacheBust}`}
                  alt={item.filename}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />

                {/* Big Center Tick Badge */}
                <div
                  className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-150 ${
                    isMarked
                      ? 'bg-amber-500/20'
                      : 'bg-black/0 group-hover:bg-black/30'
                  }`}
                >
                  <div
                    className={`rounded-full flex items-center justify-center transition-all duration-150 shadow-xl ${
                      isMarked
                        ? 'w-11 h-11 bg-amber-400 text-black shadow-amber-500/50 scale-100 ring-2 ring-amber-300'
                        : 'w-10 h-10 bg-black/60 border border-white/30 text-white/50 opacity-0 group-hover:opacity-75 group-hover:scale-105'
                    }`}
                  >
                    <Check className={`${isMarked ? 'w-6 h-6 stroke-[3.5]' : 'w-5 h-5 stroke-[2.5]'}`} />
                  </div>
                </div>

                {/* Camera Badge (Top Right) */}
                {cameraInfo && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-cyan-300 border border-cyan-500/30 font-medium z-10 pointer-events-none">
                    <Camera className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[80px]">{cameraInfo}</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata (Click = Select / Focus) */}
              <div
                onClick={(e) => onItemClick(item, e)}
                className={`p-2 flex flex-col gap-0.5 text-left transition-colors cursor-pointer border-t select-none ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400/40'
                    : 'bg-[#141821]/95 border-white/5 hover:bg-[#181d28]'
                }`}
                title="Bấm để chọn tiêu điểm (Focus)"
              >
                <span className="text-xs font-medium text-slate-200 truncate" title={item.filename}>
                  {item.filename}
                </span>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{dateTaken || formatBytes(item.size_bytes)}</span>
                  <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-white/5 text-slate-400 font-mono">
                    {item.extension}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
          <Camera className="w-10 h-10 stroke-[1.5] text-slate-600" />
          <span className="text-sm font-medium">Không tìm thấy ảnh phù hợp</span>
          <span className="text-xs text-slate-600">Thử thay đổi bộ lọc hoặc chọn thư mục khác</span>
        </div>
      )}
    </div>
  );
};
