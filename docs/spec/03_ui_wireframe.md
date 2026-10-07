# UI & Wireframe Specification: VXTriage (`_spec3_ui_wireframe`)

> **Module:** Đặc tả Giao diện & Trải nghiệm Người dùng (UI/UX Wireframe Specs)  
> **Tài liệu cha:** [00_system_overview.md](00_system_overview.md)  
> **Ngôn ngữ thiết kế:** Tuân thủ chuẩn [master_theme.md](../../../master_theme.md) (VX Theme: Slate `#0f1117`, Electric Cyan `#06b6d4`, Amber `#fbbf24`)  
> **Kiến trúc áp dụng:** Option C (Tauri React Shell + Native Platform Quick Preview)  
> **Trạng thái:** Hoàn chỉnh (V1.1)  

---

## 1. Cấu trúc Bố cục Toàn màn hình (Overall Layout Wireframe)

Giao diện ứng dụng chia làm 3 phân vùng chính:
1. **Left Sidebar (Cây thư mục con):** Chiều rộng mặc định 220px (co giãn 180px - 300px hoặc thu gọn bằng nút toggle).
2. **Main Content Area:**
   - **Top Header Bar:** Điều hướng thư mục, lọc nguồn ảnh (Camera/Social), chuyển đổi chế độ xem Grid/Detail, thanh trượt zoom kích thước (80px - 360px).
   - **Batch Action Floating HUD:** Thanh công cụ nổi bật lên khi có ảnh được Mark (hiển thị số lượng, nút xoay, đổi tên, copy/move).
   - **Viewport Canvas:** Chế độ Grid hoặc Detail Table với thanh cuộn ảo siêu mượt.
3. **Right Inspector Drawer `(i)`:** Chiều rộng 280px (mặc định ẩn, bật lên khi bấm icon `(i)` hoặc phím `I`).

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  VXTriage — [/Users/vic/Pictures/Trip_DaLat_2026]                    [—] [口] [X]       │
├──────────────┬──────────────────────────────────────────────────────────┬──────────────┤
│ 📁 FOLDERS   │  [<] [>]  📍 Trip_DaLat_2026    [🔍 Lọc tên...]          │ ℹ️ CHI TIẾT  │
│              ├──────────────────────────────────────────────────────────┤ (EXIF Info)  │
│ ▼ DaLat_2026 │  [Tất cả] [📷 Máy ảnh (142)] [📱 ĐT] [🖥️ Screenshot (12)]│              │
│   ├── Raw    │  Chế độ: [⊞ Grid] [≡ Detail]  Zoom: [───○───] (160px)    │ Sony A7 IV   │
│   ├── Edits  ├──────────────────────────────────────────────────────────┤ 24-70mm GM II│
│   ├── Select │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │ f/2.8 1/500s │
│   └── Trash  │  │[✓]     │ │[ ]     │ │[✓]     │ │[✓]     │ │[ ]     │  │ ISO 100      │
│              │  │  IMG   │ │  IMG   │ │  IMG   │ │  IMG   │ │  IMG   │  │              │
│              │  │ _001   │ │ _002   │ │ _003   │ │ _004   │ │ _005   │  │ 6000 x 4000  │
│ ➕ Thư mục mới│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │ 24.2 MB RAW  │
│              ├──────────────────────────────────────────────────────────┤ 📍 GPS:      │
│ 2,450 files  │  ⚡ ĐÃ ĐÁNH DẤU: 3 ẢNH   [↻ Xoay 90°] [✏️ Đổi tên] [📂 Chuyển]│ 11.94,108.43 │
└──────────────┴──────────────────────────────────────────────────────────┴──────────────┘
```

---

## 2. Đặc tả Thành phần Giao diện (Component Breakdown)

### 2.1. Left Sidebar (Cây Thư mục Con Tối giản)
- **Mục tiêu:** Hiển thị cây thư mục con nằm trong thư mục cha đang mở để người dùng tiện kéo thả ảnh vào phân loại mà không chiếm diện tích ngang của khu vực xem ảnh.
- **Tính năng tương tác:**
  - Nút **[+] Tạo thư mục mới**: Tạo nhanh thư mục con cùng cấp (ví dụ: `Picked`, `Instagram`, `Reject`).
  - **Drag Target Support:** Khi kéo ảnh (hoặc nhóm ảnh đang Mark) rê chuột qua thư mục con, thư mục con sẽ sáng viền xanh Cyan (`ring-2 ring-cyan-400 bg-cyan-500/10`) để biểu thị sẵn sàng nhận tệp.
  - Thả chuột (Drop): Di chuyển các tệp được chọn vào thư mục con đó ngay lập tức kèm thông báo Toast ngắn gọn.

### 2.2. Top Header & Thanh Lọc Thông minh (Smart Filter Bar)
- **Filter Chips:**
  - `Tất cả (All)`: Hiển thị toàn bộ tệp ảnh trong thư mục.
  - `Máy ảnh (Camera Only)`: Chỉ hiện ảnh có trường EXIF `Make` & `Model` (loại bỏ toàn bộ ảnh chụp màn hình và ảnh lưu từ mạng xã hội).
  - `Bộ lọc thiết bị (Device Dropdown)`: Liệt kê các máy ảnh thực tế phát hiện được (ví dụ: `Sony A7M4 (85)`, `iPhone 15 Pro (57)`).
  - `Chụp màn hình (Screenshots)`: Chỉ hiện ảnh PNG/WebP hoặc ảnh không có EXIF camera.
- **View Switcher & Zoom Slider:**
  - Nút chuyển giữa `Grid View [⊞]` và `Detail View [≡]`.
  - Thanh trượt kích thước ô lưới (Zoom Slider): Cho phép thay đổi kích thước thumbnail từ **80px** (dạng siêu nhỏ để culling nhanh) đến **360px** (dạng lớn để soi chi tiết).

---

## 3. Đặc tả Hai Chế độ Hiển thị (Grid vs. Detail View)

### 3.1. Chế độ Lưới (Grid View Wireframe)
- Mỗi thẻ ảnh (Card) bao gồm:
  1. **Nút Mark (Checkbox tròn ở góc trên trái):**
     - Chưa mark: Hiển thị mờ khi rê chuột vào (`opacity-40 hover:opacity-100`).
     - Đã mark: Hiển thị tích vàng hổ phách (`bg-amber-500 text-black border-amber-400`).
  2. **Vùng Thumbnail:** Kích thước theo Zoom Slider. Sử dụng URL thumbnail thu nhỏ (~320px) từ Thumbnail Pipeline, không nạp ảnh gốc full-res.
  3. **Viền Trạng thái (Focus & Mark Ring):**
     - Item đang **Focus/Select**: Viền màu Electric Cyan rực rỡ (`ring-2 ring-cyan-400 shadow-cyan-500/20`).
     - Item đang **Marked**: Nền ô chuyển sang ánh vàng nhạt (`bg-amber-500/10 border-amber-400/40`).
  4. **Nhãn thông tin tệp:** Tên tệp, ngày chụp (hoặc dung lượng tệp).

```text
┌─────────────────────────────────┐
│ [✓] Marked          [📷 Sony]   │  <-- Badge loại máy
│                                 │
│                                 │
│        [THUMBNAIL ẢNH]          │  <-- Sinh từ Native Thumbnail Pipeline
│                                 │
│                                 │
│ DSC08492.JPG                    │  <-- Tên file
│ 2026-10-07 08:30 • 12.4 MB      │  <-- Ngày chụp & Size
└─────────────────────────────────┘
```

### 3.2. Chế độ Chi tiết (Detail Table View Wireframe)
Bảng dữ liệu nhiều cột chuẩn Desktop Utility với khả năng nhấp vào tiêu đề cột để sắp xếp (Sort):

| Cột | Độ rộng | Căn lề | Mô tả / Định dạng dữ liệu | Khả năng Sort |
| :--- | :--- | :--- | :--- | :--- |
| **Mark** | 40px | Center | Checkbox chọn hàng loạt | Không |
| **Preview** | 44px | Center | Thumbnail mini 32×32px có bo góc | Không |
| **Tên tệp** | 220px | Left | Tên file gốc (DSC08492.JPG) | Có (A → Z, Z → A) |
| **Ngày chụp** | 150px | Left | `YYYY-MM-DD HH:mm:ss` (từ EXIF) | Có (Mới → Cũ) |
| **Hãng máy** | 100px | Left | Sony, Canon, Apple, Nikon... | Có |
| **Mã máy (Model)** | 130px | Left | ILCE-7M4, EOS R6, iPhone 15 Pro | Có |
| **Ống kính (Lens)** | 160px | Left | FE 24-70mm F2.8 GM II | Có |
| **Khẩu độ (F)** | 70px | Right | `f/2.8`, `f/4.0` | Có |
| **Tốc độ (Shutter)**| 80px | Right | `1/500s`, `1/60s`, `2.5s` | Có |
| **Độ nhạy (ISO)** | 70px | Right | `ISO 100`, `ISO 3200` | Có |
| **Dung lượng** | 90px | Right | `14.2 MB`, `850 KB` | Có |

> **Quy tắc Tương tác Double-Click (Cả Grid & Detail View):**  
> Nhấp đúp chuột (Double-Click) vào bất kỳ thẻ ảnh nào trong Grid hoặc hàng nào trong Detail Table sẽ **kích hoạt mở tệp tin bằng Trình xem Mặc định của Hệ điều hành (System Default Viewer)**:
> - *Trên macOS:* Mở bằng Preview.app (hoặc phần mềm mặc định người dùng gán cho định dạng đó trong Finder).
> - *Trên Windows:* Mở bằng Windows Photos (hoặc ứng dụng mặc định trong Windows Explorer).
> - *Phím tắt tương đương:* Nhấn phím `Enter` (Windows/Mac) hoặc `Cmd+Down` (macOS Finder convention).

---

## 4. Đặc tả Trải nghiệm Xem nhanh theo Nền tảng (Platform-Aware Spacebar Preview)

Khi người dùng nhấn phím `Space` tại bất kỳ ảnh nào đang được Focus:

### 4.1. Trên môi trường macOS (Native Quick Look)
- Hệ thống gửi IPC kích hoạt **Native Swift Plugin**: Mở trực tiếp cửa sổ **`QLPreviewPanel`** của hệ điều hành macOS.
- **Trải nghiệm:** Chuẩn 100% như Finder. Hỗ trợ hiển thị mọi định dạng Apple Quick Look hỗ trợ (kể cả Apple ProRAW, Live Photo), zoom mượt mà bằng trackpad, chuyển ảnh bằng phím mũi tên `←`/`→`, bấm `Space` hoặc `Esc` để đóng.

### 4.2. Trên môi trường Windows (Frameless Peek HUD)
- Hệ thống mở một **Cửa sổ Nổi Không viền (Frameless Floating Window)** của Tauri với hiệu ứng nền tối mờ Mica/Acrylic (phong cách PowerToys Peek).
- Phím tắt điều hướng `←`/`→` duyệt ảnh kế tiếp, thanh công cụ đáy hiển thị tên file và nút xoay nhanh `[↻ Xoay 90°]`, phím `Space`/`Esc` đóng lại.

---

## 5. Đặc tả Ngăn Thông tin Chi tiết (Info Drawer `(i)`)

Khi nhấn phím `I` hoặc click biểu tượng `(i)` trên thanh công cụ:
- Ngăn trượt mở ra từ bên phải màn hình (rộng 280px).
- Hiển thị danh mục chi tiết:
  - **Tệp tin:** Đường dẫn đầy đủ, dung lượng, ngày tạo, ngày sửa, định dạng (MIME type).
  - **Thông số chụp:** Máy ảnh, Model, Ống kính, Khẩu độ, Tốc độ, ISO, Tiêu cự thực, Tiêu cự quy đổi (35mm equivalent), Chế độ phơi sáng, Cân bằng trắng.
  - **Vị trí địa lý (GPS):** Tọa độ Vĩ độ/Kinh độ, Độ cao (Altitude). Nếu có tọa độ, hiển thị nút link "Mở trên Apple Maps / Google Maps".
  - **Thông số kỹ thuật:** Chiều rộng × Chiều cao (Pixels), Không gian màu (Color Space: sRGB, Display P3), Cấu hình nén.

---

## 6. Đặc tả Menu Bar Hệ Thống & Cơ Chế Adapt trên Windows (Application Menu Bar)

### 6.1. Trên môi trường macOS (Native Top System Menu Bar)
Trên macOS, Menu Bar nằm cố định ở dải menu trên cùng của hệ điều hành:

```text
  VXTriage  File  Edit  Mark  View  Filter  Tools  Window  Help
```

Cấu trúc chi tiết các Menu cấp 1 và cấp 2:
- **`VXTriage` (App Menu):**
  - Giới thiệu VXTriage (About VXTriage)
  - Tùy chọn cài đặt... (Preferences / Settings) — `Cmd+,`
  - Ẩn VXTriage (Hide) — `Cmd+H` / Ẩn ứng dụng khác — `Cmd+Opt+H`
  - Thoát VXTriage (Quit) — `Cmd+Q`
- **`File` (Tệp):**
  - Mở thư mục... (Open Folder...) — `Cmd+O`
  - Mở thư mục gần đây > (Open Recent Submenu)
  - Tạo thư mục con mới... (New Subfolder...) — `Cmd+Shift+N`
  - Hiện trong Finder (Reveal in Finder) — `Cmd+Shift+R`
  - Đóng thư mục hiện tại (Close Folder) — `Cmd+W`
- **`Edit` (Chỉnh sửa):**
  - Hoàn tác đổi tên / di chuyển (Undo) — `Cmd+Z`
  - Sao chép tệp (Copy Files) — `Cmd+C`
  - Cắt tệp (Cut Files) — `Cmd+X`
  - Sao chép đường dẫn (Copy Absolute Path) — `Cmd+Opt+C`
  - Chọn tất cả (Select All) — `Cmd+A`
  - Bỏ chọn (Deselect) — `Cmd+D`
- **`Mark` (Đánh dấu tuyển chọn):**
  - Đánh dấu / Bỏ đánh dấu ảnh đang focus (Toggle Mark) — `M` hoặc phím `1`
  - Đánh dấu tất cả ảnh đang hiển thị (Mark All Visible) — `Cmd+Opt+A`
  - Bỏ đánh dấu toàn bộ (Unmark All) — `Cmd+Opt+U`
  - Đảo ngược đánh dấu (Invert Marks) — `Cmd+Shift+I`
- **`View` (Hiển thị & Bố cục):**
  - Chế độ Lưới (Grid View) — `Cmd+1`
  - Chế độ Bảng Chi tiết (Detail Table View) — `Cmd+2`
  - Phóng to ô lưới (Zoom In Grid) — `Cmd+=`
  - Thu nhỏ ô lưới (Zoom Out Grid) — `Cmd+-`
  - Đặt lại kích thước chuẩn (Reset Zoom) — `Cmd+0`
  - Bật/Tắt Cây thư mục (Toggle Sidebar) — `Cmd+B`
  - Bật/Tắt Khung Chi tiết (Toggle Info Drawer) — `Cmd+I`
  - Xem nhanh Native Quick Look (Quick Preview) — `Space`
- **`Filter` (Bộ lọc Nguồn ảnh):**
  - Tất cả ảnh (Show All) — `Cmd+Opt+0`
  - Chỉ ảnh Máy ảnh thật (Camera Only) — `Cmd+Opt+1`
  - Chỉ ảnh Chụp màn hình (Screenshots Only) — `Cmd+Opt+2`
  - Gom nhóm theo Thiết bị > (Group by Camera Model)
- **`Tools` (Công cụ Thao tác):**
  - Xoay 90° cùng chiều kim đồng hồ (Rotate 90° CW) — `R` hoặc `Cmd+]`
  - Xoay 90° ngược chiều kim đồng hồ (Rotate 90° CCW) — `Shift+R` hoặc `Cmd+[`
  - Đổi tên hàng loạt... (Batch Rename) — `F2`
  - Di chuyển các ảnh đã đánh dấu vào... (Move Marked To...) — `Cmd+M`
  - Chuyển vào Thùng rác (Move to Trash) — `Cmd+Backspace`
- **`Window` & `Help`:** Thu nhỏ, Phóng to, Phím tắt trợ giúp (`Cmd+/`).

---

### 6.2. Cơ chế Adapt trên Windows (Compact Titlebar Menu Bar)
Trên Windows, hệ điều hành không có global top menu bar. Để giữ trải nghiệm chuyên nghiệp, thanh menu được tích hợp trực tiếp vào **Custom Frameless Titlebar** của ứng dụng:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Icon] VXTriage   File   Edit   Mark   View   Filter   Tools   Help        [—] [口] [X]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Quy tắc chuyển đổi (Windows Platform Adaptation):**
1. **Phím tắt chuẩn Windows:**
   - Đổi toàn bộ `Cmd` thành `Ctrl` (ví dụ: `Ctrl+O` mở folder, `Ctrl+A` chọn tất cả, `Ctrl+Z` hoàn tác, `Ctrl+B` toggle sidebar, `Ctrl+I` bật info).
   - Phím xóa file đổi thành `Delete` (thay cho `Cmd+Backspace`).
   - Phím đổi tên giữ nguyên chuẩn Windows: `F2`.
   - Phím Reveal in Explorer: `Ctrl+Shift+R` (Mở Windows Explorer chọn sẵn file).
2. **Kích hoạt phím `Alt` (Mnemonic Alt-Navigation):**
   - Khi người dùng nhấn phím `Alt`: các ký tự gạch chân xuất hiện (`Alt+F` cho File, `Alt+E` cho Edit, `Alt+V` cho View, `Alt+T` cho Tools).
   - Cho phép điều hướng dropdown menu hoàn toàn bằng phím mũi tên và Enter.
3. **Phong cách Thẩm mỹ Menu Dropdown:**
   - Thiết kế theo chuẩn Glass Dropdown của [master_theme.md](../../../master_theme.md):
     - Background: `rgba(15, 20, 28, 0.96)` kết hợp viền mờ `border-white/10`.
     - Phông chữ compact: `text-xs` (12px), giãn dòng gọn gàng, bo góc nhẹ `rounded-md`, đổ bóng chiều sâu `shadow-2xl`.
     - Hover item: nền xanh cyan bán trong suốt `hover:bg-cyan-500/15 text-cyan-300`.

---

### 6.3. Khung Cài đặt & Giới thiệu (Settings & About Modal)
Kế thừa trực tiếp kiến trúc giao diện Modal từ `media_tool`:
- **Settings Modal (`Cmd+,` / `Ctrl+,`):** 
  - Tùy chọn giao diện (Theme: Dark Slate `#0f1117` / Light).
  - Hành vi mặc định khi kéo thả vào sidebar (Mặc định: Di chuyển tệp `Move`; giữ `Option`/`Alt`: Sao chép `Copy`).
  - Cấu hình quy tắc đổi tên (Tiền tố/Hậu tố, định dạng số thứ tự 2 chữ số `_01` hoặc 3 chữ số `_001`).
  - Quản lý bộ nhớ đệm (Clear Thumbnail Cache).
- **About Modal:**
  - Biểu tượng ứng dụng VXTriage, phiên bản hiện tại (v1.0.0).
  - Tác giả, thông tin bản quyền và liên kết mã nguồn GitHub: `https://github.com/linhbv94/Photo_Picker`.

---

## 7. Đặc tả Menu Chuột Phải (Context Menus)

Hệ thống cung cấp 3 menu ngữ cảnh (Context Menu) riêng biệt tùy vào vị trí click chuột phải:

### 7.1. Context Menu trên Thẻ ảnh / Hàng ảnh (Image Card Context Menu)
Kích hoạt khi nhấp chuột phải vào một ô thumbnail ở Grid View hoặc một hàng ở Detail Table View:
- **Xử lý Focus & Selection:**
  - Nếu click phải vào ảnh đang nằm trong nhóm đã đánh dấu (`marked_ids`): Menu sẽ áp dụng tác vụ cho **toàn bộ N ảnh đang đánh dấu** (ví dụ: *"Xoay 90° (5 ảnh)"*, *"Đổi tên hàng loạt (5 ảnh)..."*).
  - Nếu click phải vào ảnh chưa được đánh dấu: Hệ thống tự động chuyển con trỏ Focus (`selected_id`) sang ảnh này và hiển thị menu cho duy nhất 1 ảnh đó.

```text
┌────────────────────────────────────────────────────────┐
│  🖼️  Mở bằng Trình xem mặc định                Enter   │
│  👁️  Xem nhanh (Quick Preview)                  Space   │
│  ℹ️  Xem thông tin chi tiết (Info)              Cmd+I   │
├────────────────────────────────────────────────────────┤
│  🏷️  Đánh dấu tuyển chọn (Toggle Mark)              M   │
│  ↻   Xoay 90° chiều kim đồng hồ                     R   │
│  ↺   Xoay 90° ngược chiều kim đồng hồ         Shift+R   │
│  ✏️  Đổi tên theo ngày chụp (Batch Rename)...      F2   │
├────────────────────────────────────────────────────────┤
│  📂  Di chuyển vào thư mục con              ▶         │
│      ├── 📁 01_Picked                                  │
│      ├── 📁 02_Reject                                  │
│      └── ➕ Thư mục mới...                             │
│  📋  Sao chép vào thư mục con               ▶         │
│  📎  Sao chép đường dẫn (Copy Path)         Cmd+Opt+C   │
│  🔍  Mở trong Finder / Explorer             Cmd+Shift+R │
├────────────────────────────────────────────────────────┤
│  🗑️  Chuyển vào Thùng rác (Trash)         Cmd+Delete   │
└────────────────────────────────────────────────────────┘
```

---

### 7.2. Context Menu trên Thư mục con ở Left Sidebar (Folder Context Menu)
Kích hoạt khi nhấp chuột phải vào một mục thư mục trên cây Left Sidebar:

```text
┌────────────────────────────────────────────────────────┐
│  📂  Đặt làm Thư mục chính (Set as Root Folder)        │
│  ➕  Tạo thư mục con bên trong...            Cmd+Shift+N│
├────────────────────────────────────────────────────────┤
│  ✏️  Đổi tên thư mục...                             F2 │
│  🔍  Mở trong Finder / Explorer             Cmd+Shift+R │
├────────────────────────────────────────────────────────┤
│  📥  Chuyển tất cả ảnh đang đánh dấu vào đây            │
│  🗑️  Xóa thư mục vào Thùng rác              Cmd+Delete │
└────────────────────────────────────────────────────────┘
```

---

### 7.3. Context Menu trên Vùng Trống (Empty Canvas Context Menu)
Kích hoạt khi nhấp chuột phải vào khoảng trống của lưới ảnh hoặc nền canvas:

```text
┌────────────────────────────────────────────────────────┐
│  ⊞   Chế độ Lưới (Grid View)                     Cmd+1 │
│  ≡   Chế độ Bảng Chi tiết (Detail View)          Cmd+2 │
├────────────────────────────────────────────────────────┤
│  🔄  Làm mới danh sách (Refresh)                 Cmd+R │
│  ➕  Tạo thư mục con mới...                  Cmd+Shift+N│
│  🧹  Bỏ đánh dấu tất cả (Unmark All)         Cmd+Opt+U │
├────────────────────────────────────────────────────────┤
│  📁  Mở thư mục khác...                          Cmd+O │
└────────────────────────────────────────────────────────┘
```
