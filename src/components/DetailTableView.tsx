import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { FileItem, SortField, SortOrder } from '../types';
import { tauriApi } from '../services/tauriApi';

interface DetailTableViewProps {
  items: FileItem[];
  selectedId: string | null;
  markedIds: Set<string>;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
  onItemClick: (item: FileItem, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: FileItem) => void;
  onItemContextMenu: (e: React.MouseEvent, item: FileItem) => void;
  onToggleMark: (item: FileItem, e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, item: FileItem) => void;
}

export const DetailTableView: React.FC<DetailTableViewProps> = ({
  items,
  selectedId,
  markedIds,
  sortField,
  sortOrder,
  onSortChange,
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

  const columns: Array<{ field: SortField; label: string; align?: 'left' | 'right' }> = [
    { field: 'filename', label: 'Tên tệp', align: 'left' },
    { field: 'date_taken', label: 'Ngày chụp', align: 'left' },
    { field: 'camera_make', label: 'Hãng máy', align: 'left' },
    { field: 'camera_model', label: 'Dòng máy', align: 'left' },
    { field: 'lens_model', label: 'Ống kính', align: 'left' },
    { field: 'aperture', label: 'Khẩu độ', align: 'right' },
    { field: 'shutter', label: 'Tốc độ', align: 'right' },
    { field: 'iso', label: 'ISO', align: 'right' },
    { field: 'size', label: 'Dung lượng', align: 'right' },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto select-none">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 bg-[#0f1117]/95 backdrop-blur-md z-10 border-b border-white/10 text-slate-400 font-medium">
          <tr>
            <th className="w-9 px-2 py-2 text-center">
              <span className="sr-only">Mark</span>
            </th>
            <th className="w-10 px-2 py-2 text-center">
              <span className="sr-only">Thumb</span>
            </th>
            {columns.map((col) => {
              const isCurrent = sortField === col.field;
              return (
                <th
                  key={col.field}
                  onClick={() => onSortChange(col.field)}
                  className={`px-3 py-2 cursor-pointer transition-colors hover:text-white hover:bg-white/5 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${isCurrent ? 'text-cyan-300' : ''}`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                    <span>{col.label}</span>
                    {isCurrent ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-cyan-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-30 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            const isMarked = markedIds.has(item.id);

            return (
              <tr
                key={item.id}
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                onClick={(e) => onItemClick(item, e)}
                onDoubleClick={() => onItemDoubleClick(item)}
                onContextMenu={(e) => onItemContextMenu(e, item)}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400'
                    : isMarked
                    ? 'bg-amber-500/10 text-amber-200'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Checkbox */}
                <td className="px-2 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => onToggleMark(item, e)}
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      isMarked
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'border border-white/20 text-transparent hover:border-white/40'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                </td>

                {/* Mini Thumbnail */}
                <td className="px-2 py-1.5 text-center">
                  <div className="w-8 h-8 rounded bg-black/40 overflow-hidden inline-flex items-center justify-center border border-white/10">
                    <img
                      src={tauriApi.toAssetUrl(item.path)}
                      alt=""
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none"
                      loading="lazy"
                    />
                  </div>
                </td>

                {/* Columns */}
                <td className="px-3 py-1.5 font-sans font-medium text-slate-200 truncate max-w-[200px]" title={item.filename}>
                  {item.filename}
                </td>
                <td className="px-3 py-1.5 text-slate-400 whitespace-nowrap">
                  {item.exif?.date_taken || '—'}
                </td>
                <td className="px-3 py-1.5 text-slate-400 whitespace-nowrap">
                  {item.exif?.camera_make || '—'}
                </td>
                <td className="px-3 py-1.5 text-cyan-300 whitespace-nowrap">
                  {item.exif?.camera_model || '—'}
                </td>
                <td className="px-3 py-1.5 text-slate-400 truncate max-w-[150px]" title={item.exif?.lens_model || ''}>
                  {item.exif?.lens_model || '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-300">
                  {item.exif?.aperture_f_number ? `f/${item.exif.aperture_f_number.toFixed(1)}` : '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-300">
                  {item.exif?.exposure_time ? `${item.exif.exposure_time}s` : '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-300">
                  {item.exif?.iso_rating ? `ISO ${item.exif.iso_rating}` : '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-400 whitespace-nowrap">
                  {formatBytes(item.size_bytes)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
