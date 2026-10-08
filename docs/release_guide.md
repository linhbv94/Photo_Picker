# Phát hành và tự cập nhật VXPhotos

> Ngày cập nhật: 2026-10-07. Phiên bản bootstrap khuyến nghị: 1.0.7.

Bản nháp `v1.0.6` dừng ở test Windows do đường dẫn ESM. Bản `v1.0.7` sửa lỗi này; merge PR sửa lỗi trước khi push tag mới. Chạy lại job của tag cũ vẫn dùng script cũ.
> Repo: [linhbv94/Photo_Picker](https://github.com/linhbv94/Photo_Picker).

## 1. Cách vận hành

```text
Sửa code → tăng version → push tag vX.Y.Z
    → GitHub Actions build Windows x64 + macOS Apple Silicon + macOS Intel
    → tạo GitHub Release nháp với bộ cài, chữ ký và latest.json
    → kiểm tra bản build → Publish release
    → app đã cài tự kiểm tra khi mở → Cập nhật & khởi động lại
```

GitHub Actions là máy build. GitHub Releases lưu bộ cài và manifest updater.
Tauri Updater tải gói phù hợp với OS/CPU, kiểm tra chữ ký rồi cài tại chỗ.
Không cần máy Windows, hosting riêng, tài khoản cloud hay server cập nhật.
UI vẫn là Tauri WebView hiện có; bộ cài và Rust backend được build native cho từng nền tảng.

App tự kiểm tra một lần khi mở bản production. Có thể kiểm tra lại trong **Cài đặt → Giới thiệu**.
Khi có bản mới, thông báo hiện nút **Cập nhật & khởi động lại**: bấm một lần để app tải, cài, mở lại.
Đã chọn cho người dùng quyết định thời điểm restart, tránh cắt ngang thao tác đổi tên/di chuyển ảnh hoặc phát media.
Mất mạng lúc mở app không chặn sử dụng. Lỗi kiểm tra thủ công có thể xem chi tiết và thử lại.
Bản development/browser không chạy updater. Với VXMedia đa cửa sổ, updater chỉ chạy ở cửa sổ `main` để tránh hai cửa sổ cài đồng thời; nếu đã đóng cửa sổ chính thì mở lại app để cập nhật.

## 2. Chi phí và giới hạn

| Hạng mục | Cấu hình này |
| --- | --- |
| GitHub Actions build | Runner tiêu chuẩn, repo public: miễn phí |
| Lưu bộ cài | GitHub Release assets, không dùng GitHub Packages/LFS |
| Actions cache/artifact | Không tạo, không bật cache |
| Xác minh gói updater | Khóa Tauri tự tạo: miễn phí |
| Chữ ký macOS | Ad-hoc: miễn phí, chưa notarize |
| Chữ ký Windows | Chưa dùng chứng chỉ Authenticode trả phí |
| Server/domain | Không cần |

Workflow chỉ chạy khi push tag hoặc chạy thủ công trên tag đã có; không build mỗi lần push code.
Mọi job có điều kiện chỉ chạy trên repo public. Dùng `windows-2022`, `macos-15`, `macos-15-intel`, `ubuntu-24.04`, đều là runner tiêu chuẩn.
Không dùng larger runner, cache trả phí, workflow artifacts hoặc dịch vụ cập nhật thương mại.
Điều kiện miễn phí dựa trên chính sách GitHub đã kiểm tra ngày 2026-10-07; cần giữ repo public và cấu hình runner này.

Giới hạn thực tế: bản miễn phí có thể bị Gatekeeper/SmartScreen cảnh báo. Chữ ký updater chứng minh gói đến từ đúng khóa phát hành, nhưng không thay thế chứng chỉ tin cậy của OS.
macOS ad-hoc không tránh được cảnh báo lần đầu, và không thể cam kết mọi phiên bản macOS/Windows đều không hỏi lại. Nếu muốn phân phối Mac với Developer ID/notarization thông thường, cần Apple Developer trả phí; cấu hình hiện tại không sử dụng dịch vụ đó.

Nguồn: [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [runner tiêu chuẩn](https://docs.github.com/en/actions/reference/runners/github-hosted-runners), [Release assets](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases), [Tauri Updater](https://v2.tauri.app/plugin/updater/), [macOS ad-hoc signing](https://v2.tauri.app/distribute/sign/macos/).

## 3. Cấu hình GitHub một lần

Khóa riêng đã tạo tại `.release_keys/vxphotos.key`, quyền đọc/ghi chỉ cho tài khoản hiện tại; cả folder đã nằm trong `.gitignore`.
Public key đã gắn vào [tauri.conf.json](../src-tauri/tauri.conf.json). Không tạo khóa mới cho mỗi version.

1. Vào [Settings → Secrets and variables → Actions](https://github.com/linhbv94/Photo_Picker/settings/secrets/actions).
2. Chọn **New repository secret**.
3. Name: `TAURI_SIGNING_PRIVATE_KEY`.
4. Trong Terminal, đứng ở root repo, chạy:

   ```sh
   pbcopy < .release_keys/vxphotos.key
   ```

5. Dán vào Secret value, lưu. Không dán khóa vào chat/issue hoặc commit vào Git.
6. Khóa đã tạo không có password. Không cần tạo `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`; workflow truyền chuỗi rỗng khi secret này chưa được đặt.
7. Sao lưu riêng `.release_keys/vxphotos.key` ở nơi an toàn. Mất khóa sẽ không thể phát hành gói tương thích với public key trong app đang cài. Hai app dùng hai khóa riêng.

`GITHUB_TOKEN` được Actions cấp tự động; không cần PAT, không cần thêm secret này.
Repo cần bật Actions và cho phép các action trong workflow. Nếu upload báo 403, kiểm tra quyền `contents: write` và chính sách **Settings → Actions → General** của repo/organization.

## 4. Phát hành bản đầu tiên có updater

Phiên bản đã được đồng bộ thành `1.0.7` trong npm package/lockfile và Tauri/Cargo.
Thay đổi được gửi qua PR nháp. Sau khi đã thêm secret, xem và merge PR vào `main` trên GitHub. Tiếp theo chạy ở root repo:

```sh
git switch main
git pull --ff-only origin main
npm ci
npm run test:updates
npm run release:check
npm run build
git tag v1.0.7
git push origin v1.0.7
```

Không push tag trước khi merge PR. Nhánh `main` local phải chứa updater và workflow mới.
Khóa riêng ở `.release_keys/` không đi vào PR. Giữ và sao lưu thư mục này khi chuyển nhánh.

Vào [Actions](https://github.com/linhbv94/Photo_Picker/actions), chờ đủ `prepare`, ba job `build` và `validate` xanh.
Build được chạy tuần tự để các nền tảng cùng cập nhật `latest.json` mà không ghi đè nhau.
Vào [Releases](https://github.com/linhbv94/Photo_Picker/releases), mở bản nháp, xem asset:

- Windows x64: file `setup.exe` dùng cho cả cài lần đầu và updater.
- macOS Apple Silicon: DMG có `aarch64` để cài lần đầu và archive `.app.tar.gz` cho updater.
- macOS Intel: DMG có `x64`/`x86_64` để cài lần đầu và archive `.app.tar.gz` cho updater.
- `latest.json`: đủ `windows-x86_64`, `darwin-aarch64`, `darwin-x86_64`; URL gắn với đúng tag, chữ ký không rỗng.

Tổng cộng **6 assets upload**: 1 manifest, 1 bộ cài Windows, 2 DMG và 2 archive Mac. File `.sig` vẫn được Tauri sinh và Action đọc khi tạo manifest, nhưng không upload riêng vì nội dung chữ ký đã nằm trong `latest.json`. Khi xác minh chữ ký thật, dùng trường `signature` của platform tương ứng. Hai mục Source code do GitHub tự sinh vẫn xuất hiện bên dưới. [Tauri Action](https://github.com/tauri-apps/tauri-action) xác nhận tùy chọn `uploadUpdaterSignatures` không ảnh hưởng tạo manifest.

Tải và kiểm tra mở app, mở thư mục/file, thao tác chính trên máy tương ứng. Sau khi job `validate` xanh và smoke test đạt, bấm **Publish release** (stable, không chọn prerelease).
Bản nháp chưa được app đang cài nhìn thấy. Workflow cố ý không tự publish để tránh phát tán bộ cài chưa được kiểm tra thực tế.

Bản cũ hiện tại chưa có updater: cần tải/cài phiên bản `1.0.7` này một lần. Từ bản này trở đi, app có thể tự tải/cài cập nhật.

## 5. Cài trên Windows và macOS

**Windows:** tải `setup.exe`, chạy bộ cài. NSIS cài theo user hiện tại để updater hoạt động với cùng quyền; không cần Rust/Node/Git trên máy dùng app.
App dùng Microsoft WebView2; bộ cài Tauri xử lý runtime nếu thiếu. Nếu SmartScreen chặn, kiểm tra đúng repo/asset rồi dùng **More info → Run anyway** khi tùy chọn đó xuất hiện. Chính sách máy công ty có thể cần admin cho phép.

**macOS:** tải đúng DMG theo CPU, kéo `VXPhotos.app` vào **Applications**, eject DMG rồi mở app từ Applications. Không chạy bản cập nhật trực tiếp trong DMG chỉ đọc.
Nếu bị chặn, mở **System Settings → Privacy & Security → Open Anyway**, rồi xác nhận mở.
Nếu macOS báo app hỏng và không có Open Anyway, chỉ với app vừa tải từ đúng repo này, có thể gỡ quarantine cho đúng bundle:

```sh
xattr -dr com.apple.quarantine /Applications/VXPhotos.app
```

Không tắt Gatekeeper toàn hệ thống. Nếu Applications không cho user hiện tại ghi, dùng thư mục `~/Applications` để updater thay app tại chỗ.

## 6. Những lần phát hành sau

Ví dụ bản kế tiếp, sau khi đã commit các sửa đổi tính năng trên `main`:

```sh
git switch main
git pull --ff-only origin main
npm run version:set -- 1.0.7
npm run test:updates
npm run release:check
npm run build
git add .
git diff --cached --stat
git commit -m "release: v1.0.7"
git push origin main
git tag v1.0.7
git push origin v1.0.7
```

Script [set_version.mjs](../scripts/set_version.mjs) cập nhật version đồng thời trong package.json, package-lock.json, tauri.conf.json, Cargo.toml và Cargo.lock. Badge trong phần Giới thiệu lấy version từ package nên không cần sửa tay.
Chờ Actions, kiểm tra bản nháp, Publish release. Khi mở app cũ sẽ có thông báo cập nhật.
Không sửa bộ cài của release đã publish hoặc dùng lại cùng tag; sửa lỗi bằng version tăng mới.
Không đổi identifier của app hoặc public key: các dữ liệu/cấu hình và chuỗi xác minh cập nhật đang gắn với chúng.

Nếu build lỗi, sửa code rồi ưu tiên tạo version/tag mới. Có thể chạy lại job trên bản nháp nếu commit của tag chưa đổi và đã sửa secret/quyền trên GitHub. Chạy thủ công qua **Actions → Desktop release → Run workflow**, nhập tag đã tồn tại.

## 7. Kiểm tra trước khi coi auto-update hoàn tất

- Cài release `1.0.7` trên macOS và Windows.
- Publish một version cao hơn rồi mở bản cũ: phát hiện đúng bản mới.
- Bấm cập nhật: tải đúng OS/CPU, cài và mở lại, badge version tăng.
- Kiểm tra cấu hình người dùng còn nguyên, file ảnh/media không bị thay đổi do cập nhật.
- Ngắt mạng rồi mở app: sử dụng bình thường; kiểm tra thủ công báo lỗi và thử lại được.
- Với VXMedia, cập nhật từ cửa sổ chính và kiểm tra tình huống có cửa sổ phụ.

Kiểm thử logic có trong [test_updates.mjs](../scripts/test_updates.mjs). Kiểm tra manifest có trong [validate_updater.mjs](../scripts/validate_updater.mjs); script cũng chuẩn hóa URL GitHub REST asset thành URL download public gắn đúng tag.
Để xác nhận trọn luồng updater thật, bắt buộc có hai version đã publish và máy dùng từng OS; kiểm thử mô phỏng/build cục bộ không thay thế bước này.


## Kiểm tra lại draft sau khi build đã thành công

Nếu ba build đã đạt nhưng validator cũ báo `Could not read draft release: HTTP 404`, merge PR sửa pipeline. Không cần đổi version hoặc build lại: vào **Actions → Validate existing draft release → Run workflow**, chọn nhánh `main` và nhập tag bản nháp hiện tại. Workflow đọc release bằng ID, kiểm tra/chuẩn hóa `latest.json`, giữ nguyên bộ cài và trạng thái draft. Tag phải khớp version app của nhánh đang chạy.

Run release cũ vẫn giữ trạng thái lỗi lịch sử. Run validation mới xanh cùng smoke test đạt là cơ sở để Publish bản nháp hiện có. Không bấm chạy lại workflow cũ của tag cũ: workflow đó vẫn chứa script cũ.
