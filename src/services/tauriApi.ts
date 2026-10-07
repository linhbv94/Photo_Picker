import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
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
    exif: ExifMetadata;
  }>;
}

export interface RotateResponse {
  success_count: number;
  failed_paths: Array<{ path: string; error_message: string }>;
  cache_bust_timestamp: number;
}

export interface ApplyRenameResponse {
  success_count: usize;
  failed_count: usize;
  results: RenameDiffItem[];
}

type usize = number;

export const tauriApi = {
  async selectFolder(defaultPath?: string): Promise<string | null> {
    try {
      return await invoke<string | null>('select_folder_dialog', { defaultPath });
    } catch (e) {
      console.warn('Fallback selectFolder:', e);
      return null;
    }
  },

  async readDirectory(folderPath: string, recursive: boolean = false): Promise<ReadDirectoryResult> {
    return await invoke<ReadDirectoryResult>('read_directory', {
      folderPath,
      recursive,
    });
  },

  async getSubfolders(folderPath: string): Promise<SubfolderItem[]> {
    return await invoke<SubfolderItem[]>('get_subfolders', { folderPath });
  },

  async createSubfolder(parentPath: string, folderName: string): Promise<SubfolderItem> {
    return await invoke<SubfolderItem>('create_subfolder', {
      parentPath,
      folderName,
    });
  },

  async rotateLossless(filePaths: string[], degrees: number): Promise<RotateResponse> {
    return await invoke<RotateResponse>('rotate_lossless', {
      filePaths,
      degrees,
    });
  },

  async previewBatchRename(
    filePaths: string[],
    namingPattern?: string,
    fallbackToMtime: boolean = true
  ): Promise<RenameDiffItem[]> {
    return await invoke<RenameDiffItem[]>('preview_batch_rename', {
      filePaths,
      namingPattern,
      fallbackToMtime,
    });
  },

  async applyBatchRename(items: RenameDiffItem[]): Promise<ApplyRenameResponse> {
    return await invoke<ApplyRenameResponse>('apply_batch_rename', { items });
  },

  async moveOrCopyFiles(
    sourcePaths: string[],
    destinationFolder: string,
    actionType: 'MOVE' | 'COPY'
  ): Promise<{ success_count: number; failed_paths: string[] }> {
    return await invoke<{ success_count: number; failed_paths: string[] }>('move_or_copy_files', {
      sourcePaths,
      destinationFolder,
      actionType,
    });
  },

  async revealInFileManager(filePath: string): Promise<void> {
    await invoke('reveal_in_file_manager', { filePath });
  },

  async openInSystemViewer(filePath: string): Promise<void> {
    await invoke('open_in_system_viewer', { filePath });
  },

  async openNativePreview(filePath: string): Promise<void> {
    await invoke('open_native_preview', { filePath });
  },

  async moveToTrash(filePaths: string[]): Promise<number> {
    return await invoke<number>('move_to_trash', { filePaths });
  },

  async listenExifStream(callback: (payload: ExifChunkStreamPayload) => void): Promise<UnlistenFn> {
    return await listen<ExifChunkStreamPayload>('exif_chunk_stream', (event) => {
      callback(event.payload);
    });
  },

  toAssetUrl(filePath: string, bustToken?: number): string {
    // Converts local path into Tauri asset protocol URL
    const cleanPath = filePath.replace(/\\/g, '/');
    const encoded = encodeURI(cleanPath);
    const base = `http://asset.localhost/${encoded.startsWith('/') ? encoded.slice(1) : encoded}`;
    return bustToken ? `${base}?v=${bustToken}` : base;
  },
};
