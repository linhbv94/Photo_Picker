use super::{
    file_safety::*, jpeg_orientation::rotated_jpeg, move_copy::move_or_copy_files, rename::*,
    rotate::rotate_lossless,
};
use std::{
    fs,
    path::{Path, PathBuf},
};

struct Fixture(PathBuf);
impl Fixture {
    fn new() -> Self {
        let p = std::env::temp_dir().join(format!("vxphotos_safety_{}", uuid::Uuid::new_v4()));
        fs::create_dir(&p).unwrap();
        Self(fs::canonicalize(p).unwrap())
    }
    fn file(&self, name: &str, bytes: &[u8]) -> PathBuf {
        let p = self.0.join(name);
        fs::write(&p, bytes).unwrap();
        p
    }
    fn dest(&self) -> PathBuf {
        let p = self.0.join("dest");
        fs::create_dir(&p).unwrap();
        p
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
fn s(p: &Path) -> String {
    p.to_str().unwrap().into()
}
fn rename_preview(p: &Path) -> Vec<RenameDiffItem> {
    preview_batch_rename(vec![s(p)], None, Some(true)).unwrap()
}
fn entry(a: &Path, b: &Path) -> Entry {
    Entry {
        source: s(a),
        target: s(b),
        expected: snapshot(a).unwrap(),
    }
}
fn jpeg() -> Vec<u8> {
    vec![
        0xff, 0xd8, 0xff, 0xe2, 0, 6, 1, 2, 3, 4, 0xff, 0xc0, 0, 2, 0xff, 0xda, 0, 2, 9, 8, 7,
        0xff, 0xd9,
    ]
}

#[test]
fn rename_conflict_after_preview_keeps_both_files() {
    let f = Fixture::new();
    let a = f.file("ảnh_gốc.jpg", b"SOURCE");
    let diff = rename_preview(&a);
    let target = PathBuf::from(&diff[0].new_path);
    fs::write(&target, b"OTHER").unwrap();
    assert!(apply_batch_rename(diff).is_err());
    assert_eq!(fs::read(a).unwrap(), b"SOURCE");
    assert_eq!(fs::read(target).unwrap(), b"OTHER");
}
#[test]
fn forged_duplicate_targets_fail_before_mutation() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"FIRST");
    let b = f.file("b.jpg", b"SECOND");
    let mut diff = preview_batch_rename(vec![s(&a), s(&b)], None, Some(true)).unwrap();
    diff[1].new_path = diff[0].new_path.clone();
    assert!(apply_batch_rename(diff).is_err());
    assert_eq!(fs::read(a).unwrap(), b"FIRST");
    assert_eq!(fs::read(b).unwrap(), b"SECOND");
}
#[test]
fn copy_and_move_same_folder_refused() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    for action in ["COPY", "MOVE"] {
        assert!(preview_file_operation(vec![s(&a)], action.into(), Some(s(&f.0)), None).is_err());
    }
    assert_eq!(fs::read(a).unwrap(), b"ORIGINAL");
}
#[test]
fn copy_keeps_existing_target_and_full_content() {
    let f = Fixture::new();
    let a = f.file("a.jpg", &vec![71; 150000]);
    let dest = f.dest();
    fs::write(dest.join("a.jpg"), b"OTHER").unwrap();
    let plan = preview_file_operation(vec![s(&a)], "COPY".into(), Some(s(&dest)), None).unwrap();
    let r = move_or_copy_files(vec![s(&a)], s(&dest), "COPY".into(), Some(plan.token)).unwrap();
    assert_eq!(r.success_count, 1);
    assert_eq!(fs::read(dest.join("a.jpg")).unwrap(), b"OTHER");
    assert_eq!(
        fs::read(dest.join("a_1.jpg")).unwrap(),
        fs::read(&a).unwrap()
    );
    assert_eq!(
        snapshot(&a).unwrap().modified_ns,
        snapshot(&dest.join("a_1.jpg")).unwrap().modified_ns
    );
}
#[test]
fn copy_conflict_created_after_preview_never_overwrites() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let dest = f.dest();
    let plan = preview_file_operation(vec![s(&a)], "COPY".into(), Some(s(&dest)), None).unwrap();
    fs::write(dest.join("a.jpg"), b"NEW").unwrap();
    assert!(move_or_copy_files(vec![s(&a)], s(&dest), "COPY".into(), Some(plan.token)).is_err());
    assert_eq!(fs::read(a).unwrap(), b"ORIGINAL");
    assert_eq!(fs::read(dest.join("a.jpg")).unwrap(), b"NEW");
}
#[test]
fn native_rename_exclusion_blocks_race() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let target = f.file("b.jpg", b"FOREIGN");
    assert!(rename_exclusive(&a, &target).is_err());
    assert_eq!(fs::read(a).unwrap(), b"ORIGINAL");
    assert_eq!(fs::read(target).unwrap(), b"FOREIGN");
}
#[test]
fn consumed_preview_cannot_execute_again() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let dest = f.dest();
    let plan = preview_file_operation(vec![s(&a)], "MOVE".into(), Some(s(&dest)), None).unwrap();
    let token = plan.token;
    let r = move_or_copy_files(vec![s(&a)], s(&dest), "MOVE".into(), Some(token.clone())).unwrap();
    assert_eq!(r.success_count, 1);
    assert!(move_or_copy_files(vec![s(&a)], s(&dest), "MOVE".into(), Some(token)).is_err());
    assert_eq!(fs::read(dest.join("a.jpg")).unwrap(), b"ORIGINAL");
}
#[test]
fn edited_source_same_size_is_rejected() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"AAA");
    let diff = rename_preview(&a);
    fs::write(&a, b"BBB").unwrap();
    assert!(apply_batch_rename(diff).is_err());
    assert_eq!(fs::read(a).unwrap(), b"BBB");
}
#[test]
fn replaced_source_same_bytes_is_rejected() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"AAA");
    let diff = rename_preview(&a);
    fs::rename(&a, f.0.join("old.jpg")).unwrap();
    fs::write(&a, b"AAA").unwrap();
    assert!(apply_batch_rename(diff).is_err());
    assert_eq!(fs::read(a).unwrap(), b"AAA");
}
#[test]
fn rename_undo_preserves_new_source_conflict() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let diff = rename_preview(&a);
    let target = PathBuf::from(&diff[0].new_path);
    let result = apply_batch_rename(diff).unwrap();
    fs::write(&a, b"NEW").unwrap();
    assert!(restore_file_operation(result.results[0].journal_path.clone().unwrap(), true).is_err());
    assert_eq!(fs::read(a).unwrap(), b"NEW");
    assert_eq!(fs::read(target).unwrap(), b"ORIGINAL");
}
#[test]
fn recovery_infers_rename_done_before_journal_commit() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let b = f.0.join("b.jpg");
    let e = entry(&a, &b);
    let j = Journal::new("RENAME", &e).unwrap();
    rename_exclusive(&a, &b).unwrap();
    restore_file_operation(j.journal_path, true).unwrap();
    assert_eq!(fs::read(a).unwrap(), b"ORIGINAL");
    assert!(!b.exists());
}
#[test]
fn recovery_restores_original_after_rotation_interruption() {
    let f = Fixture::new();
    let a = f.file("a.jpg", &jpeg());
    let e = entry(&a, &a);
    let mut j = Journal::new("ROTATE", &e).unwrap();
    fs::write(&j.stage, rotated_jpeg(&jpeg(), 90).unwrap()).unwrap();
    let out = snapshot(Path::new(&j.stage)).unwrap();
    j.output_expected = Some(out.clone());
    j.output_hash = Some(out.sha256);
    j.save("output_ready").unwrap();
    rename_exclusive(&a, Path::new(&j.backup)).unwrap();
    // No save after moving source: represents a crash at that boundary.
    restore_file_operation(j.journal_path, true).unwrap();
    assert_eq!(fs::read(a).unwrap(), jpeg());
}
#[test]
fn rotation_backup_survives_recovery_conflict() {
    let f = Fixture::new();
    let a = f.file("a.jpg", &jpeg());
    let e = entry(&a, &a);
    let j = Journal::new("ROTATE", &e).unwrap();
    rename_exclusive(&a, Path::new(&j.backup)).unwrap();
    fs::write(&a, b"FOREIGN").unwrap();
    assert!(restore_file_operation(j.journal_path.clone(), true).is_err());
    assert_eq!(fs::read(a).unwrap(), b"FOREIGN");
    assert_eq!(fs::read(j.backup).unwrap(), jpeg());
}
#[test]
fn rotate_and_undo_restore_original_bytes() {
    let f = Fixture::new();
    let a = f.file("ảnh # % ' gốc.jpg", &jpeg());
    let plan = preview_file_operation(vec![s(&a)], "ROTATE".into(), None, Some(90)).unwrap();
    let r = rotate_lossless(vec![s(&a)], 90, Some(plan.token)).unwrap();
    assert_eq!(r.success_count, 1);
    assert_eq!(fs::read(&a).unwrap(), rotated_jpeg(&jpeg(), 90).unwrap());
    restore_file_operation(r.results[0].journal_path.clone().unwrap(), true).unwrap();
    assert_eq!(fs::read(a).unwrap(), jpeg());
}
#[test]
fn non_jpeg_rotation_is_refused_without_mutation() {
    let f = Fixture::new();
    let a = f.file("a.png", b"PNG");
    assert_eq!(
        preview_file_operation(vec![s(&a)], "ROTATE".into(), None, Some(90)).unwrap_err(),
        "Chưa hỗ trợ xoay PNG. Tệp được giữ nguyên."
    );
    assert_eq!(fs::read(a).unwrap(), b"PNG");
    assert!(!f.0.join(".vxphotos_operations").exists());
}
#[test]
fn missing_date_does_not_invent_new_filename() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"NO_EXIF");
    let diff = preview_batch_rename(vec![s(&a)], None, Some(false)).unwrap();
    assert_eq!(diff[0].new_filename, "a.jpg");
    assert!(diff[0].skip_reason.is_some());
    assert!(apply_batch_rename(diff).is_err());
    assert_eq!(fs::read(a).unwrap(), b"NO_EXIF");
}
#[test]
fn copy_undo_does_not_move_replaced_target() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let dest = f.dest();
    let plan = preview_file_operation(vec![s(&a)], "COPY".into(), Some(s(&dest)), None).unwrap();
    let r = move_or_copy_files(vec![s(&a)], s(&dest), "COPY".into(), Some(plan.token)).unwrap();
    let target = dest.join("a.jpg");
    fs::rename(&target, dest.join("old.jpg")).unwrap();
    fs::write(&target, b"ORIGINAL").unwrap();
    assert!(restore_file_operation(r.results[0].journal_path.clone().unwrap(), true).is_err());
    assert_eq!(fs::read(target).unwrap(), b"ORIGINAL");
}
#[test]
fn duplicate_source_identity_is_rejected() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let b = f.0.join("b.jpg");
    fs::hard_link(&a, &b).unwrap();
    let dest = f.dest();
    assert!(
        preview_file_operation(vec![s(&a), s(&b)], "MOVE".into(), Some(s(&dest)), None).is_err()
    );
    assert!(a.exists() && b.exists());
}
#[test]
fn invalid_action_and_missing_confirmation_fail_closed() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let dest = f.dest();
    assert!(move_or_copy_files(vec![s(&a)], s(&dest), "typo".into(), None).is_err());
    assert!(move_or_copy_files(vec![s(&a)], s(&dest), "MOVE".into(), None).is_err());
    assert_eq!(fs::read(a).unwrap(), b"ORIGINAL");
}
#[cfg(unix)]
#[test]
fn symlink_source_and_dangling_target_are_safe() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let link = f.0.join("link.jpg");
    std::os::unix::fs::symlink(&a, &link).unwrap();
    let dest = f.dest();
    assert!(preview_file_operation(vec![s(&link)], "COPY".into(), Some(s(&dest)), None).is_err());
    let outside = f.0.join("outside.jpg");
    std::os::unix::fs::symlink(&outside, dest.join("a.jpg")).unwrap();
    let plan = preview_file_operation(vec![s(&a)], "COPY".into(), Some(s(&dest)), None).unwrap();
    let r = move_or_copy_files(vec![s(&a)], s(&dest), "COPY".into(), Some(plan.token)).unwrap();
    assert_eq!(r.success_count, 1);
    assert!(!outside.exists());
    assert!(fs::symlink_metadata(dest.join("a.jpg"))
        .unwrap()
        .file_type()
        .is_symlink());
    assert_eq!(fs::read(dest.join("a_1.jpg")).unwrap(), b"ORIGINAL");
}
#[cfg(unix)]
#[test]
fn permission_failure_never_reports_move_success() {
    use std::os::unix::fs::PermissionsExt;
    let f = Fixture::new();
    let source = f.0.join("source");
    fs::create_dir(&source).unwrap();
    let a = source.join("a.jpg");
    fs::write(&a, b"ORIGINAL").unwrap();
    let dest = f.dest();
    let plan = preview_file_operation(vec![s(&a)], "MOVE".into(), Some(s(&dest)), None).unwrap();
    fs::set_permissions(&source, fs::Permissions::from_mode(0o555)).unwrap();
    let result = move_or_copy_files(vec![s(&a)], s(&dest), "MOVE".into(), Some(plan.token));
    fs::set_permissions(&source, fs::Permissions::from_mode(0o755)).unwrap();
    let result = result.unwrap();
    assert_eq!(result.success_count, 0);
    assert_eq!(result.failed_count, 1);
    assert_eq!(fs::read(a).unwrap(), b"ORIGINAL");
    assert!(!dest.join("a.jpg").exists());
}

#[test]
#[ignore]
fn crash_child() {
    let source = std::env::var("VXPHOTOS_TEST_SOURCE").unwrap();
    let action = std::env::var("VXPHOTOS_TEST_ACTION").unwrap();
    if action == "ROTATE" {
        let plan = preview_file_operation(vec![source.clone()], action, None, Some(90)).unwrap();
        rotate_lossless(vec![source], 90, Some(plan.token)).unwrap();
    } else if action == "RENAME" {
        let diff = preview_batch_rename(vec![source], None, Some(true)).unwrap();
        apply_batch_rename(diff).unwrap();
    } else {
        let dest = std::env::var("VXPHOTOS_TEST_DEST").unwrap();
        let plan = preview_file_operation(
            vec![source.clone()],
            action.clone(),
            Some(dest.clone()),
            None,
        )
        .unwrap();
        move_or_copy_files(vec![source], dest, action, Some(plan.token)).unwrap();
    }
    panic!("Fault injection was not reached");
}
#[test]
fn actual_process_abort_recovery_at_four_boundaries() {
    for (action, point) in [
        ("RENAME", "rename_published"),
        ("COPY", "copy_published"),
        ("ROTATE", "rotation_original_saved"),
        ("ROTATE", "rotation_published"),
    ] {
        let f = Fixture::new();
        let a = f.file("a.jpg", &jpeg());
        let dest = f.dest();
        let child = std::process::Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "commands::file_safety_tests::crash_child",
                "--ignored",
                "--nocapture",
            ])
            .env("VXPHOTOS_TEST_SOURCE", s(&a))
            .env("VXPHOTOS_TEST_ACTION", action)
            .env("VXPHOTOS_TEST_DEST", s(&dest))
            .env("VXPHOTOS_TEST_ABORT", point)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .unwrap();
        assert!(!child.success());
        let records = list_file_recovery(s(&f.0)).unwrap();
        assert_eq!(records.len(), 1, "{}", point);
        restore_file_operation(records[0].journal_path.clone(), true).unwrap();
        assert_eq!(fs::read(&a).unwrap(), jpeg(), "{}", point);
    }
}

#[test]
fn trash_backup_recovers_after_staging_failure_without_overwrite() {
    let f = Fixture::new();
    let a = f.file("ảnh_Trash.jpg", b"ORIGINAL");
    let e = entry(&a, &a);
    let mut j = Journal::new("TRASH", &e).unwrap();
    fs::copy(&a, &j.backup).unwrap();
    j.backup_expected = Some(snapshot(Path::new(&j.backup)).unwrap());
    j.save("backup_ready").unwrap();
    rename_exclusive(&a, Path::new(&j.stage)).unwrap();
    j.save("trash_staged").unwrap();
    restore_file_operation(j.journal_path, true).unwrap();
    assert_eq!(fs::read(&a).unwrap(), b"ORIGINAL");
    assert_eq!(fs::read(j.stage).unwrap(), b"ORIGINAL");
}
#[test]
fn trash_backup_never_overwrites_replacement_source() {
    let f = Fixture::new();
    let a = f.file("a.jpg", b"ORIGINAL");
    let e = entry(&a, &a);
    let mut j = Journal::new("TRASH", &e).unwrap();
    fs::copy(&a, &j.backup).unwrap();
    j.backup_expected = Some(snapshot(Path::new(&j.backup)).unwrap());
    j.save("backup_ready").unwrap();
    rename_exclusive(&a, Path::new(&j.stage)).unwrap();
    fs::write(&a, b"FOREIGN").unwrap();
    assert!(restore_file_operation(j.journal_path, true).is_err());
    assert_eq!(fs::read(a).unwrap(), b"FOREIGN");
    assert_eq!(fs::read(j.backup).unwrap(), b"ORIGINAL");
}

#[test]
fn trash_preparation_keeps_original_identity_and_metadata() {
    let f = Fixture::new();
    let a = f.file("ảnh_Trash.jpg", b"ORIGINAL");
    let expected = snapshot(&a).unwrap();
    let e = entry(&a, &a);
    let j = prepare_trash(&e).unwrap();
    assert!(!a.exists());
    assert_eq!(snapshot(Path::new(&j.backup)).unwrap(), expected);
    assert_eq!(fs::read(&j.stage).unwrap(), b"ORIGINAL");
    restore_file_operation(j.journal_path, true).unwrap();
    assert_eq!(snapshot(&a).unwrap(), expected);
}
