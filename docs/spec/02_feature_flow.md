# Feature Flow Specification: VXTriage (`_spec2_feature_flow`)

> **Module:** Luồng Xử lý Tính năng & Máy Trạng thái (Logic & State Machine Specs)
> **Tài liệu cha:** [00_system_overview.md](00_system_overview.md)
> **Kiến trúc áp dụng:** Option C (Tauri React Shell + Rust Media Core + Native Platform Adapters)
> **Trạng thái:** Hoàn chỉnh (V1.1)

---

## 1. Máy Trạng thái: Selection vs. Marking (Dual-Selection State Model)

VXTriage **tách bạch hoàn toàn giữa Selection và Marking**:
- **Selection (`selected_id`):** Đại diện cho con trỏ tiêu điểm hiện tại (Active Cursor/Focus Item). Dùng cho điều hướng bằng bàn phím (phím mũi tên), xem chi tiết ở thanh Info Panel `(i)`, và kích hoạt xem nhanh bằng phím `Space`. Luôn luôn chỉ có tối đa 1 item được chọn.
- **Marking (`marked_ids`):** Đại diện cho tập hợp các tệp được gắn cờ (Marked Set) trong UI Store để thực hiện các thao tác xử lý hàng loạt (Batch Actions: Move, Copy, Rotate, Rename, Delete). Tuyệt đối không lưu cờ `is_marked` trong struct dữ liệu gốc để tránh lệch pha (state desync).

### 1.1. Sơ đồ Chuyển đổi Trạng thái (State Diagram)

```text
       ┌────────────────────────────────────────────────────────┐
       │                  Trạng thái Ban đầu                     │
       │        selected_id = null, marked_ids = Empty          │
       └───────────────────────────┬────────────────────────────┘
                                   │
              Click vào thẻ ảnh    │    Click vào nút Mark / Checkbox
           (hoặc bấm phím mũi tên) │    (hoặc bấm phím 'M')
                                   ▼
       ┌───────────────────────────┴────────────────────────────┐
       │                     Thẻ được Focus                     │
       │           selected_id = item_A (Focus viền Cyan)       │
       │                   marked_ids = [Chưa đổi]              │
       └─────────────┬─────────────────────────────┬────────────┘
                     │                             │
    Nhấn Spacebar    │                             │ Giữ phím Shift + Click
    (Bật Preview)    │                             │ vào item_B khác
                     ▼                             ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│     Quick Preview Dispatch       │ │       Range Marking Kích hoạt    │
│  - macOS: Kích hoạt Native       │ │  - Tính dải index trên danh sách │
│    QLPreviewPanel của hệ thống   │ │    đang hiển thị (visible list)  │
│  - Windows: Mở Frameless Peek HUD│ │  - marked_ids gộp thêm dải này   │
│  - Phím mũi tên ←/→ đổi ảnh      │ │  - last_marked_anchor_id = B     │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

### 1.2. Thuật toán Shift + Click Range Marking Chuẩn xác
Khi người dùng bấm vào thẻ ảnh A (hoặc tick mark A), hệ thống ghi nhận `last_marked_anchor_id = A`.
Khi người dùng giữ phím `Shift` và click vào thẻ ảnh B:
1. Lấy mảng danh sách các tệp **đang được hiển thị trên màn hình hiện tại** (`visible_items`, danh sách này đã được lọc qua Filter và sắp xếp qua Sort).
2. Tìm chỉ số (index) của A và B trên mảng `visible_items`:
   - `index_A = visible_items.findIndex(item => item.id === last_marked_anchor_id)`
   - `index_B = visible_items.findIndex(item => item.id === B.id)`
3. Nếu cả 2 index đều hợp lệ:
   - `start = Math.min(index_A, index_B)`
   - `end = Math.max(index_A, index_B)`
   - Lấy toàn bộ các phần tử từ `start` đến `end`: `range_ids = visible_items.slice(start, end + 1).map(item => item.id)`
   - Gộp `range_ids` vào `marked_ids` (hợp nhất Set): `new_marked = new Set([...marked_ids, ...range_ids])`.
4. Cập nhật `last_marked_anchor_id = B.id` cho lần click Shift tiếp theo.

> **Quy tắc ổn định hiển thị:** Khi background stream metadata EXIF về, Store chỉ cập nhật metadata theo `file_id` mà **không tự ý kích hoạt sắp xếp lại (re-sort)** nhằm bảo vệ tính toàn vẹn của danh sách hiển thị trong lúc người dùng đang thao tác Shift-Click.

### 1.3. Ma trận Thao tác Chuột & Phím tắt Xem Ảnh (Interaction Matrix)

| Thao tác | Phạm vi tác động | Hành vi Hệ thống | Phím tắt tương đương |
| :--- | :--- | :--- | :--- |
| **Single Click** | 1 ô ảnh / hàng bảng | Đặt `selected_id` (Focus viền Cyan). Nếu click vào Checkbox: toggle `marked_ids`. | Phím mũi tên `↑` `↓` `←` `→` |
| **Double Click** | 1 ô ảnh / hàng bảng | **Mở ảnh bằng Trình xem Mặc định của Hệ thống (System Viewer):**<br>• macOS: Mở bằng Preview.app (hoặc app mặc định user gán cho định dạng đó).<br>• Windows: Mở bằng Windows Photos (hoặc viewer mặc định). | `Enter` hoặc `Cmd+Down` (Mac) / `Enter` (Win) |
| **Phím Space** | Ảnh đang Focus | **Xem nhanh tức thì (Quick Preview):**<br>• macOS: Native `QLPreviewPanel`.<br>• Windows: Frameless Peek HUD Window. | `Space` |
| **Shift + Click** | Dải ảnh từ Anchor | Đánh dấu tuyển chọn hàng loạt (Range Marking) từ `last_marked_anchor_id` đến ảnh đích. | Không |

---

## 2. Luồng Xử lý Xoay Ảnh Lossless Đồng bộ Hệ thống (Lossless Rotation Pipeline)

```text
[Người dùng bấm 'Rotate 90° Right' hoặc phím 'R']
                        │
                        ▼
[Frontend IPC invoke: 'rotate_lossless' { file_paths, degrees: 90 }]
                        │
                        ▼
             [Rust Media Core Engine]
                        │
           Kiểm tra định dạng tệp (Extension)
         ┌──────────────┴──────────────┐
         ▼                             ▼
    [Là file JPEG]               [Là file PNG / HEIC]
         │                             │
  Đọc trực tiếp các             Xoay trực tiếp qua Image buffer
  khối DCT (không giải mã pixel) hoặc cập nhật Orientation tag
         │                             │
  Biến đổi ma trận DCT                 │
  (90° Clockwise Lossless)             │
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
         [Chuẩn hóa EXIF Orientation]
       Đặt cờ Orientation = 1 (Normal)
                        │
                        ▼
         [Ghi file xuống đĩa an toàn]
       Ghi đè file gốc, cập nhật mtime
                        │
                        ▼
         [Tầng Platform Cache Invalidation]
         ┌──────────────┴──────────────┐
         ▼                             ▼
   [Trên macOS]                  [Trên Windows]
Gọi Swift Adapter:             Gọi Win32 API qua Rust:
NSWorkspace.shared.            SHChangeNotify(
noteFileSystemChanged          SHCNE_UPDATEITEM, ...)
Ép QuickLook daemon            Ép Windows Explorer
hủy thumbnail cũ               làm mới thumbnail tức thì
         └──────────────┬──────────────┘
                        │
                        ▼
          [Báo thành công về Frontend]
  Frontend cập nhật thumbnail URL kèm query timestamp:
  src = "asset://path/image.jpg?v=1728280000" để bust WebView cache
```

### 2.1. Quy tắc Bảo toàn Biên Khối MCU (JPEG MCU Boundary Protection)
- Trong định dạng JPEG, dữ liệu ảnh được mã hóa theo các khối MCU (Minimum Coded Unit) kích thước 8×8 hoặc 16×16 pixel.
- Đối với hầu hết ảnh chụp từ máy ảnh/điện thoại (ví dụ: 6000×4000, 7008×4672), kích thước luôn chia hết cho 16 pixel nên việc biến đổi DCT 90° là **hoàn hảo 100% (Perfect Lossless Transform)**.
- Trường hợp ảnh cắt cúp lẻ (Odd-dimension crop không chia hết cho MCU):
  - Hệ thống đặt cờ an toàn `trim: false` (không cắt xén pixel viền).
  - Nếu không thể thực hiện DCT mà không cắt pixel: Tự động chuyển sang phương án an toàn là **xoay cờ EXIF Orientation** thay vì ghi đè thô bạo làm mất chi tiết viền ảnh.
- **Đối với HEIC / PNG:** PNG không có cấu trúc DCT, việc xoay được xử lý qua ma trận pixel bộ nhớ; HEIC được cập nhật trực tiếp container metadata hoặc gọi Apple ImageIO để đảm bảo chất lượng nguyên bản.

### 2.2. Xử lý Cơ chế Xoay trên Windows (Headless PowerShell GDI+ & File Lock Prevention)
- **Bản chất Xoay trên Windows:** Khác với macOS (sử dụng `sips` hoặc biến đổi DCT), trên Windows hệ thống sử dụng `System.Drawing` (GDI+ `RotateFlipType`) có sẵn của Windows để xoay và lưu lại theo định dạng gốc (`RawFormat`) mà không cần cài đặt thêm dependency nặng.
- **Ẩn hoàn toàn cửa sổ Console:** Khi gọi lệnh quay ảnh bằng PowerShell, Rust backend kích hoạt cờ Win32 `creation_flags(0x08000000)` (`CREATE_NO_WINDOW`) cùng với `-NonInteractive -WindowStyle Hidden`, triệt tiêu hoàn toàn hiện tượng nhấp nháy cửa sổ PowerShell xanh navy.
- **Tránh lỗi File Lock GDI+ & Tránh xung đột Tệp:**
  1. Đường dẫn tệp được truyền an toàn qua luồng `stdin` (tránh lỗi ngắt chuỗi / dấu nháy / ký tự Unicode đặc biệt trong CLI).
  2. Đọc toàn bộ byte của ảnh vào `[System.IO.MemoryStream]`.
  3. Khởi tạo đối tượng `Image` từ `MemoryStream` và thực hiện `RotateFlip`.
  4. Ghi kết quả vào một tệp tạm mang định danh ngẫu nhiên duy nhất (GUID: `.tmp_rot_<guid>.<ext>`) để tránh tuyệt đối xung đột khi xoay song song.
  5. Đảm bảo giải phóng hoàn toàn các đối tượng bằng `.Dispose()` trong khối `try/finally`.
  6. Copy ghi đè tệp tạm vào tệp gốc và dọn sạch tệp tạm; khối `catch` bắt lỗi có trách nhiệm xóa tệp tạm nếu có lỗi phát sinh.

---

## 3. Luồng Đổi tên Hàng loạt An toàn & Nhật ký Thao tác (Batch Rename & Operation Journal)

Quy tắc đặt tên chuẩn: `YYYYMMDD_HHMM` kèm số thứ tự `_01`, `_02` nếu nhiều ảnh chụp cùng thời điểm.

```text
Bước 1: Tập hợp danh sách tệp cần đổi tên
  - Lấy từ marked_ids (hoặc toàn bộ thư mục nếu chưa mark).

Bước 2: Phân giải thời gian gốc (Date Resolution)
  - Ưu tiên 1: Đọc trường EXIF DateTimeOriginal hoặc CreateDate.
  - Fallback 2: Nếu không có EXIF → Đọc File Modified Time (mtime).
  - Chuẩn hóa: Chuỗi YYYYMMDD_HHMM (ví dụ: 20261007_0850).

Bước 3: Nhóm và Sinh số thứ tự (Grouping & Suffix Sequencing)
  - Gom các file có cùng chuỗi thời gian vào một nhóm.
  - Sắp xếp trong nhóm theo: SubSecTimeOriginal (nếu có) → Tên file gốc ban đầu.
  - Nếu nhóm có nhiều hơn 1 file (chụp burst cùng phút):
    * File 1: YYYYMMDD_HHMM_01.ext
    * File 2: YYYYMMDD_HHMM_02.ext
    * File N: YYYYMMDD_HHMM_xx.ext

Bước 4: Backend Thẩm định & Phát hiện Xung đột (Dry-Run Validation)
  - Backend tự lập bảng Rename Plan độc lập (không tin tưởng thuần túy dữ liệu client).
  - Kiểm tra xem tên mới có trùng với file đã tồn tại trên đĩa hay không.
  - Trả về danh sách RenameDiffItem để Frontend hiển thị hộp thoại xác nhận.

Bước 5: Thực thi An toàn Hai Pha (Two-Phase Safe Execution & Journal)
  - Ghi nhật ký thao tác (Operation Journal) tạm thời vào bộ nhớ.
  - Pha 1: Đổi toàn bộ file nguồn sang file tạm ẩn:
    filename.jpg → .tmp_rename_uuid_01.jpg
  - Pha 2: Đổi từ file tạm sang tên đích chính thức:
    .tmp_rename_uuid_01.jpg → 20261007_0850_01.jpg
  - Nếu gặp lỗi I/O bất kỳ: Dựa vào Operation Journal để rollback lập tức về tên cũ.
```

---

## 4. Cơ chế Di chuyển Tệp An toàn Qua Phân vùng (Cross-Volume Safe Move)

Khi người dùng kéo thả ảnh từ thẻ nhớ ngoài (SD Card) vào ổ cứng máy tính hoặc giữa 2 phân vùng khác nhau:
1. **Kiểm tra Phân vùng:** Nếu cùng mount point → Dùng `fs::rename` (di chuyển nguyên tử siêu tốc).
2. **Nếu khác Phân vùng (Cross-Volume Move):**
   - Bước 1: Sao chép file nguồn sang file tạm ở đích (`destination/.tmp_copy_uuid`).
   - Bước 2: Kiểm tra dung lượng byte và checksum của file tạm khớp hoàn toàn với nguồn.
   - Bước 3: Đổi tên file tạm thành tên chính thức ở đích.
   - Bước 4: Xóa file nguồn an toàn.

---

## 5. Kiến trúc Priority Scheduler & Pipeline Tải Dữ liệu

```text
[Người dùng mở Thư mục Cha]
            │
            ├───────────────────────────────────────────────────────┐
            ▼                                                       ▼
   [Luồng 1: Fast Scan]                                   [Luồng 2: Build Subfolder Tree]
Quét nhanh tên, size, extension                        Ánh xạ cây thư mục sang Left Sidebar
Render ngay danh sách cơ bản lên Grid                               │
            │                                                       │
            ▼                                                       ▼
   [Rust Priority Scheduler]
            │
            ├───────────────────────────────────────────────────────┐
            ▼ (Ưu tiên cao nhất)                                    ▼ (Ưu tiên ngầm)
   [Queue 1: Viewport Thumbnails]                          [Queue 2: Background EXIF]
Chỉ sinh thumbnail cho các ô đang nhìn                 Worker pool đọc 64KB header
thấy trên màn hình (Viewport + Overscan).              Gom thành lô (50 items/lô).
            │                                                       │
   Tận dụng Platform Adapter:                                       ▼
   • macOS: Apple ImageIO                                  Bắn sự kiện streaming:
   • Windows: IShellItemImageFactory                       'exif_chunk_stream'
            │                                                       │
            ▼                                                       ▼
   Frontend nạp thumbnail siêu nhẹ (320px)                 Store cập nhật metadata theo ID
   RAM/GPU ổn định, không giật lag                         (Không gây nhảy layout)
```
