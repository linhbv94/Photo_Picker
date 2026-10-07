# VXTriage — Photo Picker & Media Triage Utility

> **VXTriage** (`photo_picker`) là tiện ích desktop chuyên dụng giúp lọc, phân loại, tuyển chọn (culling) và dọn dẹp thư viện ảnh tốc độ cao dành cho macOS và Windows.
>
> Ứng dụng giải quyết triệt để các hạn chế của **macOS Finder** (thiếu cột EXIF tùy biến, không phân loại được ảnh máy ảnh thật vs screenshot/ảnh mạng, thao tác xoay và đổi tên hàng loạt phức tạp).
>
> **Mô hình Kiến trúc (Option C):** 
> - **UI Shell (95% Dùng chung):** Tauri v2 WebView (React 18 + TypeScript + Tailwind CSS) tuân thủ [master_theme.md](../master_theme.md).
> - **Media Core (100% Dùng chung):** Rust Native Engine (Fast File Scanner, Header-only EXIF, Lossless JPEG DCT Transformer, Atomic Renamer & Operation Journal).
> - **Platform Adapter (~5% Đặc thù):** 
>   - *macOS:* Swift Tauri Plugin kích hoạt Native `QLPreviewPanel` (Quick Look chuẩn Mac), Apple ImageIO, và `noteFileSystemChanged`.
>   - *Windows:* Frameless Peek-like HUD Window, Windows Shell API `IShellItemImageFactory`, và `SHChangeNotify`.

---

## 📚 Hệ thống Tài liệu Đặc tả Kỹ thuật (Specification Suite)

Bộ đặc tả được xây dựng đầy đủ theo chuẩn hệ thống công cụ zTools:

- 📋 [00_system_overview.md](./docs/spec/00_system_overview.md): Tổng quan hệ thống, Tôn chỉ, Phân tích 5 điểm nghẽn kỹ thuật khó nhất & Kiến trúc phân lớp 3 tầng (`_spec0_system`).
- 🔄 [01_business_process.md](./docs/spec/01_business_process.md): Sơ đồ Swimlane quy trình Triage, Quy tắc phân loại Camera vs Non-camera & Ma trận quyết định (`_spec1_business_process`).
- ⚙️ [02_feature_flow.md](./docs/spec/02_feature_flow.md): Luồng chi tiết: Máy trạng thái Selection vs Marking, Priority Scheduler, Pipeline Xoay Lossless & Đổi tên an toàn 2 pha (`_spec2_feature_flow`).
- 🎨 [03_ui_wireframe.md](./docs/spec/03_ui_wireframe.md): Thiết kế giao diện theo [VX Master Theme](../master_theme.md), Cây folder Left Sidebar, Grid View & Detail Table, Spacebar Quick Preview theo từng OS, Info Drawer `(i)` (`_spec3_ui_wireframe`).
- 🔌 [04_api_data.md](./docs/spec/04_api_data.md): Hợp đồng IPC Commands giữa Tauri Rust Core và React TypeScript, Thumbnail Pipeline, Schemas FileItem, ExifMetadata, Event Streaming & Mã lỗi (`_spec4_api_data`).
- 🧪 [05_qa_acceptance.md](./docs/spec/05_qa_acceptance.md): Tiêu chuẩn nghiệm thu Gherkin (AC-01 → AC-10), Ma trận Edge Cases (10k file, thẻ SD Read-Only, Cross-volume move) & Smoke Test Checklist (`_spec5_qa_acceptance`).
- 🎬 [06_demo_presentation.md](./docs/spec/06_demo_presentation.md): Kịch bản trình diễn nghiệm thu 7 bước (DoD Playbook) & Hướng dẫn dựng Test Fixtures (`_spec6_demo_presentation`).

---

## 📌 Nguồn gốc Yêu cầu (Original Requirements)
- Xem ghi chú thô ban đầu tại [scratch.md](./scratch.md).


## Phát hành Windows/macOS và tự cập nhật

Phiên bản `1.0.7` thêm kiểm tra cập nhật khi mở app và nút cập nhật trong Cài đặt → Giới thiệu. GitHub Actions build bộ cài Windows x64, macOS Apple Silicon và Intel bằng runner tiêu chuẩn cho repo public. Xem [hướng dẫn cấu hình khóa ký, phát hành và cài đặt](docs/release_guide.md).
