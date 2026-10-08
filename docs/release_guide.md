# Phát hành VXPhotos

> Cập nhật: 2026-10-08. Quy trình dùng cho các version tiếp theo; không thay bộ cài của release đã publish.

## Giao việc cho agent

Sau khi build và thử bản local, nhắn:

> Local đã test OK. Release và publish app này; tự chọn patch version tiếp theo, viết note từ thay đổi thực tế và xử lý toàn bộ quy trình.

Agent đọc repo, trạng thái Git và diff; ghi nhận commit/code đã được test. Agent tăng version nếu cần, viết `docs/release_notes/<version>.md`, chạy kiểm tra, commit/PR và merge khi CI đạt, tạo tag, chờ ba build native, rồi chạy **Publish tested release**. Lệnh này bao gồm quyền merge/tag/publish cho bản đang giao; không cần hỏi lại ở từng bước. Chỉ yêu cầu thêm thông tin nếu code chưa rõ, có thay đổi của người khác chưa được phép đưa vào release hoặc gặp chặn quyền thực tế.

Nếu chỉ nhắn “release để test”, agent dừng ở draft. Không tự publish chỉ vì có tag. Local QA xác nhận đúng phần code đã thử; nếu agent sửa code ứng dụng sau đó, phải test lại phần thay đổi đó. Thay metadata version/note không cần lặp QA toàn bộ.

## Pipeline

1. Tag `vX.Y.Z` trỏ tới commit chứa code, version đồng bộ, note và workflow mới.
2. **Desktop release** tạo hoặc tái sử dụng draft; build Windows x64, Mac Apple Silicon và Mac Intel trên standard runners của repo public.
3. Validate đủ 6 assets, đúng platform và URL; tải gói updater và xác minh chữ ký thật với public key trong config; chuẩn hoá `latest.json` và note.
4. Sau khi user giao publish và xác nhận local QA, agent dispatch **Publish tested release**. Workflow kiểm tra build thành công của đúng commit, version cao hơn latest, lặp xác minh gói, rồi publish stable/latest.
5. Workflow kiểm tra endpoint manifest và gói tải được công khai. Nếu bước này thất bại sau publish, kiểm tra lại endpoint; không ghi đè bộ cài hay publish lại cùng version.

Hai workflow dùng chung concurrency cho cùng tag để không build/validate/publish đồng thời. Upload matrix tuần tự để tránh ghi đè platform trong manifest. Không tạo cache hoặc workflow artifacts, không dùng larger runners. [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

## File tải xuống và release note

| File | Mục đích |
| --- | --- |
| `vxphotos_X.Y.Z_windows_x64_setup.exe` | Cài lần đầu và updater Windows |
| `vxphotos_X.Y.Z_macos_silicon.dmg` | Cài lần đầu Mac dòng chip M |
| `vxphotos_X.Y.Z_macos_intel.dmg` | Cài lần đầu Mac Intel |
| `vxphotos_X.Y.Z_macos_silicon.app.tar.gz` | Updater Mac dòng chip M |
| `vxphotos_X.Y.Z_macos_intel.app.tar.gz` | Updater Mac Intel |
| `latest.json` | Manifest chứa version, URL và chữ ký |

Tên lấy động từ `productName`, lowercase/snake_case. Không đổi bundle identifier, public key hoặc tên app bên trong bộ cài. `releaseAssetNamePattern` của [Tauri Action](https://github.com/tauri-apps/tauri-action) đổi tên upload đồng thời cập nhật URL manifest. Không upload `.sig` riêng; hai source archives vẫn do GitHub tự thêm.

Agent viết note theo version: vài bullet về thay đổi thực tế người dùng thấy được, không bịa tính năng. Script tự thêm ba link bộ cài và hướng dẫn cài/cập nhật. Không đưa CI, key, signing, manifest, QA hoặc hướng dẫn publish vào note công khai. Gói updater không cần link trong note.

## Lệnh agent vận hành

```sh
npm run version:set -- X.Y.Z
# Viết docs/release_notes/X.Y.Z.md từ diff đã đọc.
npm run test:updates
npm run release:check
# Chạy build/check cần thiết với code thay đổi; không làm mất code đã test.
# Commit các file được giao, mở PR và merge sau khi checks xanh.
git tag vX.Y.Z COMMIT_DA_MERGE
git push origin vX.Y.Z
# Tìm run của release.yml theo đúng tag/commit, chờ kết quả thành công.
gh workflow run publish_release.yml --ref main -f tag=vX.Y.Z -f local_qa_passed=true
# Chờ publish run và kiểm tra release/endpoint công khai.
```

`version:set` đồng bộ package.json, package-lock.json, Tauri và Cargo. Không chạy `git add .` nếu còn file ngoài phạm vi. Tag đã public là bất biến; lỗi cần đổi app code thì tăng version mới. Tạo tag bằng token Actions có thể không phát sinh workflow mới; nếu cần, dispatch `release.yml` trên tag hiện hữu. Run cũ của tag cũ luôn dùng script cũ.

## Secrets và cài đặt một lần

Repo: [VXPhotos](https://github.com/linhbv94/Photo_Picker). Private updater key ở `.release_keys/`, nằm ngoài Git; giữ backup và dùng lại cho mọi version. Repository secret `TAURI_SIGNING_PRIVATE_KEY` chứa nội dung key; `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` chỉ khi key có password. Không in hoặc đưa key/token vào chat, PR hay assets. `GITHUB_TOKEN` do Actions cấp; không cần thêm PAT cho workflow.

Nếu Secrets UI báo lỗi, kiểm tra server/quyền và secret metadata; không tạo key mới để chữa lỗi UI. Không gửi key thay user khi chưa được phép rõ ràng.

Windows mở bộ cài. Mac chọn đúng DMG, kéo app vào Applications và mở từ đó; không chạy bản cập nhật trong DMG chỉ đọc. Bản phân phối hiện tại chưa có OS certificate trả phí nên máy có thể yêu cầu cho phép mở lần đầu. Thao tác cho phép riêng app, không tắt bảo vệ OS toàn hệ thống.

## Chẩn đoán và mức kiểm chứng

- Windows ESM preload: dùng `pathToFileURL(...).href`, test trên Windows với đường dẫn có khoảng trắng, `#`, `%`.
- Draft 404: tìm release qua danh sách có auth, dùng release ID; tag endpoint phục vụ published release. `validate_draft_release.yml` sửa manifest legacy của draft mà không build lại; chưa tự xác minh chữ ký hoặc publish.
- App vẫn không thấy update: kiểm tra đúng repo/app, stable đã publish, endpoint công khai, version và public key. Draft luôn chưa dùng được qua endpoint public; không chờ vô hạn để chữa 404 của draft.
- Action Node deprecation: dùng phiên bản action đã hỗ trợ runtime mới, kiểm tra runner tương thích; warning không tự giải thích lỗi build.
- Ba build xanh chứng minh compile/package; không chứng minh UX trên thiết bị thật. Lần đầu cần test cài/mở và thao tác chính trên từng OS. Luồng updater thực tế cần bản cũ đã cài và bản cao hơn đã publish.

Bản bootstrap của app là `1.0.7`. App chưa có updater cần cài thủ công một lần. Agent báo rõ nền tảng chưa thử GUI; không biến thiếu thiết bị Windows thành vòng hỏi quyền publish nếu user đã chấp nhận release sau local QA.
