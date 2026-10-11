# VXPhotos — Bản sửa an toàn dữ liệu

Ngày cập nhật: 2026-10-11. Nền source: 1.0.10 / `2bda37f`; bản sửa đang chuẩn bị phát hành 1.0.11. [Audit trước sửa](data_safety_audit.md) là bằng chứng lịch sử, không mô tả engine hiện tại. Trạng thái CI/publish cuối được ghi trong [báo cáo phát hành](release_1_0_11.md).

## Thay đổi đã triển khai

| Nhóm rủi ro | Kiểm soát hiện tại |
|---|---|
| Rename ghi đè / request giả | Preview có token dùng một lần, hết hạn 15 phút. Apply phải khớp nguồn/đích/thứ tự đã preview; kiểm tra toàn batch trước mutation. Không nhận duplicate identity/target hoặc rename sang folder khác. Đích đã tồn tại, kể cả vòng rename, bị từ chối. |
| COPY tự làm rỗng nguồn / symlink | Chặn cùng folder và hardlink alias. Chỉ nhận regular file; chặn symlink/reparse point. Copy vào staging `create_new`, kiểm tra SHA-256 và size, sync rồi publish bằng primitive không ghi đè. Bảo toàn mtime và permissions khi copy. |
| MOVE báo thành công sai | Chỉ fallback khi lỗi khác volume (`EXDEV` / Windows 17). Lỗi quyền/khóa không fallback. Khác volume: copy kiểm chứng → publish → chuyển bản gốc vào backup cùng volume nguồn; lỗi trả theo file, giữ hồ sơ và nội dung. |
| Rotate nén lại ảnh | Bỏ sips/GDI+/PowerShell. JPEG chỉnh EXIF Orientation trong Rust, giữ byte của compressed stream và marker khác EXIF. Có xoay trái/phải, R/Shift+R. Không chuẩn hóa Orientation về 1 và không gọi đây là DCT. |
| Native lỗi nhưng bridge giả success | Desktop truyền lỗi invoke thật, cả commands đọc và ghi. Mutation trên browser dev bị chặn từ preview. UI giữ bảng kết quả/lỗi, số hoàn tất/thất bại và lựa chọn file lỗi. |
| Ghi ngay / crash không phục hồi | MOVE, COPY, ROTATE, TRASH đều preview danh sách và xác nhận. Mutations được tuần tự hóa. Journal JSONL append + sync trước/sau phase; có nút Phục hồi / Undo đọc lại từ đĩa, không ghi đè tệp mới. |

Scan phân biệt EXIF đang đọc với đã đọc nhưng thiếu; không coi pending là screenshot, giữ chunk đến trước response và hủy scan cũ bằng generation.

Rename mặc định không dùng mtime. Thiếu ngày chụp hợp lệ thì giữ tên và hiện lý do; checkbox mtime là opt-in có provenance. Không dùng thời gian hiện tại để phát minh ngày chụp.

Trash chỉ nhận tệp thường, không nhận cả thư mục. Trước khi giao OS Trash: tạo bản sao trong transaction riêng, kiểm SHA-256/size và sync; chuyển nguyên bản gốc vào backup không ghi đè, kiểm identity và lưu journal. OS nhận bản sao; Undo app dùng nguyên bản gốc, giữ inode và metadata filesystem của bản gốc. Undo phục hồi từ backup, kể cả khi OS không có Recycle Bin trên volume đó. Nếu Trash lỗi sau staging, file có thể nằm trong hồ sơ thay vì tên nguồn; bảng lỗi chỉ dẫn phục hồi, không báo hoàn tất giả.

macOS publish dùng `renameatx_np(RENAME_EXCL)` và pin hai parent directory. Windows dùng `MoveFileExW` không `REPLACE_EXISTING`/`COPY_ALLOWED`, pin ancestor directories bằng handles không share-delete. Windows mở viewer bằng opener, không nội suy đường dẫn vào `cmd /C start`.

## Bằng chứng kiểm chứng

- `npm run test:safety`: 10 ca bridge ép invoke reject; Rust 30 passed, 0 failed. Một child test được đánh dấu ignored để chỉ parent gọi: parent thực sự spawn/abort ở 4 phase rename/copy/rotate và phục hồi byte gốc; không phải bỏ kiểm chứng crash.
- `python3 scripts/audit_rotation.py`: JPEG thật 64×48, 4×90°, 0/3072 pixel RGB thay đổi, max channel delta 0; gọi pipeline preview/journal production.
- Rust kiểm tra conflict sau preview, duplicate/forged request, token replay, source sửa/thay inode, same-folder, dangling symlink/hardlink, lỗi quyền, Undo conflict, Trash backup, EXIF little/big endian, giữ offsets dữ liệu, XMP conflict và JPEG lỗi.
- `python3 scripts/check_windows_safety.py`: core production và tests type-check target `x86_64-pc-windows-msvc` trên Mac. Đây không phải full app Windows build hoặc runtime.
- Frontend `npm run build` đạt. Updater/release regression: 18 passed, Windows-specific test skipped trên Mac.
- Gói native Mac debug build + codesign deep/strict đạt với updater artifacts tắt riêng cho QA; không cần khóa updater/release. GUI WKWebView đã kiểm tra preview cancel, rotate, lỗi PNG, thiếu EXIF, opt-in mtime, rename, Undo và Trash trên fixture tự tạo. Undo rotate/Trash trả đúng SHA-256 ban đầu, Trash/Undo bản cuối giữ identity, mtime và SHA-256; Delete có confirmation và scan cuối đếm đủ fixture; đóng/mở lại app vẫn đọc được journal rename và Undo tên gốc.
- Workflow Windows đã thêm Rust tests, bridge tests và frontend build. Chưa push/dispatch nên chưa có kết quả CI Windows của thay đổi này.

## Giới hạn và cách dùng

- Xoay hiện chỉ hỗ trợ JPEG baseline/progressive có metadata cấu trúc phù hợp, tối đa 256 MB. HEIC/PNG/RAW/TIFF bị từ chối trước ghi; JPEG có XMP Orientation mâu thuẫn, EXIF lỗi/duplicate hoặc cấu trúc chưa hỗ trợ cũng bị chặn. Trình xem phải tôn trọng EXIF Orientation.
- Giữ compressed stream/marker không đồng nghĩa mọi phần mềm camera đọc được mọi MakerNote. Đã test cấu trúc/offset, chưa có corpus camera/GPS/ICC/thumbnail thực tế đủ rộng.
- Backup/output phục hồi được giữ, chưa có nút purge hoặc tự xóa. Không xóa `.vxphotos_operations` hay `.vxphotos_stage_*` khi chưa kiểm tra hồ sơ; Trash/MOVE khác volume chưa giải phóng toàn bộ dung lượng nguồn. COPY Undo giữ output ở staging; MOVE khác volume Undo giữ bản sao đích.
- Copy bảo toàn nội dung, mtime và permissions cơ bản; chưa cam kết bảo toàn birthtime, ACL, xattrs, NTFS alternate streams hoặc resource forks. Rotate giữ metadata nhúng và bản gốc, output mới chưa cam kết metadata filesystem đầy đủ.
- Chưa nghiệm thu Windows/WebView2, macOS Intel, filesystem mạng/removable, rút ổ, hết dung lượng/power loss phần cứng. Windows sync file/journal và rename write-through, chưa có directory fsync tương đương Mac. Process crash tests không thay thử mất điện.
- Clipboard Cut/Paste do Finder/Explorer thực hiện nằm ngoài transaction/Undo của app. Bộ lọc “Screenshots” dựa vào thiếu metadata camera không chứng minh đó là screenshot; luôn kiểm tra danh sách xác nhận trước Trash.
- Bản phát hành/đang cài 1.0.10 chưa tự nhận các sửa này. Checklist máy Windows: [windows_data_safety_checklist.md](windows_data_safety_checklist.md).
