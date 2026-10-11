# VXPhotos — Nghiệm thu Windows an toàn dữ liệu

Ngày cập nhật: 2026-10-11. Bản sửa đã public ở [1.0.12](https://github.com/linhbv94/Photo_Picker/releases/tag/v1.0.12), tag commit `ceb8be3691687d755275d6f389affd2c5234ecf9`. Core safety giống bản1.0.11 đã QA; draft1.0.11 không publish. Không dùng bản phát hành 1.0.10 cũ. Mọi thử nghiệm dùng ảnh sao chép/fixture riêng, không dùng bộ gốc.

## Môi trường cần có

Windows 10/11 x64, WebView2 Runtime; Node 22.18 trở lên, Rust stable MSVC, Visual Studio Build Tools (Desktop development with C++, Windows SDK). Không cần Python/PowerShell để engine xoay hoạt động.

```text
npm ci
npm run build
npm run test:safety
npm run test:updates
npm run tauri dev
```

`test:safety` chạy core production, filesystem primitives Windows và subprocess crash/recovery. `test:updates` có test rotation Unicode chạy trên Windows. Nếu có lỗi, giữ nguyên output và hồ sơ; không tự sửa bằng overwrite/delete.

## Checklist runtime

- [ ] Tạo folder có JPEG lệch hướng, JPEG có ngày chụp, JPEG thiếu EXIF, PNG; tên chứa tiếng Việt, dấu nháy, `#`, `%`, khoảng trắng; thêm folder đích có tên trùng nhưng nội dung khác.
- [ ] Chọn JPEG, R: preview đúng danh sách; Escape/Cancel không thay hash. Xác nhận xoay → thumbnail và Windows Photos hiển thị đúng; Shift+R quay ngược. Undo trả SHA-256 đúng bản đầu.
- [ ] PNG/HEIC/RAW/TIFF: xoay bị từ chối, không sửa file. JPEG readonly/file đang bị khóa: lỗi thật, không success giả.
- [ ] Rename thiếu EXIF: mặc định skip; bật mtime mới có proposal và nhãn mtime. Đích đã tồn tại hoặc được tạo sau preview: không ghi đè. Undo tên bị chiếm: giữ cả hai, báo conflict.
- [ ] Drag/drop MOVE: có confirmation; cancel giữ nguồn. Đích trùng: preview tên có suffix, giữ nguyên tệp cũ. Đóng/restart app → mở folder nguồn → Undo tìm được journal và phục hồi.
- [ ] COPY cùng folder/hardlink/reparse point bị chặn. Copy đích khác: hash khớp, source không đổi. Sửa/thay source sau preview → apply bị từ chối.
- [ ] Trash/Delete: có confirmation; source biến mất chỉ sau xác nhận, backup còn. Undo trên app khôi phục hash và mtime; giữ tệp mới cùng tên nếu có conflict. Test OS Recycle Bin trên NTFS local và ghi lại volume không hỗ trợ recycle.
- [ ] MOVE khác ổ NTFS: output hash khớp, bản gốc giữ trong hồ sơ nguồn; Undo phục hồi nguồn và giữ output đích. Kiểm tra lỗi khóa/quyền, hết dung lượng, tháo ổ đích trên fixture; không coi partial là thành công toàn batch.
- [ ] File/junction/hardlink hoặc tên đích được thay sau preview: không sửa tệp ngoài danh sách, không overwrite. Network/removable khác NTFS chỉ nghiệm thu sau test riêng.

SHA-256 dùng `Get-FileHash -Algorithm SHA256` hoặc `certutil -hashfile <path> SHA256`. Báo kết quả kèm OS, filesystem, commit/source, output tests và journal liên quan; không gửi ảnh riêng tư hoặc log chứa dữ liệu cá nhân không cần thiết.

Windows core đã type-check trên Mac; [Windows PR CI](https://github.com/linhbv94/Photo_Picker/actions/runs/38118482590) đã chạy đạt frontend, 28 Rust tests, 10 bridge cases và updater regression. Các ô GUI/WebView2 trên vẫn chưa được đánh dấu pass thay cho thử trên máy Windows thật. [Release CI1.0.12](https://github.com/linhbv94/Photo_Picker/actions/runs/38119415227) cả3 targets và validate đã success; chữ ký gói Windows public đã xác minh. Trạng thái release cuối: [báo cáo phát hành](release_1_0_12.md).
