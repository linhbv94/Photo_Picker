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
import { t, Language } from '../i18n/translations';

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: FileItem | null;
  language?: Language;
}

export const InfoDrawer: React.FC<InfoDrawerProps> = ({ isOpen, onClose, item, language = 'vi' }) => {
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
    <aside className="w-72 h-full bg-slate-50/95 dark:bg-[#141821]/95 border-l border-slate-200 dark:border-white/5 flex flex-col shrink-0 select-none z-30 text-xs backdrop-blur-md animate-in slide-in-from-right duration-150">
      {/* Header */}
      <div className="h-10 px-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold">
        <span>{t('exifInfo', language)}</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200/60 dark:hover:bg-white/10 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          title="Cmd/Ctrl+I"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {item ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section: File Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>{t('filename', language)}</span>
            </div>
            <div className="bg-white dark:bg-[#0f1117] rounded-lg p-2.5 space-y-1.5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 shadow-2xs">
              <div className="truncate font-medium text-slate-900 dark:text-white" title={item.filename}>
                {item.filename}
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t('size', language)}:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formatBytes(item.size_bytes)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t('format', language)}:</span>
                <span className="uppercase font-mono text-cyan-700 dark:text-cyan-300 font-semibold">{item.extension}</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 break-all font-mono pt-1">
                {item.path}
              </div>
            </div>
          </div>

          {/* Section: Camera & Lens */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5" />
              <span>{t('cameraDevice', language)}</span>
            </div>
            <div className="bg-white dark:bg-[#0f1117] rounded-lg p-2.5 space-y-1.5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('cameraBrand', language)}:</span>
                <span className="font-medium text-slate-900 dark:text-white">{exif?.camera_make || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('cameraModel', language)}:</span>
                <span className="font-medium text-cyan-700 dark:text-cyan-300">{exif?.camera_model || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('lens', language)}:</span>
                <span className="text-right text-slate-800 dark:text-slate-200 max-w-[140px] truncate" title={exif?.lens_model || ''}>
                  {exif?.lens_model || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('dateTaken', language)}:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{exif?.date_taken || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section: Exposure & Settings */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('exposureParams', language)}</span>
            </div>
            <div className="bg-white dark:bg-[#0f1117] rounded-lg p-2.5 space-y-1.5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('aperture', language)}:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {exif?.aperture_f_number ? `f/${exif.aperture_f_number.toFixed(1)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('shutterSpeed', language)}:</span>
                <span className="font-mono text-slate-900 dark:text-white">{exif?.exposure_time ? `${exif.exposure_time}s` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('iso', language)}:</span>
                <span className="font-mono text-slate-900 dark:text-white">{exif?.iso_rating || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('focalLength', language)}:</span>
                <span className="font-mono text-slate-900 dark:text-white">{exif?.focal_length || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('resolution', language)}:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {exif?.pixel_width && exif?.pixel_height
                    ? `${exif.pixel_width} × ${exif.pixel_height}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('colorSpace', language)}:</span>
                <span className="text-slate-700 dark:text-slate-300">{exif?.color_space || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section: GPS Location */}
          {exif?.has_gps && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('gpsLocation', language)}</span>
              </div>
              <div className="bg-white dark:bg-[#0f1117] rounded-lg p-2.5 space-y-2 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 shadow-2xs">
                <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  {exif.gps_latitude?.toFixed(5)}, {exif.gps_longitude?.toFixed(5)}
                </div>
                {exif.gps_altitude && (
                  <div className="text-slate-500 dark:text-slate-400">
                    {t('altitude', language)}: <span className="text-slate-800 dark:text-slate-200">{Math.round(exif.gps_altitude)}m</span>
                  </div>
                )}
                <button
                  onClick={openMap}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 dark:border-emerald-500/40 font-medium transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{t('openGoogleMaps', language)}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-center p-4">
          {t('selectPhotoHint', language)}
        </div>
      )}
    </aside>
  );
};
