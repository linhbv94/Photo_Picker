# API & Data Contract Specification: VXTriage (`_spec4_api_data`)

> **Module:** Hợp đồng Dữ liệu & Giao thức IPC (IPC Commands & Data Schemas)  
> **Tài liệu cha:** [00_system_overview.md](00_system_overview.md)  
> **Kiến trúc áp dụng:** Option C (Tauri IPC + Native Platform Adapters)  
> **Trạng thái:** Hoàn chỉnh (V1.1)  

---

## 1. Mô hình Giao tiếp (Communication Architecture)

Ứng dụng sử dụng mô hình kết hợp giữa **Tauri IPC Command (Request-Response)** cho các tác vụ điều khiển tệp tin và **Tauri Event Streaming (Push Events)** cho luồng trích xuất siêu dữ liệu EXIF chạy ngầm.

```text
[Frontend TypeScript]                                  [Backend Rust Media Core]
        │                                                       │
        │── invoke('read_directory', { path }) ────────────────>│
        │<── trả về danh sách tệp sơ bộ (Fast Scan) ────────────│
        │                                                       │
        │                                        [Worker Pool quét EXIF]
        │<── emit('exif_chunk_stream', chunk_items) ────────────│
        │<── emit('exif_chunk_stream', chunk_items) ────────────│
        │                                                       │
        │── invoke('open_native_preview', { path }) ───────────>│
        │                                        [Platform Adapter Dispatch]
        │                                        • macOS: QLPreviewPanel
        │                                        • Windows: Peek HUD Window
        │                                                       │
        │── invoke('get_thumbnail_url', { path, size }) ───────>│
        │<── trả về asset URL / cached thumbnail path ──────────│
        │                                                       │
        │── invoke('rotate_lossless', { paths, degrees }) ─────>│
        │                                        [Lossless DCT + Platform Notify]
        │<── trả về kết quả xoay + bust cache token ────────────│
        │                                                       │
        │── invoke('preview_batch_rename', { paths }) ─────────>│
        │<── trả về danh sách RenameDiff ───────────────────────│
        │                                                       │
        │── invoke('apply_batch_rename', { diffs }) ───────────>│
        │<── trả về kết quả đổi tên tệp thực tế ────────────────│
```

---

## 2. Các Cấu trúc Dữ liệu Cốt lõi (Core Data Schemas)

### 2.1. Đối tượng Tệp tin (`FileItem`)

```typescript
export interface FileItem {
  id: string;                    // Đường dẫn tuyệt đối duy nhất của tệp
  path: string;                  // /Users/vic/Pictures/Trip/DSC001.JPG
  filename: string;              // DSC001.JPG
  extension: string;             // jpg | heic | png | dng | raw...
  size_bytes: number;            // 24510200
  modified_timestamp: number;    // Unix timestamp thời gian sửa đổi (mtime)
  created_timestamp: number;     // Unix timestamp thời gian tạo tệp (btime)
  thumbnail_url?: string;        // URL thumbnail đã cache (asset://...)
  exif: ExifMetadata | null;     // null khi chưa parse xong, có dữ liệu khi worker stream về
}
```
*(Lưu ý: Trạng thái đánh dấu `is_marked` được quản lý độc lập tại `marked_ids: Set<string>` của UI Store, không lưu trong entity `FileItem`).*

### 2.2. Đối tượng Siêu dữ liệu EXIF (`ExifMetadata`)

```typescript
export interface ExifMetadata {
  date_taken: string | null;      // ISO 8601: "2026-10-07T08:30:15"
  sub_sec_time: string | null;    // Phân đoạn mili/micro giây chụp burst: "420"
  camera_make: string | null;     // "Sony", "Canon", "Apple", "Nikon"
  camera_model: string | null;    // "ILCE-7M4", "iPhone 15 Pro", "EOS R6"
  lens_model: string | null;      // "FE 24-70mm F2.8 GM II"
  focal_length: string | null;    // "35 mm" (hoặc "52 mm equiv")
  aperture_f_number: number | null; // 2.8 (tương đương f/2.8)
  exposure_time: string | null;   // "1/500", "1/60", "2.5"
  iso_rating: number | null;      // 100, 3200, 6400
  pixel_width: number | null;     // 7008
  pixel_height: number | null;    // 4672
  orientation: number;            // 1 = Normal, 6 = Rotate 90 CW, 8 = Rotate 270 CW...
  software: string | null;        // "Lightroom", "Snapseed" hoặc rỗng nếu ảnh gốc
  color_space: string | null;     // "sRGB", "Display P3", "Adobe RGB"
  white_balance: string | null;   // "Auto", "Daylight", "Custom"
  exposure_mode: string | null;   // "Manual", "Aperture Priority", "Auto"
  has_gps: boolean;               // true nếu có tọa độ GPS hợp lệ
  gps_latitude?: number | null;   // 11.9404
  gps_longitude?: number | null;  // 108.4353
  gps_altitude?: number | null;   // 1500 (mét)
}
```

### 2.3. Cấu trúc Cây Thư mục Con (`SubfolderItem`)

```typescript
export interface SubfolderItem {
  id: string;                     // Đường dẫn tuyệt đối của folder con
  name: string;                   // Tên folder: "Selects", "Raw"
  parent_path: string;            // Đường dẫn folder cha
  direct_children_count: number;  // Số lượng folder con bên trong
  file_count?: number;            // Số lượng file bên trong
}
```

---

## 3. Danh mục Lệnh IPC (Tauri IPC Commands)

### 3.1. `read_directory` — Quét Danh sách Tệp Thư mục
- **Mô tả:** Quét nhanh toàn bộ các tệp ảnh hợp lệ trong thư mục cha đang chọn và kích hoạt luồng background trích xuất EXIF.
- **Request Payload:**
  ```typescript
  interface ReadDirectoryRequest {
    folder_path: string;
    recursive: boolean;          // Mặc định false (chỉ duyệt folder hiện tại)
  }
  ```
- **Response Payload:**
  ```typescript
  interface ReadDirectoryResponse {
    scan_id: string;             // UUID định danh phiên quét (dùng để hủy nếu chuyển thư mục khác)
    folder_path: string;
    total_files: number;
    files: FileItem[];           // Danh sách file cơ bản (chưa có trường exif chi tiết)
  }

  interface ExifChunkStreamPayload {
    scan_id: string;             // Trùng với scan_id của phiên hiện tại (bỏ qua nếu cũ)
    is_last_chunk: boolean;      // true khi hoàn tất toàn bộ tiến trình quét ngầm
    items: Array<{
      file_id: string;
      exif: ExifMetadata;
    }>;
  }
  ```

### 3.2. `open_native_preview` — Kích hoạt Xem nhanh Nền tảng (Spacebar)
- **Mô tả:** Điều phối mở cửa sổ Quick Preview tương ứng theo hệ điều hành hiện tại.
- **Request Payload:**
  ```typescript
  interface OpenPreviewRequest {
    file_path: string;
  }
  ```
- **Hành vi phía Native:**
  - *macOS:* Kích hoạt Swift Plugin mở Native `QLPreviewPanel`.
  - *Windows:* Mở Frameless Peek HUD Window với hiệu ứng Mica/Acrylic.

### 3.3. `open_in_system_viewer` — Mở bằng Trình xem Mặc định của Hệ điều hành (Double Click / Enter)
- **Mô tả:** Mở tệp ảnh bằng ứng dụng mặc định được cấu hình trong hệ điều hành (Preview.app trên macOS, Windows Photos trên Windows).
- **Request Payload:**
  ```typescript
  interface OpenInSystemViewerRequest {
    file_path: string;
  }
  ```
- **Hành vi Backend:** Gọi `open::that(path)` hoặc `tauri-plugin-opener` tương ứng trên OS.

### 3.4. `get_thumbnail_url` — Yêu cầu Thumbnail từ Priority Pipeline
- **Request Payload:**
  ```typescript
  interface GetThumbnailRequest {
    file_path: string;
    target_size: number;         // 160 | 320
  }
  ```
- **Response Payload:**
  ```typescript
  interface GetThumbnailResponse {
    thumbnail_url: string;       // asset://... hoặc data URL
    is_cached: boolean;
  }
  ```

### 3.4. `rotate_lossless` — Xoay Ảnh Lossless Cập nhật Filesystem & Cache OS
- **Request Payload:**
  ```typescript
  interface RotateLosslessRequest {
    file_paths: string[];
    degrees: 90 | 180 | 270;
  }
  ```
- **Response Payload:**
  ```typescript
  interface RotateLosslessResponse {
    success_count: number;
    failed_paths: Array<{ path: string; error_message: string }>;
    cache_bust_timestamp: number; // Timestamp để frontend cập nhật query URL (?v=...)
  }
  ```

### 3.5. `preview_batch_rename` & `apply_batch_rename` — Đổi tên Hàng loạt An toàn
- **Request `preview_batch_rename`:**
  ```typescript
  interface PreviewRenameRequest {
    file_paths: string[];
    naming_pattern: "DATE_TIME_SEQ"; // YYYYMMDD_HHMM kèm _01, _02
    fallback_to_mtime: boolean;
  }
  ```
- **Response `preview_batch_rename`:**
  ```typescript
  interface RenameDiffItem {
    original_path: string;
    original_filename: string;
    new_filename: string;
    has_conflict: boolean;
    conflict_resolution?: string;
  }
  ```
- **Request `apply_batch_rename`:**
  ```typescript
  interface ApplyRenameRequest {
    items: RenameDiffItem[];
  }
  ```

### 3.6. `move_or_copy_files` — Di chuyển / Sao chép Tệp An toàn
- **Request Payload:**
  ```typescript
  interface MoveOrCopyRequest {
    source_paths: string[];
    destination_folder: string;
    action_type: "MOVE" | "COPY";
    conflict_strategy: "OVERWRITE" | "AUTO_RENAME" | "SKIP";
  }
  ```

---

## 4. Định dạng Mã Lỗi Hệ thống (Standard Error Codes)

```typescript
export enum AppErrorCode {
  FOLDER_NOT_FOUND = "ERR_FOLDER_NOT_FOUND",
  PERMISSION_DENIED = "ERR_PERMISSION_DENIED",
  READ_ONLY_FILESYSTEM = "ERR_READ_ONLY_FS",
  EXIF_CORRUPTED = "ERR_EXIF_CORRUPTED",
  LOSSLESS_UNSUPPORTED = "ERR_LOSSLESS_UNSUPPORTED",
  FILE_LOCKED_BY_OS = "ERR_FILE_LOCKED_BY_OS",
  RENAME_COLLISION = "ERR_RENAME_COLLISION",
  CROSS_VOLUME_FAILED = "ERR_CROSS_VOLUME_FAILED"
}
```
