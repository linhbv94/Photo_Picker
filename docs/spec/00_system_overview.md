# System Specification Overview: Photo Picker / VXTriage (`_spec0_system`)

> **Tên sản phẩm:** VXTriage (Photo Picker & Media Triage Utility)  
> **Thư mục dự án:** `photo_picker`  
> **Phiên bản tài liệu:** 1.1.0 (Architecture Option C — Hybrid Core & Native Platform Adapters)  
> **Ngày cập nhật:** 2026-10-07  
> **Nền tảng mục tiêu:** macOS (Apple Silicon & Intel) + Windows 11+ (x64)  
> **Mô hình Kiến trúc:** Kiến trúc 3 tầng phân định (Option C):
> - **Tầng 1 (UI Shell — 95% Dùng chung):** Tauri v2 WebView (React 18 + TypeScript + Tailwind CSS) tuân thủ [master_theme.md](../../../master_theme.md).
> - **Tầng 2 (Media Core — 100% Dùng chung):** Rust Native Engine (Fast File Scanner, Header-only EXIF, Lossless JPEG DCT Transformer, Atomic Renamer & Operation Journal).
> - **Tầng 3 (Platform Adapter — ~5% Đặc thù OS):**
>   - *Trên macOS:* Tauri Swift Plugin gọi Native `QLPreviewPanel` (Quick Look chuẩn Mac), `ImageIO/QLThumbnailGenerator`, và `NSWorkspace.noteFileSystemChanged`.
>   - *Trên Windows:* Cửa sổ Frameless Peek-like HUD Window, Windows Shell API `IShellItemImageFactory` (qua `windows-rs`), và `SHChangeNotify`.

---

## 1. Bối cảnh & Tôn chỉ Sản phẩm (Product Vision)

### 1.1. Nỗi đau thực tế (The Real Pain Point)
Trên Windows File Explorer, người dùng có thể bật chế độ Detail View với nhiều cột thuộc tính chi tiết (Date Taken, Camera Maker, Camera Model, Lens, ISO...). Điều này cho phép lọc và gom nhóm cực nhanh các tệp ảnh chụp từ máy ảnh/điện thoại thật để phân biệt với ảnh chụp màn hình (screenshots), ảnh tải từ mạng xã hội (Facebook, Telegram, Zalo) hay ảnh đồ họa.

Ngược lại, **macOS Finder** rất hạn chế về các trường siêu dữ liệu (metadata columns) tùy biến trong List view. Thao tác lọc ảnh, phân loại ảnh vào các thư mục con, xoay ảnh mà không làm suy giảm chất lượng, hoặc đổi tên hàng loạt theo chuẩn ngày chụp (YYYYMMDD_HHMM_xx) trên Finder đòi hỏi phải mở nhiều ứng dụng rời rạc (Preview, Photos, Terminal script) rất cồng kềnh.

### 1.2. Mục tiêu của VXTriage
VXTriage được thiết kế như một **tiện ích desktop siêu nhẹ (Lightweight Triage & Culling Utility)** giúp người dùng:
1. **Duyệt và phân loại siêu tốc (Rapid Ingestion & Culling):** Mở một thư mục cha, hiển thị cây thư mục con gọn gàng ở Left Sidebar, chuyển đổi linh hoạt giữa Grid View (tùy biến kích thước) và Detail Table View (đầy đủ cột EXIF).
2. **Tách bạch Selection & Marking:** Select để preview nhanh (Spacebar chuẩn native hệ điều hành), Mark để thực hiện các thao tác hàng loạt (Batch Actions).
3. **Phân biệt nguồn ảnh tức thì:** Lọc và sắp xếp 1-click giữa ảnh có metadata máy ảnh thật và ảnh không có EXIF / Screenshot.
4. **Xoay ảnh Lossless đồng bộ hệ thống:** Xoay ảnh trực tiếp trên filesystem bằng thuật toán Lossless DCT, ép Finder (trên macOS) và Explorer (trên Windows) làm mới thumbnail ngay lập tức mà không suy hao chất lượng ảnh.
5. **Kéo thả & Đổi tên hàng loạt an toàn:** Hỗ trợ Shift + Click chọn dải (Range Marking), kéo thả dọn ảnh vào các folder con cùng cấp, và đổi tên theo chuẩn ngày giờ chụp kèm cơ chế Two-phase an toàn chống xung đột.

---

## 2. Phân tích Các Phần Khó Nhất & Giải pháp Kiến trúc (Difficulty Matrix)

```text
┌────────────────────────────────────────────────────────────────────────┐
│               MA TRẬN ĐỘ KHÓ KỸ THUẬT (DIFFICULTY MATRIX)              │
├────────────────────────┬─────────────┬─────────────────────────────────┤
│ Hạng mục               │ Mức độ khó  │ Rủi ro / Điểm nghẽn chính       │
├────────────────────────┼─────────────┼─────────────────────────────────┤
│ 1. Lossless Rotation   │ ★★★★★ (9/10)│ Finder cache cũ, nén vỡ pixel   │
│ 2. EXIF Read at Scale  │ ★★★★☆ (8/10)│ Đơ UI khi quét folder 10k ảnh   │
│ 3. Shift-Click Range   │ ★★★★☆ (7/10)│ Sai lệch index khi sort/filter  │
│ 4. Thumbnail & Virtual │ ★★★★☆ (7/10)│ WebView tràn RAM nếu load gốc   │
│ 5. Atomic Batch Rename │ ★★★☆☆ (6/10)│ Xung đột tên, thiếu Date Taken  │
└────────────────────────┴─────────────┴─────────────────────────────────┘
```

### Điểm khó 1: Xoay ảnh Lossless & Buộc Finder / Explorer cập nhật thumbnail (Độ khó: 9/10)
* **Vấn đề:** 
  - Nếu chỉ xoay bằng CSS trên frontend thì file thực tế không đổi.
  - Nếu chỉ cập nhật tag EXIF `Orientation` (ví dụ từ 1 sang 6 hoặc 8), macOS QuickLook và Finder thường lưu thumbnail cũ trong cache hệ thống (`com.apple.quicklook.ThumbnailsAgent`), khiến người dùng tưởng app chưa xoay.
  - Nếu mở ảnh và nén lại (re-encode JPEG), ảnh sẽ bị giảm chất lượng (lossy degradation) và mất các trường EXIF đặc thù của hãng máy ảnh (MakerNotes).
* **Giải pháp kiến trúc (Option C):**
  - **Với JPEG:** Sử dụng **Lossless DCT Transformation** (thao tác trực tiếp trên các khối DCT tương tự `jpegtran` / crate Rust `turbojpeg` / `img-parts`) để đảo pixel mà không giải mã/nén lại.
  - Chuẩn hóa lại EXIF Orientation về `1` (Normal) sau khi xoay vật lý.
  - **Đồng bộ OS Cache:**
    - *Trên macOS:* Rust gọi Native Platform Adapter (`NSWorkspace.shared.noteFileSystemChanged` hoặc chạm mtime) để buộc QuickLook daemon hủy cache thumbnail cũ.
    - *Trên Windows:* Rust gọi trực tiếp Win32 API `SHChangeNotify(SHCNE_UPDATEITEM, ...)` để Windows Explorer nhấp nháy làm mới thumbnail ngay tức thì.

### Điểm khó 2: Đọc EXIF & Priority Scheduler cho hàng ngàn tệp (Độ khó: 8/10)
* **Vấn đề:** 
  - Folder có thể chứa 2,000 đến 10,000 tệp ảnh từ thẻ nhớ (JPEG, HEIC, RAW). Nếu đọc toàn bộ file hoặc đọc tuần tự trên main thread, ứng dụng sẽ bị đóng băng.
* **Giải pháp kiến trúc:**
  - Rust Backend chỉ đọc **phần đầu tệp (Header buffer 64KB - 128KB)** để parse cấu trúc EXIF/TIFF, tuyệt đối không nạp toàn bộ byte ảnh vào RAM.
  - Thiết kế **Priority Scheduler (2 hàng đợi riêng biệt)**:
    - *Hàng đợi 1 (Ưu tiên cao - Viewport):* Decode thumbnail và nạp trước cho các ảnh đang nhìn thấy trên màn hình.
    - *Hàng đợi 2 (Ưu tiên thấp - Background):* Quét EXIF header ngầm theo từng lô (Batch chunk 50 - 100 items/packet) và stream về Frontend qua sự kiện `exif_chunk_stream`.
  - Bộ nhớ đệm in-memory LRU Cache gắn với `file_path + mtime + size` để không parse lại các file chưa thay đổi.

### Điểm khó 3: Quản lý trạng thái độc lập giữa Selection và Marking + Shift-Click Range (Độ khó: 7/10)
* **Vấn đề:**
  - Tách bạch 2 hành vi: **Select** (1 item focus cho phím Space preview) và **Mark** (tập hợp hàng loạt để move/rename).
  - Khi danh sách đang bị lọc (ví dụ chỉ hiện ảnh Sony) hoặc sort theo ngày, **chỉ số hiển thị (Display index) khác hoàn toàn chỉ số mảng file gốc**. Nếu tính Shift-Click trên mảng gốc sẽ mark nhầm các ảnh đang bị ẩn.
* **Giải pháp kiến trúc:**
  - Lưu trữ state: `selected_id: string | null` (duy nhất 1 item) và `marked_ids: Set<string>` (tập hợp ID độc lập).
  - Duy trì mốc `last_marked_anchor_id`. Khi Shift + Click vào item B, hệ thống tìm vị trí của A và B trên **danh sách hiển thị hiện hành (current visible/sorted list)**, lấy toàn bộ các item trong khoảng `[min(idxA, idxB) .. max(idxA, idxB)]` và gộp vào `marked_ids`.

### Điểm khó 4: Thumbnail Pipeline chuyên dụng & Virtualized Grid (Độ khó: 7/10)
* **Vấn đề:**
  - Giao thức `asset://` của WebView chỉ vận chuyển byte nguyên bản. Nếu nạp ảnh gốc 24MP - 60MP vào các thẻ thumbnail, WebView sẽ cắn nhiều GB RAM và crash GPU.
* **Giải pháp kiến trúc:**
  - **Tầng Adapter sinh thumbnail:**
    - *Trên macOS:* Tận dụng phần cứng qua `ImageIO` (`CGImageSourceCreateThumbnailAtIndex`) hoặc `QLThumbnailGenerator`.
    - *Trên Windows:* Tận dụng Windows Shell API `IShellItemImageFactory::GetImage` thông qua `windows-rs`.
    - *Dự phòng Core Rust:* Tạo thumbnail nhẹ (~320px WebP) qua `turbojpeg` và lưu tạm trong cache.
  - Virtualized Grid 2D tính toán theo tỷ lệ ô động kết hợp zoom slider (80px - 360px), giải phóng DOM nodes nằm ngoài viewport.

### Điểm khó 5: Đổi tên hàng loạt an toàn (Operation Journal & 2-Phase Safe Rename) (Độ khó: 6/10)
* **Vấn đề:**
  - Burst-shot cùng 1 phút gây trùng tên `YYYYMMDD_HHMM`. Nhiều ảnh không có EXIF Date Taken.
  - Đổi tên trực tiếp có thể gây ghi đè chéo hoặc lỗi giữa chừng làm nửa danh sách bị đổi.
* **Giải pháp kiến trúc:**
  - Gom nhóm cùng phút, sort theo sub-second hoặc tên gốc để sinh suffix `_01`, `_02`... Fallback về `File Modified Time` (mtime) nếu thiếu EXIF.
  - Backend tự thẩm định danh sách đổi tên (không tin tưởng thuần túy payload client).
  - **Two-phase Rename với Operation Journal:** Đổi tên sang file tạm `.tmp_uuid` trước, sau đó mới đổi sang tên đích chính thức; hỗ trợ rollback nếu xảy ra sự cố I/O.

---

## 3. Bản đồ Bộ Hồ sơ Đặc tả (Specification Index)

Toàn bộ các tài liệu đặc tả chi tiết của VXTriage:

| Tài liệu | Mã định danh | Phạm vi & Trách nhiệm chính |
| :--- | :--- | :--- |
| [01_business_process.md](01_business_process.md) | `_spec1_business_process` | Quy trình Triage từ thẻ nhớ/folder, Swimlane phân loại Camera vs Non-camera, Ma trận quyết định di chuyển/sao chép. |
| [02_feature_flow.md](02_feature_flow.md) | `_spec2_feature_flow` | State Machine cho Selection vs Marking, Thuật toán Shift-Click Range, Luồng Lossless Rotation, Luồng phân giải Rename hàng loạt. |
| [03_ui_wireframe.md](03_ui_wireframe.md) | `_spec3_ui_wireframe` | Layout Desktop theo VX Theme, Left Sidebar Tree, Toolbar chuyển Grid/Detail, Quick Preview Spacebar, Info Drawer (i). |
| [04_api_data.md](04_api_data.md) | `_spec4_api_data` | Hợp đồng IPC giữa Tauri Rust & React, Cấu trúc FileItem & ExifMetadata, Batch Commands, Streaming Events. |
| [05_qa_acceptance.md](05_qa_acceptance.md) | `_spec5_qa_acceptance` | Tiêu chuẩn nghiệm thu Gherkin (AC-01 → AC-10), Ma trận Edge Cases (thư mục 10k file, file trùng tên, EXIF hỏng, phím tắt). |
| [06_demo_presentation.md](06_demo_presentation.md) | `_spec6_demo_presentation` | Kịch bản Demo DoD từng bước, Hướng dẫn tạo thư mục Fixtures kiểm thử thực tế. |

---

## 4. Kiến trúc Hệ thống 3 Tầng Phân định (Option C Architecture)

```text
┌────────────────────────────────────────────────────────────────────────┐
│               TẦNG 1: UI SHELL (REACT 18 + TYPESCRIPT)                │
│                         (95% Dùng chung mã nguồn)                      │
├────────────────────────────────────────────────────────────────────────┤
│ • Virtualized Grid View (Dynamic Zoom Slider 80px - 360px)             │
│ • Detail Table View (Đầy đủ cột EXIF, sort đa tiêu chí)                │
│ • Compact Left Sidebar (Cây thư mục con không tốn diện tích ngang)     │
│ • Selection Manager: Focus Cursor vs. Marked Set (Shift-Click Range)   │
│ • Batch Action HUD & Dry-Run Rename Modal                              │
├────────────────────────────────────────────────────────────────────────┤
│                    TẦNG 2: MEDIA CORE (RUST NATIVE)                    │
│                        (100% Dùng chung mã nguồn)                      │
├────────────────────────────────────────────────────────────────────────┤
│ • Fast Directory Walker & File Enumeration                             │
│ • Header-Only EXIF Parser (64KB Header Buffer: kamadak-exif/nom-exif)  │
│ • Lossless JPEG DCT Transformation Engine                              │
│ • Priority Scheduler (Hàng đợi Viewport Thumbnail vs Background EXIF)  │
│ • Operation Journal & Two-Phase Atomic Renamer / Cross-Volume Move     │
├────────────────────────────────────────────────────────────────────────┤
│               TẦNG 3: PLATFORM ADAPTERS (~5% Mã nguồn)                 │
├────────────────────────────────────┬───────────────────────────────────┤
│        Phía macOS (Swift Plugin)   │    Phía Windows (Win32 Adapter)   │
│ • Bấm Space: Gọi Native            │ • Bấm Space: Mở Frameless         │
│   QLPreviewPanel (Quick Look thật) │   Floating HUD (PowerToys Peek)   │
│ • Sinh Thumbnail: Apple ImageIO    │ • Sinh Thumbnail: Windows Shell   │
│   / QLThumbnailGenerator           │   IShellItemImageFactory          │
│ • Cache Notify: noteFileSystem-    │ • Cache Notify: Win32 API         │
│   Changed để Finder cập nhật ngay  │   SHChangeNotify(SHCNE_UPDATEITEM)│
└────────────────────────────────────┴───────────────────────────────────┘
```

---

## 5. Lộ trình Phát triển & Phân định Phạm vi (Scope Boundaries)

Nhằm đảm bảo an toàn tuyệt đối và tính khả thi cao trong triển khai thực tế:

### 5.1. Phạm vi Cốt lõi Giai đoạn V1 (Core V1 — Ready to Build)
- [x] Quét thư mục cha & ánh xạ cây thư mục con sang Left Sidebar.
- [x] Hiển thị Grid View (Virtualization 2D kèm Zoom Slider 80px - 360px) & Detail Table View (cột EXIF).
- [x] Lọc nhanh nguồn ảnh: Camera Maker / Model vs. Screenshots / Ảnh mạng xã hội.
- [x] Tách bạch Focus Cursor (`selected_id`) và Tuyển chọn hàng loạt (`marked_ids`).
- [x] Shift + Click Range Marking trên danh sách hiển thị đã qua lọc/sắp xếp.
- [x] Xem nhanh tức thì (Spacebar Quick Preview) & Double Click mở System Default Viewer.
- [x] Xoay ảnh Lossless DCT (bảo toàn khối MCU cho JPEG) kèm thông báo cache invalidation cho OS Finder/Explorer.
- [x] Kéo thả di chuyển tệp an toàn (Safe Cross-Volume Move).
- [x] Đổi tên hàng loạt `YYYYMMDD_HHMM_xx` có kiểm tra xung đột và Two-phase atomic rename.

### 5.2. Hạng mục Mở rộng Giai đoạn V1.1 (Post-V1 Backlog)
- [ ] Tùy biến sâu bộ phím tắt trong Settings Modal.
- [ ] Cơ chế Undo / Redo đa cấp cho tác vụ di chuyển tệp tin.
- [ ] Hỗ trợ mẫu đổi tên tùy biến phức tạp (Regex / Custom token replacement).
- [ ] Tích hợp tính năng xóa vĩnh viễn (Secure Erase) ngoài Move to Trash thông thường.
