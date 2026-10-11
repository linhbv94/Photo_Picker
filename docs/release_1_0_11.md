# VXPhotos 1.0.11 — Kiểm chứng phát hành

Ngày cập nhật: 2026-10-11.

- User giao phát hành và publish VXPhotos; VXClean chờ yêu cầu riêng. Patch này chứa safety fixes từ [báo cáo bản sửa](data_safety_fix_report.md), thông báo PNG và R/Shift+R cuối.
- Local: Rust 30 tests đạt, 1 child chỉ do parent chạy để kiểm chứng abort/recovery; 10 bridge error cases đạt; frontend build đạt; updater/release 18 tests đạt, ca Windows riêng skip trên Mac. Release config, workflow actionlint và diff whitespace đạt.
- JPEG thật 64×48 qua pipeline production: 4×90° có 0/3072 pixel đổi, max channel delta 0. Windows core và tests type-check MSVC đạt. Mac debug App 1.0.11 build cuối + codesign deep/strict đạt; updater artifacts tắt riêng ở gói QA local, CI tạo và ký gói updater đầy đủ.
- PR Windows lượt đầu phát hiện script bridge không bỏ static imports ở checkout CRLF; đã chuẩn hóa CRLF trước parse và chạy lại. Đây là lỗi harness, chưa là bằng chứng native Windows lỗi hoặc đạt.
- Release workflow chạy thêm safety tests trên cả Windows x64, Mac Silicon và Mac Intel trước đóng gói. Chờ PR checks, build CI và xác minh chữ ký thật trước publish; chưa ghi nhận phát hành public trong bước chuẩn bị.
- QA WKWebView trên fixture của lượt sửa trước được ghi ở báo cáo safety; Windows/WebView2 GUI, Mac Intel GUI, removable/network filesystem và updater install/restart lên 1.0.11 chưa được nghiệm thu. Build/CI không thay QA runtime.
- Giữ public key, bundle identifier và updater endpoint. Repo PUBLIC; pipeline chỉ dùng standard hosted runners, không cache/workflow artifacts hoặc dịch vụ ký trả phí. Đã đối chiếu [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) ngày 2026-10-11.
