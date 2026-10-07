# QA & Acceptance Criteria Specification: VXTriage (`_spec5_qa_acceptance`)

> **Module:** Tiêu chuẩn Nghiệm thu & Ma trận Ca Kiểm thử (Acceptance Criteria & Edge Cases)  
> **Tài liệu cha:** [00_system_overview.md](00_system_overview.md)  
> **Kiến trúc áp dụng:** Option C (Tauri React Shell + Native Platform Adapters)  
> **Trạng thái:** Hoàn chỉnh (V1.1)  

---

## 1. Tiêu chuẩn Nghiệm thu Chức năng (Gherkin Acceptance Criteria)

### AC-01: Nạp Thư mục Cha & Cây Thư mục Con Gọn gàng (Left Sidebar)
```gherkin
Given người dùng đang ở màn hình chính VXTriage
When người dùng chọn một thư mục cha chứa 2,000 ảnh và 4 thư mục con
Then danh sách cơ bản (tên, dung lượng) xuất hiện ngay lập tức trong vòng dưới 500ms
And Left Sidebar hiển thị danh sách 4 thư mục con dưới dạng cây gọn gàng, không chiếm diện tích ngang
And thanh trạng thái hiển thị đúng tổng số lượng tệp tin.
```

### AC-02: Lọc Nhanh Ảnh Máy ảnh thật vs Ảnh Màn hình / Ảnh Mạng
```gherkin
Given thư mục đang mở chứa hỗn hợp 100 ảnh máy ảnh Sony, 50 ảnh chụp màn hình, và 30 ảnh tải từ Facebook
When người dùng nhấn vào chip lọc "Máy ảnh (Camera Only)"
Then màn hình chỉ giữ lại đúng 100 ảnh có thông tin Camera Make và Camera Model
And 50 ảnh chụp màn hình cùng 30 ảnh Facebook bị ẩn hoàn toàn
When người dùng mở dropdown "Camera Model" và chọn "ILCE-7M4"
Then chỉ những ảnh chụp bởi model "ILCE-7M4" được hiển thị.
```

### AC-03: Điều chỉnh Kích thước Lưới (Grid Zoom Slider) & Cuộn Mượt mà
```gherkin
Given danh sách đang hiển thị ở chế độ Grid View với kích thước mặc định 160px
When người dùng kéo thanh trượt Zoom Slider sang mức 80px
Then kích thước các ô ảnh thu nhỏ về 80px ngay lập tức, số lượng cột tự động tăng tương ứng
When người dùng kéo thanh trượt Zoom Slider lên 360px
Then các ô ảnh phóng to lên 360px mượt mà không bị giật lag
And các ô ảnh nằm ngoài khung nhìn (viewport) được giải phóng khỏi DOM nhờ cơ chế ảo hóa.
```

### AC-04: Phân định Select Focus & Phím Space Xem nhanh Chuẩn Nền tảng
```gherkin
Given danh sách ảnh đang hiển thị và một ảnh đang nhận Focus (viền Cyan)
When người dùng nhấn phím "Space" trên macOS
Then cửa sổ Native QLPreviewPanel của hệ điều hành mở lên tức thì hiển thị ảnh độ nét cao
When người dùng nhấn phím "Space" trên Windows
Then cửa sổ Frameless Peek HUD mở lên tức thì hiển thị ảnh
When người dùng bấm phím "Mũi tên Phải"
Then cửa sổ Quick Preview chuyển sang hiển thị ảnh kế tiếp
When người dùng nhấn phím "Space" hoặc "Esc"
Then cửa sổ Quick Preview đóng lại, tiêu điểm trên danh sách vẫn ở ảnh đang xem
When người dùng nhấp đúp chuột (Double Click) vào ảnh đang chọn hoặc nhấn phím "Enter"
Then tệp ảnh được mở trực tiếp bằng Trình xem Mặc định của Hệ điều hành (Preview.app trên macOS hoặc Windows Photos trên Windows).
```

### AC-05: Bảng Chi tiết Đầy đủ Cột EXIF & Sắp xếp Đa tiêu chí
```gherkin
Given người dùng chuyển từ chế độ Grid View sang Detail View
Then danh sách hiển thị dưới dạng bảng có các cột: Checkbox, Tên tệp, Ngày chụp, Hãng máy, Mã máy, Ống kính, Khẩu độ, Tốc độ, ISO, Dung lượng
When người dùng nhấp vào tiêu đề cột "Ngày chụp"
Then toàn bộ danh sách được sắp xếp từ mới nhất đến cũ nhất
When người dùng nhấp tiếp lần thứ hai vào tiêu đề cột "Ngày chụp"
Then danh sách đổi chiều sắp xếp từ cũ nhất đến mới nhất.
```

### AC-06: Độc lập Giữa Mark và Select + Chọn Dải Shift + Click
```gherkin
Given danh sách ảnh gồm các tệp từ IMG_001 đến IMG_010
When người dùng đánh dấu IMG_001 qua checkbox hoặc phím "M" (marked_ids = [IMG_001], last_marked_anchor = IMG_001)
And người dùng giữ phím "Shift" và click vào IMG_005
Then toàn bộ các ảnh từ IMG_001 đến IMG_005 đều được đánh dấu (marked_ids chứa 5 items)
And con trỏ tiêu điểm (selected_id) chuyển sang IMG_005
And thanh công cụ dưới đáy hiện thông báo "⚡ Đã đánh dấu: 5 ảnh".
```

### AC-07: Xoay Ảnh Lossless & Cập nhật Trực tiếp trên Finder / Explorer
```gherkin
Given người dùng đang chọn hoặc đánh dấu ảnh "DSC001.JPG"
When người dùng nhấn nút "Xoay 90° theo chiều kim đồng hồ" (hoặc bấm phím R)
Then file tệp trên ổ cứng được biến đổi Lossless DCT mà không làm nén lại pixel
And cờ EXIF Orientation được chuẩn hóa về 1 (Normal)
And thời gian mtime được cập nhật và bắn tín hiệu cache invalidation cho OS
And khi kiểm tra Finder (macOS) hoặc Explorer (Windows), thumbnail đã xoay đúng 90°.
```

### AC-08: Kéo Thả Phân loại vào Thư mục Con ở Left Sidebar
```gherkin
Given người dùng đã đánh dấu 10 ảnh trong thư mục cha
When người dùng kéo nhóm 10 ảnh này và thả vào thư mục con "Selects" ở Left Sidebar
Then hệ thống di chuyển 10 tệp tin này vào thư mục "Selects" trên ổ cứng
And 10 ảnh này biến mất khỏi danh sách của thư mục cha
And thông báo Toast hiển thị "Đã chuyển 10 ảnh vào Selects thành công".
```

### AC-09: Đổi tên Hàng loạt YYYYMMDD_HHMM kèm Số Thứ tự Thông minh
```gherkin
Given người dùng chọn 3 ảnh được chụp liên tiếp trong cùng 1 phút vào lúc 08:35 ngày 07/10/2026
When người dùng mở chức năng "Đổi tên hàng loạt" (Batch Rename)
Then hộp thoại Preview Diff hiển thị dự kiến:
  - File 1 → 20261007_0835_01.jpg
  - File 2 → 20261007_0835_02.jpg
  - File 3 → 20261007_0835_03.jpg
When người dùng nhấn nút "Xác nhận Đổi tên"
Then tên các file trên ổ cứng được đổi chính xác theo danh sách dự kiến, có ghi nhật ký Operation Journal.
```

### AC-10: Xem Chi tiết Siêu dữ liệu & Tọa độ Vị trí (Info Drawer `(i)`)
```gherkin
Given người dùng đang chọn một ảnh có chứa dữ liệu GPS từ điện thoại iPhone
When người dùng nhấn phím "I" hoặc click biểu tượng "(i)"
Then Info Drawer mở ra từ cạnh phải hiển thị đầy đủ thông số khẩu độ, tốc độ, ISO, tiêu cự, không gian màu, độ cao
And hiển thị tọa độ GPS (Vĩ độ, Kinh độ) cùng nút liên kết mở bản đồ.
```

---

## 2. Ma trận Ca Kiểm thử Biên (Edge Case Matrix)

| Mã Edge Case | Kịch bản Thử nghiệm | Rủi ro Tiềm ẩn | Kết quả Mong đợi |
| :--- | :--- | :--- | :--- |
| **EC-01** | Thư mục chứa 10,000 ảnh từ thẻ nhớ SD | Quá tải RAM, đơ giao diện người dùng | Priority Scheduler: Viewport nạp thumbnail trước, background stream EXIF ngầm; RAM luôn ổn định dưới 250MB. |
| **EC-02** | Ảnh bị lột sạch EXIF (ảnh tải từ Zalo/Facebook) | Crash parser khi đọc Date Taken | Tự động fallback về File Modified Time (`mtime`) và hiển thị nhãn "Không có EXIF". |
| **EC-03** | Tệp tin nằm trên thẻ nhớ bị gạt lẫy Lock (Read-Only) | Lỗi Crash khi cố gắng Xoay ảnh hoặc Đổi tên | Báo lỗi thân thiện `ERR_READ_ONLY_FS`, không làm thay đổi trạng thái file, giữ nguyên UI. |
| **EC-04** | Chụp Burst 15 ảnh trong cùng 1 giây | Xung đột tên file khi đổi tên theo phút | Tự động sắp xếp theo sub-second hoặc tên gốc và sinh số thứ tự `_01` đến `_15`. |
| **EC-05** | Di chuyển file giữa 2 phân vùng khác nhau (Cross-Volume Move) | Rút ổ giữa chừng gây mất dữ liệu | Cơ chế an toàn: Copy sang `.tmp` ở đích → verify kích thước → đổi tên chính thức → mới xóa file nguồn. |
| **EC-06** | Shift-Click ngược chiều (từ item thứ 10 lên item thứ 3) | Tính sai dải slice nếu code cứng `start < end` | Thuật toán sử dụng `Math.min` và `Math.max` đảm bảo dải chọn luôn chính xác bất kể chiều click. |
| **EC-07** | Đổi tên vòng lặp (File A → B, trong khi file B → C) | Ghi đè mất file B nếu không dùng cơ chế an toàn | Thực hiện Two-phase rename thông qua file tạm `.tmp_uuid` rồi mới chuyển sang tên đích. |

---

## 3. Danh mục Kiểm tra Nhanh (Smoke Test Checklist)

- [ ] Mở ứng dụng, chọn folder có cả ảnh JPEG, PNG, HEIC, RAW.
- [ ] Xác nhận Left Sidebar hiển thị đúng cấu trúc các folder con.
- [ ] Bấm phím mũi tên điều hướng: focus di chuyển mượt mà.
- [ ] Bấm phím `Space`: cửa sổ Quick Preview mở lên tức thì (macOS: Native Quick Look, Windows: Peek HUD), bấm `←`/`→` duyệt ảnh, bấm `Space` đóng lại.
- [ ] Double-click vào 1 ảnh (hoặc nhấn `Enter`): kiểm tra mở tệp bằng Preview.app (trên macOS) hoặc Windows Photos (trên Windows).
- [ ] Click 1 ảnh, giữ `Shift` click ảnh thứ 5: kiểm tra đủ 5 ảnh được đánh dấu màu hổ phách.
- [ ] Bấm `R` để xoay ảnh: kiểm tra ảnh xoay đúng và mở Finder xem thumbnail đã xoay chưa.
- [ ] Chuyển sang Detail Table: bấm sort cột Ngày chụp, Hãng máy ảnh xem sắp xếp chuẩn xác.
- [ ] Thử tính năng Đổi tên hàng loạt: kiểm tra bảng diff và xác nhận tên mới có dạng `YYYYMMDD_HHMM_xx`.
- [ ] Kéo 1 nhóm ảnh thả vào folder con ở sidebar: kiểm tra file chuyển đúng vị trí trên đĩa.
- [ ] **Kiểm tra Menu Bar:**
  - Trên macOS: Thử các mục `File > Open Folder`, `Edit > Select All`, `View > Zoom In/Out`, `Tools > Batch Rename`.
  - Trên Windows: Thử nhấn `Alt` để kích hoạt gạch chân menu `Alt+F`, `Alt+E` trên Custom Titlebar.
- [ ] **Kiểm tra Context Menu chuột phải:**
  - Click phải vào ảnh đang chọn: kiểm tra hiện menu với phím tắt tương ứng.
  - Đánh dấu 3 ảnh, click phải: kiểm tra menu hiển thị tác vụ áp dụng cho cả 3 ảnh.
  - Click phải vào folder ở sidebar: kiểm tra tùy chọn "Đặt làm thư mục chính", "Tạo thư mục con".
  - Click phải vào vùng trống: kiểm tra tùy chọn chuyển Grid/Detail, Refresh, Unmark All.
