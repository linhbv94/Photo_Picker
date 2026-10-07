import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { FileItem, SortField, SortOrder } from '../types';
import { tauriApi } from '../services/tauriApi';
import { t, Language } from '../i18n/translations';

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
  language?: Language;
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
  language = 'vi',
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const columns: Array<{ field: SortField; label: string; align?: 'left' | 'right' }> = [
    { field: 'filename', label: t('colFilename', language), align: 'left' },
    { field: 'date_taken', label: t('colDate', language), align: 'left' },
    { field: 'camera_make', label: t('colCameraMake', language), align: 'left' },
    { field: 'camera_model', label: t('colCameraModel', language), align: 'left' },
    { field: 'lens_model', label: t('colLens', language), align: 'left' },
    { field: 'aperture', label: t('colAperture', language), align: 'right' },
    { field: 'shutter', label: t('colShutter', language), align: 'right' },
    { field: 'iso', label: t('colIso', language), align: 'right' },
    { field: 'size', label: t('colSize', language), align: 'right' },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto select-none bg-white dark:bg-[#0f1117]">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 bg-slate-50/95 dark:bg-[#0f1117]/95 backdrop-blur-md z-10 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-medium">
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
                  className={`px-3 py-2 cursor-pointer transition-colors hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${isCurrent ? 'text-cyan-800 dark:text-cyan-300 font-semibold' : ''}`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                    <span>{col.label}</span>
                    {isCurrent ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
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

        <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
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
                    ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-100 ring-1 ring-cyan-500/40 font-semibold'
                    : isMarked
                    ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
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
                        : 'border border-slate-300 dark:border-white/20 text-transparent hover:border-slate-400 dark:hover:border-white/40'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                </td>

                {/* Mini Thumbnail */}
                <td className="px-2 py-1.5 text-center">
                  <div className="w-8 h-8 rounded bg-slate-200/80 dark:bg-black/40 overflow-hidden inline-flex items-center justify-center border border-slate-200 dark:border-white/10">
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
                <td className="px-3 py-1.5 font-sans font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={item.filename}>
                  {item.filename}
                </td>
                <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.exif?.date_taken || '—'}
                </td>
                <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.exif?.camera_make || '—'}
                </td>
                <td className="px-3 py-1.5 text-cyan-700 dark:text-cyan-300 whitespace-nowrap font-medium">
                  {item.exif?.camera_model || '—'}
                </td>
                <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[150px]" title={item.exif?.lens_model || ''}>
                  {item.exif?.lens_model || '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-600 dark:text-slate-300">
                  {item.exif?.aperture_f_number ? `f/${item.exif.aperture_f_number.toFixed(1)}` : '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-600 dark:text-slate-300">
                  {item.exif?.exposure_time ? `${item.exif.exposure_time}s` : '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-600 dark:text-slate-300">
                  {item.exif?.iso_rating ? `ISO ${item.exif.iso_rating}` : '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
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
