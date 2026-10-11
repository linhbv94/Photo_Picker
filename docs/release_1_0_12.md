# VXPhotos 1.0.12 — Kiểm chứng phát hành

Ngày cập nhật: 2026-10-11. User giao release/publish Photos, VXClean chờ yêu cầu riêng.

- Bản public trước là 1.0.10. Draft/tag 1.0.11 không publish vì test Windows cold-build vượt 180 giây; giữ tag bất biến. 1.0.12 chứa toàn bộ safety fixes và PNG/R/Shift+R đã QA ở [báo cáo 1.0.11](release_1_0_11.md); chỉ thay version và harness/workflow để sửa timeout.
- Workflow chạy `test:safety` trước `test:updates` để native regression dùng binary đã compile; test xoay Windows timeout hữu hạn 10 phút. PR Windows cũng dùng thứ tự này. Không bỏ/skips tests để vượt lỗi.
- Local safety: 30 Rust tests +10 bridge cases; JPEG production 4×90° 0/3072 pixel đổi; MSVC core/tests type-check. Frontend/native Mac và updater/release checks đã ghi ở báo cáo 1.0.11. Native WKWebView R/Shift+R/Escape/Undo/PNG trên fixture đạt; không dùng ảnh user.
- PR/release CI, signatures và public endpoint đang chờ kiểm chứng; chưa ghi nhận đã publish trong bước chuẩn bị.
- Windows/WebView2 GUI, Intel GUI, removable/network filesystem và updater install/restart lên bản mới chưa nghiệm thu. Backup/Undo vẫn giữ dung lượng; metadata filesystem có giới hạn trong [báo cáo safety](data_safety_fix_report.md).
- Giữ key/identifier/endpoint; repo PUBLIC và chỉ standard hosted runners, không cache/artifacts hoặc dịch vụ ký trả phí. [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) đã kiểm tra ngày 2026-10-11.
