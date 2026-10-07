import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileItem,
  SubfolderItem,
  RenameDiffItem,
  ViewMode,
  FilterMode,
  SortField,
  SortOrder,
} from './types';
import { tauriApi, ExifChunkStreamPayload } from './services/tauriApi';
import { WindowBar } from './components/WindowBar';
import { Sidebar } from './components/Sidebar';
import { TopToolbar } from './components/TopToolbar';
import { GridView } from './components/GridView';
import { DetailTableView } from './components/DetailTableView';
import { QuickPreviewModal } from './components/QuickPreviewModal';
import { InfoDrawer } from './components/InfoDrawer';
import { BatchActionBar } from './components/BatchActionBar';
import { BatchRenameModal } from './components/BatchRenameModal';
import { ContextMenu, ContextMenuState } from './components/ContextMenu';
import { SettingsModal } from './components/SettingsModal';
import { Toast, ToastMessage } from './components/Toast';
import { t, Language } from './i18n/translations';

export const App: React.FC = () => {
  // Folder & Data States
  const [folderPath, setFolderPath] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [subfolders, setSubfolders] = useState<SubfolderItem[]>([]);
  const [cacheBust, setCacheBust] = useState<number>(Date.now());

  // Selection & Marking States (Dual-State Model)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [lastMarkedAnchorId, setLastMarkedAnchorId] = useState<string | null>(null);

  // Theme & Language
  const [theme, setTheme] = useState<'system' | 'dark' | 'light' | 'black'>(() => {
    return (localStorage.getItem('vxphotos_theme') as any) || 'dark';
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('vxphotos_lang') as any) || 'vi';
  });

  useEffect(() => {
    localStorage.setItem('vxphotos_theme', theme);
    const root = document.documentElement;
    root.classList.remove('light-theme', 'black-theme', 'dark');

    let resolved = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    }

    if (resolved === 'light') {
      root.classList.add('light-theme');
      root.setAttribute('data-theme', 'light');
    } else if (resolved === 'black') {
      root.classList.add('black-theme');
      root.setAttribute('data-theme', 'black');
    } else {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('vxphotos_lang', language);
  }, [language]);

  // View & Filter States
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedCameraModel, setSelectedCameraModel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomSize, setZoomSize] = useState<number>(160);
  const [sortField, setSortField] = useState<SortField>('filename');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // UI Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [diffItems, setDiffItems] = useState<RenameDiffItem[]>([]);

  // Context Menu & Toast
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'canvas',
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ id: Math.random().toString(), type, text });
  };

  // 1. Load Folder Action
  const loadFolder = useCallback(async (path: string) => {
    try {
      setFolderPath(path);
      setSelectedId(null);
      setMarkedIds(new Set());
      setLastMarkedAnchorId(null);

      const [dirResult, subResult] = await Promise.all([
        tauriApi.readDirectory(path),
        tauriApi.getSubfolders(path),
      ]);

      setFiles(dirResult.files);
      setSubfolders(subResult);
      if (dirResult.files.length > 0) {
        setSelectedId(dirResult.files[0].id);
      }
    } catch (err: any) {
      showToast('error', `Lỗi tải thư mục: ${err}`);
    }
  }, []);

  // Open Folder Dialog
  const handleOpenFolder = async () => {
    const selected = await tauriApi.selectFolder(folderPath || undefined);
    if (selected) {
      loadFolder(selected);
    }
  };

  // 2. Listen to streaming EXIF chunks from background worker
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    tauriApi.listenExifStream((payload: ExifChunkStreamPayload) => {
      setFiles((prevFiles) => {
        const itemMap = new Map(payload.items.map((i) => [i.file_id, i.exif]));
        return prevFiles.map((f) => {
          if (itemMap.has(f.id)) {
            return { ...f, exif: itemMap.get(f.id) || null };
          }
          return f;
        });
      });
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // 3. Filtered & Sorted Items
  const visibleItems = useMemo(() => {
    let result = files.filter((item) => {
      // Search query
      if (searchQuery.trim() && !item.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Camera model dropdown
      if (selectedCameraModel && item.exif?.camera_model !== selectedCameraModel) {
        return false;
      }

      // Filter Mode
      if (filterMode === 'camera') {
        return Boolean(item.exif?.camera_make || item.exif?.camera_model);
      }
      if (filterMode === 'screenshot') {
        const hasCamera = Boolean(item.exif?.camera_make || item.exif?.camera_model);
        return !hasCamera;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'filename':
          comparison = a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'date_taken':
          comparison = (a.exif?.date_taken || '').localeCompare(b.exif?.date_taken || '');
          break;
        case 'camera_make':
          comparison = (a.exif?.camera_make || '').localeCompare(b.exif?.camera_make || '');
          break;
        case 'camera_model':
          comparison = (a.exif?.camera_model || '').localeCompare(b.exif?.camera_model || '');
          break;
        case 'lens_model':
          comparison = (a.exif?.lens_model || '').localeCompare(b.exif?.lens_model || '');
          break;
        case 'aperture':
          comparison = (a.exif?.aperture_f_number || 0) - (b.exif?.aperture_f_number || 0);
          break;
        case 'shutter':
          comparison = (a.exif?.exposure_time || '').localeCompare(b.exif?.exposure_time || '');
          break;
        case 'iso':
          comparison = (a.exif?.iso_rating || 0) - (b.exif?.iso_rating || 0);
          break;
        case 'size':
          comparison = a.size_bytes - b.size_bytes;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, filterMode, selectedCameraModel, sortField, sortOrder]);

  // Counts & Discovered Models
  const { counts, availableCameraModels } = useMemo(() => {
    let camera = 0;
    let screenshot = 0;
    let phone = 0;
    const models = new Set<string>();

    for (const f of files) {
      const isCamera = Boolean(f.exif?.camera_make || f.exif?.camera_model);
      if (isCamera) {
        camera++;
        if (f.exif?.camera_model) models.add(f.exif.camera_model);
        if (f.exif?.camera_make?.toLowerCase().includes('apple') || f.exif?.camera_make?.toLowerCase().includes('samsung')) {
          phone++;
        }
      } else {
        screenshot++;
      }
    }

    return {
      counts: { total: files.length, camera, phone, screenshot },
      availableCameraModels: Array.from(models).sort(),
    };
  }, [files]);

  // Currently Focused Item
  const currentFocusedItem = useMemo(() => {
    return files.find((f) => f.id === selectedId) || null;
  }, [files, selectedId]);

  const currentFocusedIndex = useMemo(() => {
    return visibleItems.findIndex((f) => f.id === selectedId);
  }, [visibleItems, selectedId]);

  // 4. Selection & Range Marking Logic
  const handleItemClick = (item: FileItem, e: React.MouseEvent) => {
    const anchor = lastMarkedAnchorId || selectedId;
    if (e.shiftKey && anchor) {
      // Range Marking from last anchor to clicked item
      const anchorIdx = visibleItems.findIndex((i) => i.id === anchor);
      const targetIdx = visibleItems.findIndex((i) => i.id === item.id);

      if (anchorIdx !== -1 && targetIdx !== -1) {
        const start = Math.min(anchorIdx, targetIdx);
        const end = Math.max(anchorIdx, targetIdx);
        const range = visibleItems.slice(start, end + 1).map((i) => i.id);

        setMarkedIds((prev) => {
          const next = new Set(prev);
          for (const id of range) next.add(id);
          return next;
        });
      }
    } else {
      setLastMarkedAnchorId(item.id);
    }

    // Set Focus Cursor
    setSelectedId(item.id);
  };

  const handleToggleMark = (item: FileItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const anchor = lastMarkedAnchorId || selectedId;

    if (e?.shiftKey && anchor) {
      // Range Marking on thumbnail click with Shift
      const anchorIdx = visibleItems.findIndex((i) => i.id === anchor);
      const targetIdx = visibleItems.findIndex((i) => i.id === item.id);

      if (anchorIdx !== -1 && targetIdx !== -1) {
        const start = Math.min(anchorIdx, targetIdx);
        const end = Math.max(anchorIdx, targetIdx);
        const range = visibleItems.slice(start, end + 1).map((i) => i.id);

        setMarkedIds((prev) => {
          const next = new Set(prev);
          for (const id of range) next.add(id);
          return next;
        });
        setSelectedId(item.id);
        return;
      }
    }

    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
    setLastMarkedAnchorId(item.id);
    setSelectedId(item.id);
  };

  const handleSelectAll = () => {
    const allIds = new Set(visibleItems.map((i) => i.id));
    setMarkedIds(allIds);
    showToast('info', `Đã chọn ${allIds.size} ảnh`);
  };

  const handleUnmarkAll = () => {
    setMarkedIds(new Set());
    setLastMarkedAnchorId(null);
  };

  // 5. Double Click -> System Viewer
  const handleItemDoubleClick = async (item: FileItem) => {
    try {
      await tauriApi.openInSystemViewer(item.path);
    } catch (e: any) {
      showToast('error', `Lỗi mở System Viewer: ${e}`);
    }
  };

  // 6. Lossless Rotation Action
  const handleRotate = async (degrees: number = 90) => {
    const targets = markedIds.size > 0
      ? Array.from(markedIds)
      : selectedId ? [selectedId] : [];

    if (targets.length === 0) return;

    try {
      const res = await tauriApi.rotateLossless(targets, degrees);
      setCacheBust(res.cache_bust_timestamp);
      showToast('success', t('rotatedSuccess', language, { count: res.success_count }));
    } catch (e: any) {
      showToast('error', `Lỗi xoay ảnh: ${e}`);
    }
  };

  // 7. Batch Renamer Action
  const handleOpenBatchRename = async () => {
    const targets = markedIds.size > 0
      ? Array.from(markedIds)
      : files.map((f) => f.id);

    if (targets.length === 0) {
      showToast('info', 'Không có ảnh nào để đổi tên');
      return;
    }

    try {
      const diffs = await tauriApi.previewBatchRename(targets);
      setDiffItems(diffs);
      setIsRenameModalOpen(true);
    } catch (e: any) {
      showToast('error', `Lỗi xem trước đổi tên: ${e}`);
    }
  };

  const handleConfirmBatchRename = async () => {
    setIsRenaming(true);
    try {
      const res = await tauriApi.applyBatchRename(diffItems);
      setIsRenameModalOpen(false);
      showToast('success', `Đã đổi tên thành công ${res.success_count} ảnh`);
      if (folderPath) {
        loadFolder(folderPath);
      }
    } catch (e: any) {
      showToast('error', `Lỗi đổi tên: ${e}`);
    } finally {
      setIsRenaming(false);
    }
  };

  // 8. Move / Copy Files to Subfolder
  const handleMoveFiles = async (
    destFolder: string,
    actionType: 'MOVE' | 'COPY' = 'MOVE',
    explicitPaths?: string[]
  ) => {
    const targets =
      explicitPaths && explicitPaths.length > 0
        ? explicitPaths
        : markedIds.size > 0
        ? Array.from(markedIds)
        : selectedId
        ? [selectedId]
        : [];

    if (targets.length === 0) return;

    try {
      const res = await tauriApi.moveOrCopyFiles(targets, destFolder, actionType);
      showToast('success', t('movedSuccess', language, { count: res.success_count }));
      setMarkedIds((prev) => {
        const next = new Set(prev);
        targets.forEach((t) => next.delete(t));
        return next;
      });
      if (folderPath) {
        loadFolder(folderPath);
      }
    } catch (e: any) {
      showToast('error', `Lỗi di chuyển: ${e}`);
    }
  };

  // Drag and drop into sidebar
  const handleDragStart = (e: React.DragEvent, item: FileItem) => {
    const targets = markedIds.has(item.id) ? Array.from(markedIds) : [item.id];
    e.dataTransfer.setData('text/plain', JSON.stringify(targets));
    try {
      e.dataTransfer.effectAllowed = 'move';
    } catch {}

    // Custom compact pill drag badge showing dragging count
    try {
      const ghost = document.createElement('div');
      ghost.style.position = 'fixed';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.padding = '6px 12px';
      ghost.style.borderRadius = '9999px';
      ghost.style.backgroundColor = '#06b6d4';
      ghost.style.color = '#000000';
      ghost.style.fontWeight = '700';
      ghost.style.fontSize = '12px';
      ghost.style.lineHeight = '1';
      ghost.style.display = 'flex';
      ghost.style.alignItems = 'center';
      ghost.style.gap = '6px';
      ghost.style.boxShadow = '0 8px 20px rgba(6, 182, 212, 0.5), 0 2px 4px rgba(0,0,0,0.4)';
      ghost.style.border = '2px solid #ffffff';
      ghost.style.zIndex = '99999';
      ghost.style.pointerEvents = 'none';

      ghost.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
        <span>${targets.length} ảnh</span>
      `;

      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 20, 14);
      setTimeout(() => {
        if (ghost.parentNode) {
          ghost.parentNode.removeChild(ghost);
        }
      }, 0);
    } catch {}
  };

  // Create subfolder
  const handleCreateSubfolder = async (name: string) => {
    if (!folderPath) return;
    try {
      await tauriApi.createSubfolder(folderPath, name);
      const updated = await tauriApi.getSubfolders(folderPath);
      setSubfolders(updated);
      showToast('success', `Đã tạo thư mục: ${name}`);
    } catch (e: any) {
      showToast('error', `Lỗi tạo thư mục: ${e}`);
    }
  };

  // 9. Global Keyboard Navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || isRenameModalOpen || isSettingsOpen) {
        return;
      }

      if (e.key === 'Escape') {
        if (isPreviewOpen) {
          e.preventDefault();
          setIsPreviewOpen(false);
        } else if (isInfoOpen) {
          e.preventDefault();
          setIsInfoOpen(false);
        } else if (markedIds.size > 0) {
          e.preventDefault();
          handleUnmarkAll();
          showToast('info', 'Đã hủy chọn toàn bộ ảnh');
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPreviewOpen((prev) => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (visibleItems.length > 0) {
          const nextIdx = Math.min(currentFocusedIndex + 1, visibleItems.length - 1);
          setSelectedId(visibleItems[nextIdx].id);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (visibleItems.length > 0) {
          const prevIdx = Math.max(currentFocusedIndex - 1, 0);
          setSelectedId(visibleItems[prevIdx].id);
        }
      } else if (e.key === 'x' || e.key === 'X' || e.key === 'm' || e.key === 'M' || e.key === '1') {
        if (currentFocusedItem) {
          e.preventDefault();
          handleToggleMark(currentFocusedItem);
        }
      } else if (e.key === 'Enter') {
        if (currentFocusedItem) {
          e.preventDefault();
          handleItemDoubleClick(currentFocusedItem);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          handleOpenBatchRename();
        } else {
          e.preventDefault();
          handleRotate(90);
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleOpenBatchRename();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        handleUnmarkAll();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarOpen((p) => !p);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setIsInfoOpen((p) => !p);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setViewMode('grid');
      } else if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setViewMode('detail');
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenFolder();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [visibleItems, currentFocusedIndex, currentFocusedItem, isRenameModalOpen, isSettingsOpen, isPreviewOpen, isInfoOpen, markedIds.size]);

  // Context Menu Helpers
  const handleItemContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    const isMarked = markedIds.has(item.id);
    if (!isMarked) {
      setSelectedId(item.id);
    }
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'card',
      targetId: item.id,
      targetPath: item.path,
      isMarkedTarget: isMarked,
    });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: SubfolderItem) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'folder',
      targetId: folder.id,
      targetPath: folder.id,
    });
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'canvas',
    });
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0f1117] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Custom Titlebar & Menu Bar */}
      <WindowBar
        onOpenFolder={handleOpenFolder}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectAll={handleSelectAll}
        onUnmarkAll={handleUnmarkAll}
        onRotateCurrent={() => handleRotate(90)}
        onRenameCurrent={handleOpenBatchRename}
        onToggleSidebar={() => setIsSidebarOpen((p) => !p)}
        onToggleInfo={() => setIsInfoOpen((p) => !p)}
        onSwitchView={setViewMode}
        language={language}
      />

      {/* 2. Top Filter Toolbar */}
      <TopToolbar
        currentPath={folderPath}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        availableCameraModels={availableCameraModels}
        selectedCameraModel={selectedCameraModel}
        onSelectCameraModel={setSelectedCameraModel}
        zoomSize={zoomSize}
        onZoomSizeChange={setZoomSize}
        isInfoOpen={isInfoOpen}
        onToggleInfo={() => setIsInfoOpen((p) => !p)}
        language={language}
        counts={counts}
      />

      {/* 3. Main Stage Layout */}
      <div className="flex-1 flex overflow-hidden relative" onContextMenu={handleCanvasContextMenu}>
        {/* Left Subfolders Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((p) => !p)}
          parentFolderName={folderPath ? folderPath.split('/').pop() || '' : ''}
          subfolders={subfolders}
          language={language}
          onCreateSubfolder={handleCreateSubfolder}
          onDropFiles={(dest, paths) => handleMoveFiles(dest, 'MOVE', paths)}
          onFolderContextMenu={handleFolderContextMenu}
        />

        {/* Center Viewport Canvas */}
        <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-[#0f1117]">
          {viewMode === 'grid' ? (
            <GridView
              items={visibleItems}
              selectedId={selectedId}
              markedIds={markedIds}
              zoomSize={zoomSize}
              cacheBust={cacheBust}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              onItemContextMenu={handleItemContextMenu}
              onToggleMark={handleToggleMark}
              onDragStart={handleDragStart}
            />
          ) : (
            <DetailTableView
              items={visibleItems}
              selectedId={selectedId}
              markedIds={markedIds}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              onItemContextMenu={handleItemContextMenu}
              onToggleMark={handleToggleMark}
              onDragStart={handleDragStart}
            />
          )}

          {/* Floating Batch Action HUD */}
          <BatchActionBar
            markedCount={markedIds.size}
            subfolders={subfolders}
            language={language}
            onRotate={() => handleRotate(90)}
            onRename={handleOpenBatchRename}
            onMoveToFolder={(dest) => handleMoveFiles(dest, 'MOVE')}
            onUnmarkAll={handleUnmarkAll}
          />
        </main>

        {/* Right Info Drawer */}
        <InfoDrawer
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
          item={currentFocusedItem}
          language={language}
        />
      </div>

      {/* 4. Modals & Overlays */}
      <QuickPreviewModal
        isOpen={isPreviewOpen}
        item={currentFocusedItem}
        currentIndex={currentFocusedIndex}
        totalCount={visibleItems.length}
        isMarked={Boolean(selectedId && markedIds.has(selectedId))}
        cacheBust={cacheBust}
        onClose={() => setIsPreviewOpen(false)}
        onNext={() => {
          if (visibleItems.length > 0) {
            const nextIdx = (currentFocusedIndex + 1) % visibleItems.length;
            setSelectedId(visibleItems[nextIdx].id);
          }
        }}
        onPrev={() => {
          if (visibleItems.length > 0) {
            const prevIdx = (currentFocusedIndex - 1 + visibleItems.length) % visibleItems.length;
            setSelectedId(visibleItems[prevIdx].id);
          }
        }}
        onToggleMark={() => currentFocusedItem && handleToggleMark(currentFocusedItem)}
        onRotate={() => handleRotate(90)}
        onOpenSystemViewer={() => currentFocusedItem && handleItemDoubleClick(currentFocusedItem)}
      />

      <BatchRenameModal
        isOpen={isRenameModalOpen}
        diffItems={diffItems}
        onClose={() => setIsRenameModalOpen(false)}
        onConfirm={handleConfirmBatchRename}
        isProcessing={isRenaming}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearCache={() => {
          setCacheBust(Date.now());
          showToast('success', 'Đã làm mới bộ nhớ đệm');
        }}
        theme={theme}
        onThemeChange={setTheme}
        language={language}
        onLanguageChange={setLanguage}
      />

      <ContextMenu
        state={contextMenu}
        markedCount={markedIds.size}
        subfolders={subfolders}
        onClose={() => setContextMenu((p) => ({ ...p, isOpen: false }))}
        onQuickPreview={() => setIsPreviewOpen(true)}
        onOpenSystemViewer={() => currentFocusedItem && handleItemDoubleClick(currentFocusedItem)}
        onToggleInfo={() => setIsInfoOpen((p) => !p)}
        onToggleMark={() => currentFocusedItem && handleToggleMark(currentFocusedItem)}
        onRotateCw={() => handleRotate(90)}
        onRotateCcw={() => handleRotate(270)}
        onBatchRename={handleOpenBatchRename}
        onMoveToFolder={(dest) => handleMoveFiles(dest, 'MOVE')}
        onCopyPath={() => {
          if (contextMenu.targetPath) {
            navigator.clipboard.writeText(contextMenu.targetPath);
            showToast('info', 'Đã sao chép đường dẫn');
          }
        }}
        onRevealInFinder={() => {
          if (contextMenu.targetPath) tauriApi.revealInFileManager(contextMenu.targetPath);
        }}
        onMoveToTrash={async () => {
          const targets = markedIds.size > 0
            ? Array.from(markedIds)
            : contextMenu.targetPath ? [contextMenu.targetPath] : [];
          if (targets.length > 0) {
            await tauriApi.moveToTrash(targets);
            showToast('success', `Đã chuyển ${targets.length} tệp vào Thùng rác`);
            if (folderPath) loadFolder(folderPath);
          }
        }}
        onSetRootFolder={(f) => loadFolder(f)}
        onCreateSubfolder={() => {
          const name = prompt('Nhập tên thư mục mới:');
          if (name) handleCreateSubfolder(name);
        }}
        onRefresh={() => folderPath && loadFolder(folderPath)}
        onUnmarkAll={handleUnmarkAll}
        onOpenOtherFolder={handleOpenFolder}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;
