import React from 'react';
import {
  X,
  Camera,
  MapPin,
  FileText,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { FileItem } from '../types';

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: FileItem | null;
}

export const InfoDrawer: React.FC<InfoDrawerProps> = ({ isOpen, onClose, item }) => {
  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const exif = item?.exif;

  const openMap = () => {
    if (exif?.gps_latitude && exif?.gps_longitude) {
      const url = `https://www.google.com/maps?q=${exif.gps_latitude},${exif.gps_longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <aside className="w-72 h-full bg-[#141821]/95 border-l border-white/5 flex flex-col shrink-0 select-none z-30 text-xs backdrop-blur-md animate-in slide-in-from-right duration-150">
      {/* Header */}
      <div className="h-10 px-4 border-b border-white/5 flex items-center justify-between text-slate-200 font-semibold">
        <span>Thông tin Chi tiết (EXIF)</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          title="Đóng (Cmd/Ctrl+I)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {item ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section: File Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Tệp tin</span>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-2.5 space-y-1.5 border border-white/5 text-slate-300">
              <div className="truncate font-medium text-white" title={item.filename}>
                {item.filename}
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dung lượng:</span>
                <span className="font-mono text-slate-200">{formatBytes(item.size_bytes)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Định dạng:</span>
                <span className="uppercase font-mono text-cyan-300">{item.extension}</span>
              </div>
              <div className="text-[10px] text-slate-500 break-all font-mono pt-1">
                {item.path}
              </div>
            </div>
          </div>

          {/* Section: Camera & Lens */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5" />
              <span>Thiết bị chụp</span>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-2.5 space-y-1.5 border border-white/5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Hãng:</span>
                <span className="font-medium text-white">{exif?.camera_make || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="font-medium text-cyan-300">{exif?.camera_model || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ống kính:</span>
                <span className="text-right text-slate-200 max-w-[140px] truncate" title={exif?.lens_model || ''}>
                  {exif?.lens_model || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngày chụp:</span>
                <span className="font-mono text-slate-200">{exif?.date_taken || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section: Exposure & Settings */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" />
              <span>Thông số phơi sáng</span>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-2.5 space-y-1.5 border border-white/5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Khẩu độ:</span>
                <span className="font-mono text-white">
                  {exif?.aperture_f_number ? `f/${exif.aperture_f_number.toFixed(1)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tốc độ:</span>
                <span className="font-mono text-white">{exif?.exposure_time ? `${exif.exposure_time}s` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ISO:</span>
                <span className="font-mono text-white">{exif?.iso_rating || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tiêu cự:</span>
                <span className="font-mono text-white">{exif?.focal_length || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Độ phân giải:</span>
                <span className="font-mono text-slate-300">
                  {exif?.pixel_width && exif?.pixel_height
                    ? `${exif.pixel_width} × ${exif.pixel_height}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Không gian màu:</span>
                <span className="text-slate-300">{exif?.color_space || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section: GPS Location */}
          {exif?.has_gps && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Vị trí Địa lý (GPS)</span>
              </div>
              <div className="bg-[#0f1117] rounded-lg p-2.5 space-y-2 border border-white/5 text-slate-300">
                <div className="text-[11px] font-mono text-slate-300">
                  {exif.gps_latitude?.toFixed(5)}, {exif.gps_longitude?.toFixed(5)}
                </div>
                {exif.gps_altitude && (
                  <div className="text-slate-400">
                    Độ cao: <span className="text-slate-200">{Math.round(exif.gps_altitude)}m</span>
                  </div>
                )}
                <button
                  onClick={openMap}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Mở Google Maps</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-center p-4">
          Chọn một bức ảnh để xem chi tiết thông số EXIF
        </div>
      )}
    </aside>
  );
};
