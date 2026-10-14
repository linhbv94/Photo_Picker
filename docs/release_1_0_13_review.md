# VXPhotos 1.0.13 — QA độc lập và phát hành

Ngày: 2026-10-14.

## Phạm vi và kết quả

Native Apple Silicon: mở thư mục fixture PNG, Cancel không đổi thư mục; focus/ArrowDown mở Recent1/5, click mở lại đúng ảnh. Guards giữ mutation/file-dialog/rename; backend safety không đổi.

Frontend/bundle, updater/release regression và Rust safety30passed1ignored đạt; recent đạt.

Đã review đổi tên repo/endpoint/settings và manifest/lock versions. Giữ bundle identifier và khóa updater cũ; Clean giữ certificate signer cũ. Không gom docs/log ngoài scope vào release.

## Giới hạn

GUI kiểm tra trên Apple Silicon. Pure mouse-hover chưa kiểm tra native; focus/keyboard/click Recent đã kiểm tra ở Photos/Clean, Media dựa trên shared component/source và regression. Windows/Intel GUI chưa chạy trong lượt này. Media/Photos chờ build CI Windows+haiMac; Clean chỉ haiMac, không phát hành Windows ở track này.

CI/package/signature/tamper/icon/public sẽ ghi sau khi xác minh.

## Kết quả public

[Release1.0.13](https://github.com/linhbv94/VXPhotos/releases/tag/v1.0.13) stable/latest, SHA c75470d989dfc74bddb313a61a85af63b79015a8. Build38588672837 và publish38593965524 success. Sáu assets/ba package signatures+tamper rejection đạt; haiMac metadata/architecture/codesign/icon tại tag/DMG khớp updater đạt. Endpoint mới và Photo_Picker cũ trả1.0.13, sáu assets public200 không token. Chưa chạy lại old→new updater E2E trong lượt này. [Evidence](release_1_0_13_evidence.json).
