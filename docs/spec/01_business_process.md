# Business Process Specification: VXTriage (`_spec1_business_process`)

> **Module:** Nghiệp vụ Phân loại & Tuyển chọn Ảnh (Media Culling & Triage Workflows)  
> **Tài liệu cha:** [00_system_overview.md](00_system_overview.md)  
> **Kiến trúc áp dụng:** Option C (Tauri React Shell + Rust Media Core + Native Platform Adapters)  
> **Trạng thái:** Hoàn chỉnh (V1.1)  

---

## 1. Mục tiêu Nghiệp vụ (Business Objective)

Quy trình Triage ảnh được xây dựng nhằm giải quyết bài toán xử lý lượng ảnh khổng lồ sau một buổi chụp ảnh (event, du lịch, chụp sản phẩm) hoặc khi dọn dẹp thư viện ảnh cá nhân:
1. **Phân luồng tức thì (Instant Ingestion):** Chọn thư mục cha, hệ thống nạp toàn bộ ảnh và ánh xạ cấu trúc cây thư mục con sang Left Sidebar mà không chiếm diện tích hiển thị nội dung chính.
2. **Lọc sạch rác (Noise Elimination):** Phát hiện và tách bạch ảnh chụp máy ảnh thật (có EXIF Camera) khỏi ảnh màn hình (Screenshots) và ảnh mạng xã hội bị nén/lột metadata (Facebook, Zalo).
3. **Thao tác nhanh gọn bằng bàn phím & chuột:** Kết hợp duyệt nhanh bằng Spacebar (Native Quick Look trên macOS / Peek HUD trên Windows), đánh dấu (Marking) nhiều ảnh qua Shift + Click, xoay ảnh chuẩn xác và kéo thả phân loại vào thư mục con hoặc đổi tên hàng loạt.

---

## 2. Sơ đồ Luồng Nghiệp vụ Swimlane (Cross-Functional Workflow - Option C)

```text
┌──────────────┬──────────────────┬───────────────────┬──────────────────────┬──────────────────────┐
│  Người dùng  │ UI Shell (React) │ Media Core (Rust) │ Platform Adapter     │   Hệ điều hành / OS  │
│              │                  │                   │ (Swift / Win32)      │                      │
└──────┬───────┴─────────┬────────┴─────────┬─────────┴──────────┬───────────┴──────────┬───────────┘
       │                 │                  │                    │                      │
       │ 1. Chọn thư mục │                  │                    │                      │
       ├────────────────>│ 2. Gửi lệnh nạp  │                    │                      │
       │                 ├─────────────────>│ 3. Quét tệp thư mục│                      │
       │                 │                  ├────────────────────┼─────────────────────>│
       │                 │                  │<───────────────────┼──────────────────────┤ Trả file list
       │                 │<─────────────────┤ 4. Trả file items  │                      │
       │                 │ 5. Render Grid   │    (Fast scan)     │                      │
       │                 │    (Hiện tức thì)│                    │                      │
       │                 │                  │ 6. Priority Sched: │                      │
       │                 │                  │    - Hàng 1: Thumbs├─────────────────────>│ Yêu cầu Thumbs
       │                 │                  │    - Hàng 2: EXIF  │<─────────────────────┤ Trả Thumbs cache
       │                 │<─────────────────┤ 7. Stream EXIF     │                      │
       │                 │ 8. Cập nhật tag  │    chunk stream    │                      │
       │                 │                  │                    │                      │
       │ 9. Nhấn Space   │ 10. Gửi IPC Open │                    │                      │
       │    xem nhanh    │     Preview      │ 11. Kích hoạt      │                      │
       ├────────────────>├─────────────────>│     Platform Adp. ─┼─────────────────────>│ Hiện Native QL
       │                 │                  │                    │                      │ (hoặc Peek HUD)
       │ 12. Shift+Click │ 13. Tính dải     │                    │                      │
       │     để Mark dải │     trên visible │                    │                      │
       ├────────────────>│     Store        │                    │                      │
       │                 │                  │                    │                      │
       │ 14. Bấm Xoay 90°│ 15. Gửi Rotate   │ 16. Lossless DCT   │                      │
       │     (Phím R)    ├─────────────────>│     Transform      ├─────────────────────>│ Ghi đè file đĩa
       │                 │                  │ 17. Notify Cache ──┼─────────────────────>│ Ép Finder/Win
       │                 │<─────────────────┤ 18. Trả kết quả    │                      │ làm mới Thumbs
       │                 │ 19. Bust cache   │                    │                      │
       ▼                 ▼                  ▼                    ▼                      ▼
```

---

## 3. Quy tắc Nghiệp vụ Phân loại Nguồn Ảnh (Camera vs Non-Camera Rules)

Hệ thống cung cấp một nút lọc nhanh (Quick Filter Chips) trên thanh công cụ nhằm phân tách dữ liệu ảnh theo 3 nhóm nghiệp vụ:

### 3.1. Bảng Tiêu chí Phân loại (Classification Rules)

| Phân nhóm | Dấu hiệu EXIF nhận diện | Phần mềm / Nguồn gốc thường gặp | Trạng thái hiển thị mặc định |
| :--- | :--- | :--- | :--- |
| **Ảnh Máy ảnh thật (True Camera)** | Có cả 2 trường `Make` (Nhà sản xuất) và `Model` (Mã máy). Có thể có thêm `FocalLength`, `FNumber`, `ISOSpeedRatings`. | Sony, Canon, Nikon, Fujifilm, iPhone, Samsung Galaxy, Pixel... | Ưu tiên hàng đầu trong Triage. |
| **Ảnh Chụp màn hình (Screenshots)** | Thường không có `Make`/`Model`. Tên file thường chứa định dạng chuẩn (`Screenshot_*`, `Screen Shot*`, `Ảnh chụp màn hình*`) hoặc phần mở rộng mặc định là PNG/WebP. | macOS Screen Capture, Windows Snipping Tool, Android Screenshot. | Tách riêng hoặc ẩn nhanh bằng 1 click. |
| **Ảnh Mạng xã hội / Bị Strip EXIF** | Không có thẻ EXIF nào (đã bị lột sạch metadata) hoặc chỉ có thẻ chỉnh sửa cơ bản (`Software: Photoshop`, `GIMP`). Dung lượng nén thấp. | Tải từ Facebook, Zalo, Telegram, Messenger, Instagram. | Gom vào nhóm "Non-camera / Social". |

### 3.2. Luồng Lọc Dữ liệu (Filtering Logic)
1. Khi người dùng bấm chip **"Chỉ hiện ảnh chụp máy ảnh (Camera Only)"**:
   - Hệ thống áp dụng bộ lọc: `item.exif.camera_make != null && item.exif.camera_model != null`.
2. Khi người dùng bấm chip **"Lọc theo Thiết bị (Camera Model Dropdown)"**:
   - Dropdown tự động tổng hợp danh sách các Model xuất hiện trong folder hiện tại (ví dụ: `ILCE-7M4 (Sony)`, `iPhone 15 Pro`, `Canon EOS R6`).
   - Chọn một máy ảnh cụ thể sẽ chỉ giữ lại ảnh của thiết bị đó trên màn hình làm việc.

---

## 4. Ma trận Quyết định Hành động (Action Decision Table - Option C)

| Hành động | Điều kiện kích hoạt | Phạm vi tác động | Cơ chế an toàn | Hành vi Hệ thống & Nền tảng |
| :--- | :--- | :--- | :--- | :--- |
| **Quick Preview** | Nhấn phím `Space` khi đang Focus 1 item | Chỉ duy nhất 1 ảnh `selected_id` | Tự đóng khi bấm `Space` hoặc `Esc` | • macOS: Kích hoạt Native `QLPreviewPanel` của hệ điều hành.<br>• Windows: Mở cửa sổ Frameless Floating HUD kiểu PowerToys Peek. |
| **Mở bằng Trình xem Mặc định (System Viewer)** | Nhấp đúp chuột (Double Click) hoặc phím `Enter` | Chỉ duy nhất 1 ảnh `selected_id` | Mở ứng dụng ngoài độc lập với app | • macOS: Mở bằng Preview.app (hoặc app mặc định Finder).<br>• Windows: Mở bằng Windows Photos (hoặc viewer mặc định). |
| **Mark / Unmark đơn lẻ** | Click chuột vào checkbox / góc Mark của thẻ ảnh | Chỉ item được click | Toggle trạng thái của ID trong `marked_ids` | Không thay đổi file |
| **Range Mark** | Giữ phím `Shift` + click thẻ ảnh đích | Dải ảnh từ mốc `last_marked_anchor` đến ảnh đích | Chỉ tính trên danh sách đang hiển thị (sau sort/filter) | Không thay đổi file |
| **Lossless Rotate 90°** | Bấm nút Rotate hoặc phím tắt `R` | Nếu có Marked → xoay toàn bộ Marked; nếu không → xoay Selected | Chỉ áp dụng với JPEG/PNG/HEIC có quyền ghi | • Core Rust: Biến đổi Lossless DCT, chuẩn hóa EXIF `Orientation = 1`.<br>• macOS: Bắn signal `noteFileSystemChanged`.<br>• Windows: Gọi `SHChangeNotify(SHCNE_UPDATEITEM)`. |
| **Kéo thả di chuyển (Drag to Folder)** | Kéo selection / marked thả vào folder ở sidebar | Nếu có Marked → chuyển toàn bộ Marked; nếu không → chuyển Selected | Safe Move: Nếu cross-volume, copy sang `.tmp` ở đích → verify → xóa nguồn | Cập nhật filesystem, xóa file nguồn khi an toàn |
| **Batch Rename** | Bấm nút Rename hoặc phím tắt `F2` | Toàn bộ ảnh trong `marked_ids` (hoặc toàn bộ folder nếu chưa mark) | Bật hộp thoại Preview Diff trước khi xác nhận; cơ chế Two-phase rename | Đổi tên tệp theo chuỗi `YYYYMMDD_HHMM_xx.ext`, có ghi nhật ký Operation Journal |
