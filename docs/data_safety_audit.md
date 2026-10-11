# VXPhotos — Audit an toàn dữ liệu, vòng đầu

Ngày kiểm chứng: 2026-10-09. Source HEAD: `2bda37ff896735800776b22366b3e027f80965f0` (version local 1.0.10). Nền tảng thực thi: macOS 26.7, ARM64, tài khoản thường.

**Trạng thái lịch sử:** Audit dưới đây ghi nhận source trước sửa. User đã giao sửa; hiện trạng và bằng chứng mới ở [data_safety_fix_report.md](data_safety_fix_report.md). Các scripts audit hiện chạy regression của bản sửa.

**Kết luận tại thời điểm audit: chưa đạt điều kiện dùng các thao tác ghi trên bộ ảnh gốc hoặc khuyến nghị phát hành tiếp các thao tác này.** Đã tái hiện mất nội dung/ghi đè trên fixture; không chỉ có rủi ro suy từ source. Audit này chưa sửa production source, chưa kiểm chứng GUI/installer và chưa phát hành bản sửa.

Các thay đổi README, system overview và UI wireframe có từ trước được giữ nguyên. Backend và bridge được kiểm tra không có local diff so với HEAD. Không suy rằng app đang cài trên máy user chắc chắn chạy đúng source này.

## 1. Phạm vi và cách kiểm chứng

- Đọc toàn bộ các commands native, bridge, handlers ghi file trong App, Sidebar drag/drop và ContextMenu; đối chiếu API/QA contracts.
- Biên dịch thân hàm Rust production bằng dependencies local đã build; chỉ bỏ macro `#[tauri::command]` trong bản sao tạm để gọi trực tiếp. Không viết lại thuật toán trong harness.
- Ép native invoke reject khi chạy thân bridge TypeScript trong Node VM; đây là kiểm chứng nhánh bridge, không phải IPC/WebView E2E.
- Sinh ảnh RGB 64×48 → JPEG bằng sips; gọi chính `rotate_single_file` 4 lần, giải mã trước/sau bằng sips → PNG và so pixel RGB. Không dùng ảnh user.
- Tất cả nội dung bị đổi/xóa trong tests là fixture tự tạo trong thư mục tạm. Không gọi Trash thật, không thao tác bộ ảnh gốc, không cấp admin/FDA.
- Không chạy Windows hoặc macOS Intel. Không kiểm thử kill process/power loss, mất ổ giữa chừng, restore Trash, JPEG metadata, HEIC/RAW/TIFF, hardlink, network volume hoặc GUI xác nhận.

## 2. Findings chặn nghiệm thu thao tác ghi

| ID | Mức | Finding và bằng chứng | Hướng xử lý / điều kiện đóng |
|---|---|---|---|
| PH_SAFE_01 | P1 | Rename ghi đè đích xuất hiện sau preview. Tái hiện: preview A→B khi B chưa có; tạo B chứa `UNRELATED_TARGET`; apply báo success=1, B thành `SOURCE`, A biến mất. [rename.rs](../src-tauri/src/commands/rename.rs), phase 2. | Primitive publish/rename phải bảo đảm không ghi đè tại thời điểm thao tác; không chỉ kiểm tra `exists`. Test conflict sau preview, hai executor đồng thời và destination alias theo OS. |
| PH_SAFE_02 | P1 | Apply nhận hai source cùng target, báo success=2 nhưng chỉ còn nội dung source thứ hai. Không xác thực duplicate source/target hay giữ phạm vi thư mục của rename; gọi A→thư mục khác cũng thành công. | Xác thực batch và phạm vi ở backend; từ chối batch không hợp lệ trước mutation. Test duplicate, alias/case insensitive, vòng rename và source đổi sau preview. |
| PH_SAFE_03 | P1 | COPY vào cùng thư mục nguồn gọi `fs::copy(src, src)`: fixture 16 byte thành **0 byte**, response success=1. UI đã đọc hiện chủ yếu gọi MOVE; ca này chứng minh lỗi command COPY, chưa chứng minh có thao tác COPY cùng folder trên GUI hiện tại. | Chặn same-file bằng identity, bao gồm hardlink/symlink alias; copy phải create-new/staging + verify + publish không ghi đè. |
| PH_SAFE_04 | P1 | Dangling symlink ở tên đích vượt kiểm tra `exists`. MOVE thay mất symlink; COPY đi theo symlink và tạo nội dung ngoài destination folder. Tái hiện cả hai. Kiểm tra tồn tại rồi ghi vẫn có khoảng race với đích được tạo sau đó. | Policy symlink rõ; kiểm tra parent/entry/identity và primitive không follow/no-clobber phù hợp OS. Test dangling link, parent link, swap entry sau preview. |
| PH_SAFE_05 | P1 | MOVE fallback bỏ qua lỗi xóa nguồn nhưng vẫn success. Tái hiện trên cùng volume bằng thư mục nguồn mode 0555: rename không được, copy đích thành công, unlink nguồn thất bại; response success=1 dù cả nguồn và đích còn tồn tại. | Phân biệt completed move với copied-but-source-retained; trả per-file result và giữ recovery record. Không fallback copy cho mọi lỗi rename mà không phân loại nguyên nhân. |
| PH_SAFE_06 | P1 | Xoay JPEG macOS không lossless trên fixture: 4×90° trở lại 64×48, **3.069/3.072 pixel RGB khác**, channel delta lớn nhất 65. Helper production gọi sips trực tiếp trên nguồn. Windows dùng decode/RotateFlip/Save rồi Copy overwrite nguồn; chưa test runtime Windows. | Dùng đường transform phù hợp cam kết và định dạng; giữ bản gốc trước khi thay thế, verify output, publish/recovery an toàn. Test DCT/pixel theo cam kết, EXIF/GPS/ICC/XMP/orientation và lỗi giữa ghi. Không tiếp tục gọi lossless khi chưa đạt. |
| PH_SAFE_07 | P1 | Ép invoke reject: rotate, rename, Trash vẫn trả success mock; create-subfolder trả folder giả; read-directory trả danh sách demo. Move/copy là control: đã truyền exception đúng. [tauriApi.ts](../src/services/tauriApi.ts). | Desktop luôn truyền lỗi thật. Mock chỉ cho dev browser và không được biến lỗi desktop thành dữ liệu demo. Test lỗi thật đi tới UI. |
| PH_SAFE_08 | P1 | UI bỏ qua failed_paths/failed_count ở rotate, rename, move; Trash bỏ qua count backend và báo theo số được yêu cầu. Native Trash nuốt lỗi mỗi file, chỉ trả count. Đọc source; chưa thực thi Trash. [App.tsx](../src/App.tsx), [platform.rs](../src-tauri/src/commands/platform.rs). | Kết quả từng file: succeeded/failed/skipped/recovery_required, kèm lỗi và đường dẫn thực. UI báo partial, giữ lựa chọn thất bại; không toast success cho toàn bộ batch. |
| PH_SAFE_09 | P1 | Rename chuyển source sang `.tmp_rename_uuid`, mapping chỉ giữ trong RAM; không thấy journal bền vững/Undo tương ứng. Rollback lỗi bị bỏ qua. Crash có thể để file ẩn mà scanner bỏ qua. Đây là phân tích source, chưa kill-process để tái hiện. | Journal bền vững trước mutation, recovery sau restart; recovery không ghi đè file mới và báo rõ file còn ở đâu. Test kill tại từng phase + rollback conflict/lỗi quyền. |
| PH_SAFE_10 | P1 | Rotate, drag/drop MOVE và Trash chạy ngay; phím Delete gọi Trash không confirmation. Context menu folder có thể chuyển toàn bộ folder vào Trash. Không có backend preview token/identity liên kết scan với mutation; chưa test file bị thay tại cùng path. | Xác nhận rõ danh sách/phạm vi trước mutation theo master backlog. Ràng buộc operation plan với source identity và xác thực lại lúc apply; tuần tự hóa mutations để tránh thao tác chồng nhau. |

P1 ở đây nghĩa là chặn nghiệm thu thao tác ghi liên quan. Không có bằng chứng dữ liệu user đã bị mất; các trường hợp mất dữ liệu đều trên fixture.

## 3. Các thiếu hụt bổ sung

- `fallback_to_mtime=false` và file không EXIF vẫn sinh `image_<now>`; đã tái hiện. Cần trạng thái unknown/skip, không tự phát minh capture time. UI hiện gọi preview với fallback mtime mặc định true; cần cho người dùng biết provenance trước áp dụng.
- Preview không xác thực ngày bằng parser ngày/tháng/giờ; chưa kiểm chứng metadata lỗi/Unicode hoặc timezone trên ảnh/video thật. Thiếu trường provenance/confidence để phân biệt EXIF với mtime.
- Copy fallback chỉ so size, chưa xác minh nội dung hoặc durability; chưa có bằng chứng bảo toàn timestamps/xattrs/metadata filesystem. Size bằng nhau không chứng minh copy nội dung đúng.
- Auto-name đích dùng vòng `exists` rồi mutate; khi vượt 9999 candidates, code có thể quay lại target ban đầu đã tồn tại. Đây là đọc source, chưa tạo 9999 collisions để thực thi.
- Scan non-recursive theo `p.is_file()` có thể đọc symlink; các lỗi read_dir/entry bị bỏ qua. Camera/screenshot filter coi thiếu EXIF là screenshot: chưa đủ để quyết định xóa ảnh.
- Clipboard CUT macOS không xử lý `is_cut` ở adapter; thao tác paste do Finder/Explorer thực hiện nằm ngoài transaction của app. Chưa nghiệm thu clipboard runtime.
- Windows mở viewer qua `cmd /C start`; cần kiểm tra đường dẫn đặc biệt qua shell trên Windows, chưa kết luận có exploit.
- Asset scope `**` rộng; cần đánh giá thu hẹp theo folder được chọn khi xử lý boundary bảo mật. Chưa chứng minh khai thác hoặc rò rỉ dữ liệu.

## 4. Bằng chứng có thể chạy lại

Từ root app:

```text
python3 scripts/audit_data_safety.py
node scripts/audit_bridge_errors.mjs
python3 scripts/audit_rotation.py
```

- Rust harness: **8/8 reproductions đạt**, tức tái hiện đúng 8 hành vi đã ghi nhận là lỗi/thiếu kiểm soát; đây KHÔNG phải 8 safety tests pass.
- Bridge harness: tái hiện 5 nhánh fallback sau native error, 1 control truyền lỗi đúng.
- Rotation: fixture JPEG cho kết quả nêu tại PH_SAFE_06.
- Dependencies Rust lấy từ `src-tauri/target/debug/deps`; cần local cargo build nếu không có. Rust filesystem harness dành cho Unix/macOS, cần tài khoản thường để test mode 0555. Node harness dùng `stripTypeScriptTypes` có ở Node đã chạy (26.5.0).
- Các script là reproductions cho source hiện tại. Khi sửa production, các assertions tái hiện lỗi phải được chuyển thành assertions bảo toàn dữ liệu; không đưa bộ hiện tại vào CI dưới nhãn safety-pass.

Source SHA-256 đã chạy:

```text
exif_reader.rs 8ac2ce6c36c5bf0bd28c36be464b1515b9e0868a9f5f3650aa2e5ecd39317c00
rename.rs      580c24773c19b87228ed05bf08c9c2a4b460bbed0726b16ed5971736ef688e71
move_copy.rs   6c78bd89c274f123e3b2b995d8a773e1a9d1038e2457904e42154267321aa8bf
rotate.rs      51acd7baee756bd080ccb0b18bdb99e2b5c85ab455a50fd6afb21f352dadd26a
```

## 5. Thứ tự sửa và tiêu chí dùng dữ liệu thật

1. Desktop không fallback mock; per-file error/result thống nhất và UI hiển thị partial đúng. Tạm chặn thao tác không đáp ứng safety contract nếu cần trong bản sửa.
2. No-clobber/identity/serialization cho rename và move/copy; chặn same-file, symlink và batch không hợp lệ. Không coi `exists` là khóa.
3. Journal/recovery cho rename/move; thử crash, source changed, target conflict, read-only, disk full, mất volume. Mọi lỗi phải xác định được vị trí và nội dung còn lại của mỗi file.
4. Sửa rotate theo từng định dạng/platform. Ưu tiên giữ nguyên bản gốc; chỉ cho ghi khi đã chứng minh đúng cam kết. Trường hợp chưa hỗ trợ phải từ chối rõ.
5. Xác nhận Trash/MOVE/rotate và kiểm chứng restore trên fixture native. Không dùng ảnh gốc để chứng minh recovery.
6. Build đúng artifact từ source đã sửa; chạy app native end-to-end trên các OS/architecture công bố. Ghi version/commit/artifact và giới hạn từng thao tác.

Chỉ nghiệm thu từng thao tác khi: source đã sửa, regression kiểm chứng bất biến dữ liệu đạt, recovery thực đã diễn tập và app native của platform tương ứng đạt. Nếu chưa có Windows runtime thì không đánh dấu Windows verified.

Vòng audit này đủ bằng chứng để từ chối dùng thao tác ghi trên ảnh gốc, chưa đủ để cấp kết luận an toàn cho các thao tác đó. Duyệt/xem/đánh dấu trong app có thể dùng tách khỏi mutation, nhưng chưa được nghiệm thu toàn diện ở vòng này. Bản sao độc lập giữ ngoài folder đang xử lý vẫn cần cho lần sử dụng có ghi dữ liệu đầu tiên sau sửa.
