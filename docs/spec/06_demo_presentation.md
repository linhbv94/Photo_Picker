# Demo Presentation Playbook: VXTriage (`_spec6_demo_presentation`)

> **Module:** Kịch bản Trình diễn & Nghiệm thu Tính năng (Demo DoD Playbook)  
> **Tài liệu cha:** [00_system_overview.md](00_system_overview.md)  
> **Kiến trúc áp dụng:** Option C (Tauri React Shell + Native Platform Adapters)  
> **Trạng thái:** Hoàn chỉnh (V1.1)  

---

## 1. Kịch bản Trình diễn Nghiệm thu (DoD Walkthrough Script)

Kịch bản demo gồm 7 bước nhằm chứng minh toàn bộ các yêu cầu trong `scratch.md` đã được thỏa mãn triệt để:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        LỘ TRÌNH DEMO TÍNH NĂNG                         │
├─────────┬──────────────────────┬───────────────────────────────────────┤
│ Bước    │ Hành động Người dùng │ Kết quả Kỳ vọng (Evidence)            │
├─────────┼──────────────────────┼───────────────────────────────────────┤
│ Bước 1  │ Mở thư mục Fixtures  │ 1,000 ảnh nạp tức thì, sidebar hiện 3 │
│         │ hỗn hợp              │ thư mục con (Raw, Selects, Trash).    │
│ Bước 2  │ Lọc "Camera Only"    │ Lập tức ẩn toàn bộ screenshots & meme,│
│         │                      │ chỉ giữ lại ảnh Sony/Canon/iPhone.    │
│ Bước 3  │ Chỉnh Zoom Slider    │ Kéo từ 80px đến 360px mượt mà, số cột │
│         │                      │ tự co giãn theo tỷ lệ.                │
│ Bước 4  │ Bấm Space xem nhanh  │ Trên Mac: Cửa sổ Native Quick Look    │
│         │                      │ mở lên tức thì. Trên Win: Peek HUD.   │
│ Bước 5  │ Bật Info Drawer (i)  │ Hiện thông số EXIF (f/2.8, ISO, Lens) │
│         │                      │ và tọa độ GPS định vị.                │
│ Bước 6  │ Shift+Click & Kéo    │ Mark dải 10 ảnh, kéo thả vào folder   │
│         │ thả vào sidebar      │ 'Selects' ở Left Sidebar an toàn.     │
│ Bước 7  │ Xoay ảnh Lossless &  │ Xoay 90°, mở Finder kiểm tra thumbnail│
│         │ Đổi tên YYYYMMDD     │ và tên file đã đổi dạng 20261007_0830.│
└─────────┴──────────────────────┴───────────────────────────────────────┘
```

---

## 2. Các Bước Thực hiện Chi tiết

### Bước 1: Khởi động & Nạp Thư mục Cha
1. Mở ứng dụng VXTriage.
2. Bấm nút "Mở thư mục" và trỏ đến thư mục mẫu `test_gallery`.
3. **Quan sát:**
   - Ảnh xuất hiện ngay lập tức trên màn hình với chế độ Grid.
   - Left Sidebar hiển thị danh sách các thư mục con cấp 1 (ví dụ: `01_Picked`, `02_Reject`, `03_Edited`) với giao diện tối giản, không lấn chiếm không gian ngang.

### Bước 2: Thao tác Lọc Nguồn Ảnh
1. Bấm vào chip lọc **"📷 Máy ảnh (Camera Only)"**.
2. **Quan sát:** Toàn bộ ảnh chụp màn hình (Screenshots) và ảnh tải từ mạng xã hội biến mất khỏi danh sách.
3. Chọn dropdown **"Camera: Sony ILCE-7M4"**: Chỉ những bức ảnh chụp bằng máy ảnh Sony A7 IV được giữ lại.

### Bước 3: Kiểm tra Trải nghiệm Duyệt & Quick Preview (Spacebar)
1. Dùng phím mũi tên di chuyển tiêu điểm (Focus viền xanh Cyan).
2. Nhấn phím `Space`:
   - Trên macOS: Kích hoạt cửa sổ Quick Look chuẩn Apple (`QLPreviewPanel`).
   - Trên Windows: Kích hoạt cửa sổ Frameless Peek HUD.
   - Nhấn phím mũi tên `→` để duyệt liền mạch 3 ảnh tiếp theo.
   - Nhấn `Space` hoặc `Esc` để đóng lại, tiêu điểm vẫn giữ nguyên ở bức ảnh cuối cùng.

### Bước 4: Kiểm tra Info Drawer `(i)`
1. Bấm phím `I` trên bàn phím:
   - Panel cạnh phải mở ra mượt mà.
   - Hiển thị đầy đủ: Camera Model, Lens Model, Focal Length, Aperture `f/2.8`, Shutter `1/500s`, ISO `100`.
   - Với ảnh chụp từ điện thoại: Hiển thị tọa độ GPS cùng nút mở bản đồ.

### Bước 5: Kiểm tra Độc lập Mark vs. Select và Dải Shift + Click
1. Click vào ảnh thứ 2 (ảnh nhận cờ focus).
2. Giữ phím `Shift` và click vào ảnh thứ 8.
3. **Quan sát:**
   - Cả 7 bức ảnh từ số 2 đến số 8 đều được đánh dấu tích vàng hổ phách (`marked_ids = 7`).
   - Thanh công cụ nổi bật lên ở đáy màn hình: *"⚡ Đã đánh dấu: 7 ảnh"*.

### Bước 6: Kéo thả Phân loại vào Thư mục Con ở Left Sidebar
1. Dùng chuột kéo nhóm 7 ảnh đang được đánh dấu.
2. Rê chuột vào thư mục `01_Picked` trên Left Sidebar:
   - Thư mục `01_Picked` sáng viền xanh Cyan.
3. Thả chuột:
   - 7 tệp tin được chuyển vào thư mục `01_Picked` trên ổ cứng qua cơ chế Safe Move.
   - Danh sách trên màn hình cập nhật ngay lập tức.

### Bước 7: Kiểm tra Xoay Lossless & Đổi tên Hàng loạt
1. Chọn một ảnh JPEG cần xoay, bấm phím `R` (Rotate 90° Clockwise).
2. Chuyển sang cửa sổ macOS Finder bên cạnh:
   - **Xác nhận:** Thumbnail trên Finder đã xoay đúng góc 90° ngay tức thì (nhờ tín hiệu `noteFileSystemChanged`).
3. Đánh dấu 5 ảnh trong folder, bấm `F2` (hoặc nút "Đổi tên hàng loạt"):
   - Hộp thoại Preview hiển thị danh sách tên mới dự kiến theo định dạng: `YYYYMMDD_HHMM_01.jpg`, `YYYYMMDD_HHMM_02.jpg`.
   - Bấm xác nhận "Áp dụng đổi tên": Tên file trên đĩa được đổi chuẩn xác không có lỗi xung đột, có ghi nhận Operation Journal.
