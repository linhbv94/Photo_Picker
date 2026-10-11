import { convertFileSrc } from '@tauri-apps/api/core';
import { FileItem, SubfolderItem, RenameDiffItem, ExifMetadata } from '../types';

export interface ReadDirectoryResult {
  scan_id: string;
  folder_path: string;
  total_files: number;
  files: FileItem[];
}

export interface ExifChunkStreamPayload {
  scan_id: string;
  is_last_chunk: boolean;
  items: Array<{
    file_id: string;
    exif: ExifMetadata | null;
  }>;
}

export interface FileOperationResult {
  path: string; target_path: string; status: string;
  error_message?: string | null; journal_path?: string | null;
}
export interface OperationResult {
  success_count: number; failed_count: number; results: FileOperationResult[];
}
export interface OperationPreview {
  token: string; action: string; degrees?: number;
  entries: Array<{ source: string; target: string; expected: { size: number } }>;
}
export interface RecoveryItem {
  id: string; action: string; status: string; journal_path: string; backup: string;
  entry: { source: string; target: string };
}
export interface RotateResponse extends OperationResult { cache_bust_timestamp: number; }
export type ApplyRenameResponse = OperationResult;

export type UnlistenFn = () => void;

// Check if running inside Tauri WebView
export const isTauriEnvironment = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
};

// Mock sample photos for browser dev mode
const MOCK_FILES: FileItem[] = [
  {
    id: 'mock_1',
    filename: 'DSC04921_SonyA7IV.jpg',
    path: '/Volumes/Photos/2026_Project/DSC04921_SonyA7IV.jpg',
    extension: 'jpg',
    size_bytes: 24500120,
    modified_timestamp: 1775543200,
    created_timestamp: 1775543200,
    exif: {
      camera_make: 'SONY',
      camera_model: 'ILCE-7M4 (Sony A7 IV)',
      lens_model: 'FE 24-70mm F2.8 GM II',
      focal_length: '50mm',
      iso_rating: 100,
      aperture_f_number: 2.8,
      exposure_time: '1/500s',
      date_taken: '2026:09:28 14:22:10',
      pixel_width: 7008,
      pixel_height: 4672,
      orientation: 1,
      sub_sec_time: null,
      software: null,
      color_space: 'sRGB',
      white_balance: 'Auto',
      exposure_mode: 'Manual',
      has_gps: false,
    },
  },
  {
    id: 'mock_2',
    filename: 'DSC04922_SonyA7IV.jpg',
    path: '/Volumes/Photos/2026_Project/DSC04922_SonyA7IV.jpg',
    extension: 'jpg',
    size_bytes: 26100800,
    modified_timestamp: 1775543215,
    created_timestamp: 1775543215,
    exif: {
      camera_make: 'SONY',
      camera_model: 'ILCE-7M4 (Sony A7 IV)',
      lens_model: 'FE 24-70mm F2.8 GM II',
      focal_length: '70mm',
      iso_rating: 200,
      aperture_f_number: 2.8,
      exposure_time: '1/640s',
      date_taken: '2026:09:28 14:22:25',
      pixel_width: 7008,
      pixel_height: 4672,
      orientation: 1,
      sub_sec_time: null,
      software: null,
      color_space: 'sRGB',
      white_balance: 'Auto',
      exposure_mode: 'Manual',
      has_gps: false,
    },
  },
  {
    id: 'mock_3',
    filename: 'IMG_8819_iPhone15Pro.heic',
    path: '/Volumes/Photos/2026_Project/IMG_8819_iPhone15Pro.heic',
    extension: 'heic',
    size_bytes: 3840200,
    modified_timestamp: 1775543500,
    created_timestamp: 1775543500,
    exif: {
      camera_make: 'Apple',
      camera_model: 'iPhone 15 Pro',
      lens_model: 'iPhone 15 Pro back camera 24mm f/1.78',
      focal_length: '24mm',
      iso_rating: 64,
      aperture_f_number: 1.78,
      exposure_time: '1/120s',
      date_taken: '2026:09:28 14:35:12',
      pixel_width: 4032,
      pixel_height: 3024,
      orientation: 1,
      sub_sec_time: null,
      software: 'iOS 18.0',
      color_space: 'Display P3',
      white_balance: 'Auto',
      exposure_mode: 'Auto',
      has_gps: true,
    },
  },
  {
    id: 'mock_4',
    filename: 'Screenshot_2026-10-02_101500.png',
    path: '/Volumes/Photos/2026_Project/Screenshot_2026-10-02_101500.png',
    extension: 'png',
    size_bytes: 1420500,
    modified_timestamp: 1775543800,
    created_timestamp: 1775543800,
    exif: {
      camera_make: null,
      camera_model: null,
      lens_model: null,
      focal_length: null,
      iso_rating: null,
      aperture_f_number: null,
      exposure_time: null,
      date_taken: null,
      pixel_width: 2560,
      pixel_height: 1600,
      orientation: 1,
      sub_sec_time: null,
      software: 'macOS ScreenCapture',
      color_space: 'Display P3',
      white_balance: null,
      exposure_mode: null,
      has_gps: false,
    },
  },
  {
    id: 'mock_5',
    filename: 'DSC04930_SonyA7IV.arw',
    path: '/Volumes/Photos/2026_Project/DSC04930_SonyA7IV.arw',
    extension: 'arw',
    size_bytes: 35200100,
    modified_timestamp: 1775544100,
    created_timestamp: 1775544100,
    exif: {
      camera_make: 'SONY',
      camera_model: 'ILCE-7M4 (Sony A7 IV)',
      lens_model: 'FE 85mm F1.4 GM',
      focal_length: '85mm',
      iso_rating: 100,
      aperture_f_number: 1.4,
      exposure_time: '1/1000s',
      date_taken: '2026:09:28 14:40:05',
      pixel_width: 7008,
      pixel_height: 4672,
      orientation: 1,
      sub_sec_time: null,
      software: null,
      color_space: 'sRGB',
      white_balance: 'Auto',
      exposure_mode: 'Manual',
      has_gps: false,
    },
  },
];

const MOCK_SUBFOLDERS: SubfolderItem[] = [
  {
    id: 'sub_1',
    name: '1_Chon_Loc_A',
    parent_path: '/Volumes/Photos/2026_Project',
    direct_children_count: 12,
  },
  {
    id: 'sub_2',
    name: '2_Hau_Ky',
    parent_path: '/Volumes/Photos/2026_Project',
    direct_children_count: 5,
  },
  {
    id: 'sub_3',
    name: '3_Loai_Bo',
    parent_path: '/Volumes/Photos/2026_Project',
    direct_children_count: 0,
  },
];

export const tauriApi = {
  async previewFileOperation(sourcePaths: string[], actionType: 'MOVE' | 'COPY' | 'TRASH' | 'ROTATE', destinationFolder?: string, degrees?: number): Promise<OperationPreview> {
    if (!isTauriEnvironment()) throw new Error('Thao tác ghi chỉ có trong app desktop');
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<OperationPreview>('preview_file_operation', { sourcePaths, actionType, destinationFolder, degrees });
  },
  async listRecovery(folderPath: string): Promise<RecoveryItem[]> {
    if (!isTauriEnvironment()) return [];
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<RecoveryItem[]>('list_file_recovery', { folderPath });
  },
  async restoreOperation(journalPath: string): Promise<void> {
    if (!isTauriEnvironment()) throw new Error('Phục hồi chỉ có trong app desktop');
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('restore_file_operation', { journalPath, confirmed: true });
  },
  async selectFolder(defaultPath?: string): Promise<string | null> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<string | null>('select_folder_dialog', { defaultPath });
      } catch (e) {
        console.warn('Tauri selectFolder failed:', e);
        throw e;
      }
    }
    return '/Volumes/Photos/2026_Project';
  },

  async readDirectory(folderPath: string, recursive: boolean = false): Promise<ReadDirectoryResult> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<ReadDirectoryResult>('read_directory', {
          folderPath,
          recursive,
        });
      } catch (e) {
        console.warn('Tauri readDirectory failed, using fallback:', e);
        throw e;
      }
    }
    return {
      scan_id: 'scan_mock_demo',
      folder_path: folderPath || '/Volumes/Photos/2026_Project',
      total_files: MOCK_FILES.length,
      files: MOCK_FILES,
    };
  },

  async getSubfolders(folderPath: string): Promise<SubfolderItem[]> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<SubfolderItem[]>('get_subfolders', { folderPath });
      } catch (e) {
        console.warn('Tauri getSubfolders failed:', e);
        throw e;
      }
    }
    return MOCK_SUBFOLDERS;
  },

  async createSubfolder(parentPath: string, folderName: string): Promise<SubfolderItem> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<SubfolderItem>('create_subfolder', {
          parentPath,
          folderName,
        });
      } catch (e) {
        console.warn('Tauri createSubfolder failed:', e);
        throw e;
      }
    }
    const newFolder: SubfolderItem = {
      id: `sub_${Date.now()}`,
      name: folderName,
      parent_path: parentPath,
      direct_children_count: 0,
    };
    MOCK_SUBFOLDERS.push(newFolder);
    return newFolder;
  },

  async rotateLossless(filePaths: string[], degrees: number, confirmationToken: string): Promise<RotateResponse> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<RotateResponse>('rotate_lossless', {
          filePaths,
          degrees, confirmationToken,
        });
      } catch (e) {
        console.warn('Tauri rotateLossless failed:', e);
        throw e;
      }
    }
    return {
      success_count: filePaths.length,
      failed_count: 0, results: filePaths.map(path => ({ path, target_path: path, status: 'demo' })),
      cache_bust_timestamp: Date.now(),
    };
  },

  async clipboardFiles(filePaths: string[], isCut: boolean = false): Promise<boolean> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<boolean>('clipboard_files', { filePaths, isCut });
      } catch (e) {
        console.warn('Tauri clipboardFiles failed:', e);
        throw e;
      }
    }
    return false;
  },

  async previewBatchRename(
    filePaths: string[],
    namingPattern?: string,
    fallbackToMtime: boolean = false
  ): Promise<RenameDiffItem[]> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<RenameDiffItem[]>('preview_batch_rename', {
          filePaths,
          namingPattern,
          fallbackToMtime,
        });
      } catch (e) {
        console.warn('Tauri previewBatchRename failed:', e);
        throw e;
      }
    }
    return filePaths.map((origPath, index) => {
      const filename = origPath.split('/').pop() || origPath;
      const ext = filename.split('.').pop() || '';
      const num = String(index + 1).padStart(3, '0');
      const newFilename = `IMG_20260928_${num}.${ext}`;
      return {
        original_path: origPath,
        original_filename: filename,
        new_path: origPath.replace(filename, newFilename),
        new_filename: newFilename,
        has_conflict: false,
      };
    });
  },

  async applyBatchRename(items: RenameDiffItem[]): Promise<ApplyRenameResponse> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<ApplyRenameResponse>('apply_batch_rename', { items });
      } catch (e) {
        console.warn('Tauri applyBatchRename failed:', e);
        throw e;
      }
    }
    return {
      success_count: items.length,
      failed_count: 0,
      results: items.map(i => ({ path: i.original_path, target_path: i.new_path, status: 'demo' })),
    };
  },

  async moveOrCopyFiles(
    sourcePaths: string[],
    destinationFolder: string,
    actionType: 'MOVE' | 'COPY', confirmationToken: string
  ): Promise<OperationResult> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<OperationResult>('move_or_copy_files', {
          sourcePaths,
          destinationFolder,
          actionType, confirmationToken,
        });
      } catch (e) {
        console.warn('Tauri moveOrCopyFiles failed:', e);
        throw e;
      }
    }
    return { success_count: sourcePaths.length, failed_count: 0, results: sourcePaths.map(path => ({ path, target_path: path, status: 'demo' })) };
  },

  async revealInFileManager(filePath: string): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('reveal_in_file_manager', { filePath });
      } catch (e) {
        console.warn('Tauri revealInFileManager failed:', e);
        throw e;
      }
    } else {
      console.log('Reveal in File Manager (Browser mock):', filePath);
    }
  },

  async openInSystemViewer(filePath: string): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('open_in_system_viewer', { filePath });
      } catch (e) {
        console.warn('Tauri openInSystemViewer failed:', e);
        throw e;
      }
    } else {
      console.log('Open in System Viewer (Browser mock):', filePath);
    }
  },

  async openNativePreview(filePath: string): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('open_native_preview', { filePath });
      } catch (e) {
        console.warn('Tauri openNativePreview failed:', e);
        throw e;
      }
    } else {
      console.log('Open Native Preview (Browser mock):', filePath);
    }
  },

  async moveToTrash(filePaths: string[], confirmationToken: string): Promise<OperationResult> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<OperationResult>('move_to_trash', { filePaths, confirmationToken });
      } catch (e) {
        console.warn('Tauri moveToTrash failed:', e);
        throw e;
      }
    }
    return { success_count: filePaths.length, failed_count: 0, results: filePaths.map(path => ({ path, target_path: path, status: 'demo' })) };
  },

  async listenExifStream(callback: (payload: ExifChunkStreamPayload) => void): Promise<UnlistenFn> {
    if (isTauriEnvironment()) {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        return await listen<ExifChunkStreamPayload>('exif_chunk_stream', (event) => {
          callback(event.payload);
        });
      } catch (e) {
        console.warn('Tauri listenExifStream failed:', e);
        throw e;
      }
    }
    return () => {};
  },

  async listenNativeMenuEvents(callbacks: {
    onOpenFolder: () => void;
    onOpenSettings: () => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onViewGrid: () => void;
    onViewDetail: () => void;
    onToggleSidebar: () => void;
    onToggleInfo: () => void;
    onRotatePhoto: () => void;
    onBatchRename: () => void;
  }): Promise<UnlistenFn> {
    if (isTauriEnvironment()) {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        const u1 = await listen('trigger-open-folder', () => callbacks.onOpenFolder());
        const u2 = await listen('trigger-open-settings', () => callbacks.onOpenSettings());
        const u3 = await listen('trigger-select-all', () => callbacks.onSelectAll());
        const u4 = await listen('trigger-deselect-all', () => callbacks.onDeselectAll());
        const u5 = await listen('trigger-view-grid', () => callbacks.onViewGrid());
        const u6 = await listen('trigger-view-detail', () => callbacks.onViewDetail());
        const u7 = await listen('trigger-toggle-sidebar', () => callbacks.onToggleSidebar());
        const u8 = await listen('trigger-toggle-info', () => callbacks.onToggleInfo());
        const u9 = await listen('trigger-rotate-photo', () => callbacks.onRotatePhoto());
        const u10 = await listen('trigger-batch-rename', () => callbacks.onBatchRename());
        return () => {
          u1();
          u2();
          u3();
          u4();
          u5();
          u6();
          u7();
          u8();
          u9();
          u10();
        };
      } catch (e) {
        console.warn('Tauri listenNativeMenuEvents failed:', e);
        throw e;
      }
    }
    return () => {};
  },

  toAssetUrl(filePath: string, bustToken?: number): string {
    if (isTauriEnvironment()) {
      try {
        const url = convertFileSrc(filePath);
        return bustToken ? `${url}?t=${bustToken}` : url;
      } catch (e) {
        console.warn('convertFileSrc failed:', e);
        throw e;
      }
    }
    return `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80`;
  },

  async startDragging(): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().startDragging();
      } catch (e) {
        console.warn('startDragging failed:', e);
        throw e;
      }
    }
  },
};

export const startDragging = () => tauriApi.startDragging();
