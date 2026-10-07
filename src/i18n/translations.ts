export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Top menu
    file: 'Tệp',
    edit: 'Chỉnh sửa',
    view: 'Xem',
    window: 'Cửa sổ',
    help: 'Trợ giúp',
    openFolder: 'Mở thư mục...',
    revealInFinder: 'Hiện trong Finder / Explorer',
    settings: 'Cài đặt...',
    about: 'Về VXPhotos',
    selectAll: 'Chọn tất cả',
    invertSelection: 'Đảo chọn',
    deselectAll: 'Bỏ chọn tất cả',
    batchRename: 'Đổi tên hàng loạt...',
    losslessRotate90: 'Xoay 90° xuôi',
    toggleSidebar: 'Bật/tắt thanh thư mục',
    toggleInfoPanel: 'Bật/tắt thông tin EXIF',
    refreshFolder: 'Làm mới thư mục',
    close: 'Đóng',

    // Toolbar
    filterAll: 'Tất cả ảnh',
    filterCamera: 'Chỉ ảnh máy cơ',
    filterScreenshot: 'Ảnh chụp màn hình',
    allCameras: 'Tất cả dòng máy',
    viewGrid: 'Lưới ảnh',
    viewDetail: 'Danh sách chi tiết',
    searchPlaceholder: 'Tìm theo tên, hãng máy, thông số...',
    sortName: 'Tên tệp',
    sortDate: 'Ngày chụp',
    sortSize: 'Dung lượng',

    // Sidebar
    subfolders: 'Thư mục con',
    newFolder: 'Thư mục mới',
    newFolderPrompt: 'Tên thư mục mới...',
    dropHere: 'Thả vào đây',
    emptySubfolders: 'Chưa có thư mục con',
    cancel: 'Hủy',
    create: 'Tạo',

    // Batch Action Bar
    selectedCount: 'ĐÃ CHỌN {count} ẢNH',
    rotate90: 'Xoay 90°',
    batchRenameBtn: 'Đổi tên hàng loạt',
    moveTo: 'Chuyển vào...',
    copyTo: 'Sao chép vào...',
    cancelSelection: 'Hủy chọn tất cả (Esc)',
    chooseSubfolder: 'Chọn thư mục đích:',

    // Info Panel
    exifInfo: 'Thông tin tệp & EXIF',
    filename: 'Tên tệp',
    size: 'Dung lượng',
    resolution: 'Độ phân giải',
    dateTaken: 'Ngày chụp',
    camera: 'Máy ảnh',
    lens: 'Ống kính',
    exposure: 'Phơi sáng',
    focalLength: 'Tiêu cự',
    quickActions: 'Thao tác nhanh',
    openInSystem: 'Mở bằng ứng dụng mặc định',

    // Settings Modal
    settingsTitle: 'Cài đặt VXPhotos',
    tabGeneral: 'Chung & Giao diện',
    tabShortcuts: 'Phím tắt',
    tabAbout: 'Giới thiệu',
    themeLabel: 'Giao diện (Theme)',
    themeDark: 'Tối chuẩn (Slate)',
    themeBlack: 'OLED Black',
    themeLight: 'Sáng (Light)',
    themeSystem: 'Theo hệ điều hành',
    langLabel: 'Ngôn ngữ (Language)',
    langVi: '🇻🇳 Tiếng Việt',
    langEn: '🇺🇸 English',
    version: 'Phiên bản',

    // Toasts
    folderLoaded: 'Đã tải {count} ảnh từ thư mục',
    movedSuccess: 'Đã chuyển {count} ảnh vào thư mục',
    copiedSuccess: 'Đã sao chép {count} ảnh vào thư mục',
    rotatedSuccess: 'Đã xoay {count} ảnh',
    createdSubfolder: 'Đã tạo thư mục: {name}',
  },
  en: {
    // Top menu
    file: 'File',
    edit: 'Edit',
    view: 'View',
    window: 'Window',
    help: 'Help',
    openFolder: 'Open Folder...',
    revealInFinder: 'Reveal in Finder / Explorer',
    settings: 'Settings...',
    about: 'About VXPhotos',
    selectAll: 'Select All',
    invertSelection: 'Invert Selection',
    deselectAll: 'Deselect All',
    batchRename: 'Batch Rename...',
    losslessRotate90: 'Rotate 90° Clockwise',
    toggleSidebar: 'Toggle Subfolder Sidebar',
    toggleInfoPanel: 'Toggle EXIF Info Panel',
    refreshFolder: 'Refresh Folder',
    close: 'Close',

    // Toolbar
    filterAll: 'All Photos',
    filterCamera: 'Camera Only',
    filterScreenshot: 'Screenshots',
    allCameras: 'All Cameras',
    viewGrid: 'Grid View',
    viewDetail: 'Detail View',
    searchPlaceholder: 'Search by filename, camera, specs...',
    sortName: 'Filename',
    sortDate: 'Date Taken',
    sortSize: 'File Size',

    // Sidebar
    subfolders: 'Subfolders',
    newFolder: 'New Folder',
    newFolderPrompt: 'New folder name...',
    dropHere: 'Drop Here',
    emptySubfolders: 'No subfolders yet',
    cancel: 'Cancel',
    create: 'Create',

    // Batch Action Bar
    selectedCount: '{count} SELECTED',
    rotate90: 'Rotate 90°',
    batchRenameBtn: 'Batch Rename',
    moveTo: 'Move to...',
    copyTo: 'Copy to...',
    cancelSelection: 'Deselect all (Esc)',
    chooseSubfolder: 'Select destination folder:',

    // Info Panel
    exifInfo: 'File Info & EXIF',
    filename: 'Filename',
    size: 'Size',
    resolution: 'Resolution',
    dateTaken: 'Date Taken',
    camera: 'Camera',
    lens: 'Lens',
    exposure: 'Exposure',
    focalLength: 'Focal Length',
    quickActions: 'Quick Actions',
    openInSystem: 'Open in Default Viewer',

    // Settings Modal
    settingsTitle: 'VXPhotos Settings',
    tabGeneral: 'General & Appearance',
    tabShortcuts: 'Keyboard Shortcuts',
    tabAbout: 'About',
    themeLabel: 'Appearance (Theme)',
    themeDark: 'Standard Slate Dark',
    themeBlack: 'OLED Pure Black',
    themeLight: 'Light Clean',
    themeSystem: 'Follow System OS',
    langLabel: 'Language',
    langVi: '🇻🇳 Tiếng Việt',
    langEn: '🇺🇸 English',
    version: 'Version',

    // Toasts
    folderLoaded: 'Loaded {count} photos from folder',
    movedSuccess: 'Moved {count} photos to destination folder',
    copiedSuccess: 'Copied {count} photos to destination folder',
    rotatedSuccess: 'Rotated {count} photos',
    createdSubfolder: 'Created folder: {name}',
  },
};

export type TranslationKey = keyof typeof translations['vi'];

export function t(key: TranslationKey, lang: Language = 'vi', params?: Record<string, string | number>): string {
  const dict = translations[lang] || translations['vi'];
  let str = dict[key] || translations['vi'][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return str;
}
