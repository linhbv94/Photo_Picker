# VXPhotos 1.0.11 — Kiểm chứng phát hành

Ngày cập nhật: 2026-10-11.

- User giao phát hành và publish VXPhotos; VXClean chờ yêu cầu riêng. Patch này chứa safety fixes từ [báo cáo bản sửa](data_safety_fix_report.md), thông báo PNG và R/Shift+R cuối.
- Local: Rust 30 tests đạt, 1 child chỉ do parent chạy để kiểm chứng abort/recovery; 10 bridge error cases đạt; frontend build đạt; updater/release 18 tests đạt, ca Windows riêng skip trên Mac. Release config, workflow actionlint và diff whitespace đạt.
- JPEG thật 64×48 qua pipeline production: 4×90° có 0/3072 pixel đổi, max channel delta 0. Windows core và tests type-check MSVC đạt. Mac debug App 1.0.11 build cuối + codesign deep/strict đạt; updater artifacts tắt riêng ở gói QA local, CI tạo và ký gói updater đầy đủ.
- PR Windows lượt đầu phát hiện script bridge không bỏ static imports ở checkout CRLF; đã chuẩn hóa CRLF trước parse và chạy lại. Đây là lỗi harness, chưa là bằng chứng native Windows lỗi hoặc đạt.
- [PR #10](https://github.com/linhbv94/Photo_Picker/pull/10) đã merge; tag `v1.0.11` trỏ commit `693e46661e68410da88870906dbbba856e1acac6`. [Windows PR CI](https://github.com/linhbv94/Photo_Picker/actions/runs/38118482590) success: 28 Rust Windows tests, 10 bridge cases và updater regression đạt.
- [Release CI](https://github.com/linhbv94/Photo_Picker/actions/runs/38118760515) thất bại Windows: test updater gọi cargo cold-build trước safety tests, quá giới hạn 180 giây (`spawnSync cargo ETIMEDOUT`). Đã yêu cầu hủy run, không publish 1.0.11 và giữ tag nguyên. Chuyển sang [1.0.12](release_1_0_12.md) để sửa thứ tự compile/tests và tăng timeout test có giới hạn; không sửa logic ứng dụng sau QA.
- Native WKWebView gói Mac 1.0.11 cuối trên hai ảnh tổng hợp riêng: R preview 90°; Escape không đổi hai SHA-256; Shift+R preview 270°→confirm thành công→Undo trả JPEG về SHA-256 gốc; PNG bị chặn với wording đúng, SHA-256 giữ nguyên. App QA đã thoát. Không dùng ảnh user.
- QA WKWebView trên fixture của lượt sửa trước được ghi ở báo cáo safety; Windows/WebView2 GUI, Mac Intel GUI, removable/network filesystem và updater install/restart lên 1.0.11 chưa được nghiệm thu. Build/CI không thay QA runtime.
- Giữ public key, bundle identifier và updater endpoint. Repo PUBLIC; pipeline chỉ dùng standard hosted runners, không cache/workflow artifacts hoặc dịch vụ ký trả phí. Đã đối chiếu [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) ngày 2026-10-11.
