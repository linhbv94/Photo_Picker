//! Filesystem mutations are serialized, bound to an expiring preview and journaled.
//! No overwrite fallback, shell commands or permanent deletion of originals.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{Mutex, OnceLock},
    time::{Duration, Instant, UNIX_EPOCH},
};
use uuid::Uuid;

pub static MUTATIONS: Mutex<()> = Mutex::new(());
const STORE: &str = ".vxphotos_operations";

pub fn fault_point(_name: &str) {
    // Test-only abort injection. Release/debug app builds never inspect this variable.
    #[cfg(test)]
    if std::env::var("VXPHOTOS_TEST_ABORT").ok().as_deref() == Some(_name) {
        std::process::abort();
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Snapshot {
    pub identity: String,
    pub size: u64,
    pub modified_ns: u128,
    pub sha256: String,
}

pub fn regular_file(path: &Path) -> Result<File, String> {
    validate_parent(path)?;
    let meta = fs::symlink_metadata(path).map_err(|e| e.to_string())?;
    if !meta.is_file() || meta.file_type().is_symlink() {
        return Err("Chỉ xử lý tệp thường; không xử lý thư mục hoặc symlink".into());
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        if meta.file_attributes() & 0x400 != 0 {
            return Err("Không xử lý reparse point".into());
        }
    }
    let mut opts = OpenOptions::new();
    opts.read(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        opts.custom_flags(libc::O_NOFOLLOW);
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        opts.custom_flags(0x00200000).share_mode(1);
    }
    let file = opts.open(path).map_err(|e| e.to_string())?;
    if !file.metadata().map_err(|e| e.to_string())?.is_file() {
        return Err("Nguồn không phải tệp thường".into());
    }
    Ok(file)
}

fn identity(file: &File) -> Result<String, String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let m = file.metadata().map_err(|e| e.to_string())?;
        Ok(format!("{}:{}", m.dev(), m.ino()))
    }
    #[cfg(windows)]
    {
        use std::os::windows::io::AsRawHandle;
        #[repr(C)]
        struct Info {
            attrs: u32,
            creation: [u32; 2],
            access: [u32; 2],
            write: [u32; 2],
            volume: u32,
            size_high: u32,
            size_low: u32,
            links: u32,
            index_high: u32,
            index_low: u32,
        }
        #[link(name = "kernel32")]
        extern "system" {
            fn GetFileInformationByHandle(h: *mut std::ffi::c_void, info: *mut Info) -> i32;
        }
        let mut info: Info = unsafe { std::mem::zeroed() };
        if unsafe { GetFileInformationByHandle(file.as_raw_handle(), &mut info) } == 0 {
            return Err(std::io::Error::last_os_error().to_string());
        }
        if info.attrs & 0x400 != 0 {
            return Err("Không xử lý reparse point".into());
        }
        Ok(format!(
            "{}:{}:{}",
            info.volume, info.index_high, info.index_low
        ))
    }
    #[cfg(not(any(unix, windows)))]
    {
        let _ = file;
        Err("Platform chưa hỗ trợ an toàn".into())
    }
}

pub fn snapshot(path: &Path) -> Result<Snapshot, String> {
    let mut file = regular_file(path)?;
    let before = file.metadata().map_err(|e| e.to_string())?;
    let id = identity(&file)?;
    let mut hash = Sha256::new();
    let mut buffer = [0u8; 65536];
    loop {
        let n = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hash.update(&buffer[..n]);
    }
    let after = file.metadata().map_err(|e| e.to_string())?;
    if before.len() != after.len() || before.modified().ok() != after.modified().ok() {
        return Err("Nguồn đổi trong lúc đọc; hãy preview lại".into());
    }
    Ok(Snapshot {
        identity: id,
        size: after.len(),
        modified_ns: after
            .modified()
            .map_err(|e| e.to_string())?
            .duration_since(UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_nanos(),
        sha256: format!("{:x}", hash.finalize()),
    })
}

pub fn validate_parent(path: &Path) -> Result<(), String> {
    let parent = path.parent().ok_or("Không có thư mục cha")?;
    for ancestor in parent.ancestors() {
        let m = fs::symlink_metadata(ancestor).map_err(|e| e.to_string())?;
        if !m.is_dir() || m.file_type().is_symlink() {
            return Err("Thư mục cha đã đổi hoặc là symlink".into());
        }
        #[cfg(windows)]
        {
            use std::os::windows::fs::MetadataExt;
            if m.file_attributes() & 0x400 != 0 {
                return Err("Thư mục cha là reparse point".into());
            }
        }
    }
    Ok(())
}

pub fn resolved(path: &Path) -> Result<PathBuf, String> {
    if !path.is_absolute() {
        return Err("Cần đường dẫn tuyệt đối".into());
    }
    if path
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err("Không nhận đường dẫn có ..".into());
    }
    let name = path.file_name().ok_or("Không nhận thư mục root")?;
    let parent =
        fs::canonicalize(path.parent().ok_or("Thiếu parent")?).map_err(|e| e.to_string())?;
    let result = parent.join(name);
    validate_parent(&result)?;
    Ok(result)
}
pub fn exists(path: &Path) -> Result<bool, String> {
    match fs::symlink_metadata(path) {
        Ok(_) => Ok(true),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}
pub fn unchanged(path: &Path, expected: &Snapshot) -> Result<(), String> {
    if snapshot(path)? != *expected {
        Err("Tệp đã đổi sau preview; không thực thi".into())
    } else {
        Ok(())
    }
}

/// Atomic destination exclusion. Unsupported filesystems fail closed.
pub fn rename_exclusive(from: &Path, to: &Path) -> std::io::Result<()> {
    validate_parent(from)
        .and_then(|_| validate_parent(to))
        .map_err(std::io::Error::other)?;
    #[cfg(target_os = "macos")]
    {
        use std::os::{fd::AsRawFd, unix::ffi::OsStrExt};
        // Pin both parent directories; a concurrent path swap cannot redirect the rename.
        let a_dir = File::open(from.parent().unwrap())?;
        let b_dir = File::open(to.parent().unwrap())?;
        let a = std::ffi::CString::new(from.file_name().unwrap().as_bytes())?;
        let b = std::ffi::CString::new(to.file_name().unwrap().as_bytes())?;
        if unsafe {
            libc::renameatx_np(
                a_dir.as_raw_fd(),
                a.as_ptr(),
                b_dir.as_raw_fd(),
                b.as_ptr(),
                libc::RENAME_EXCL,
            )
        } != 0
        {
            return Err(std::io::Error::last_os_error());
        }
        Ok(())
    }
    #[cfg(windows)]
    {
        use std::os::windows::ffi::OsStrExt;
        use std::os::windows::fs::OpenOptionsExt;
        #[link(name = "kernel32")]
        extern "system" {
            fn MoveFileExW(a: *const u16, b: *const u16, flags: u32) -> i32;
        }
        let a: Vec<u16> = from.as_os_str().encode_wide().chain(Some(0)).collect();
        let b: Vec<u16> = to.as_os_str().encode_wide().chain(Some(0)).collect();
        if a[..a.len() - 1].contains(&0) || b[..b.len() - 1].contains(&0) {
            return Err(std::io::Error::other("NUL path"));
        }
        // Hold directory handles without FILE_SHARE_DELETE while resolving the move.
        // This prevents ancestor rename/junction replacement during MoveFileExW.
        let mut directories = Vec::new();
        for path in [from, to] {
            for parent in path.parent().unwrap().ancestors() {
                let mut o = OpenOptions::new();
                o.read(true).share_mode(3).custom_flags(0x02200000);
                directories.push(o.open(parent)?);
            }
        }
        validate_parent(from)
            .and_then(|_| validate_parent(to))
            .map_err(std::io::Error::other)?;
        // WRITE_THROUGH only: no REPLACE_EXISTING and no COPY_ALLOWED.
        if unsafe { MoveFileExW(a.as_ptr(), b.as_ptr(), 8) } == 0 {
            return Err(std::io::Error::last_os_error());
        }
        Ok(())
    }
    #[cfg(not(any(target_os = "macos", windows)))]
    {
        let _ = (from, to);
        Err(std::io::Error::new(
            std::io::ErrorKind::Unsupported,
            "No atomic exclusive rename adapter",
        ))
    }
}
pub fn sync_parent(path: &Path) -> Result<(), String> {
    #[cfg(unix)]
    {
        File::open(path.parent().ok_or("Missing parent")?)
            .and_then(|f| f.sync_all())
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(unix))]
    let _ = path;
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    pub source: String,
    pub target: String,
    pub expected: Snapshot,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Preview {
    pub token: String,
    pub action: String,
    pub degrees: Option<i32>,
    pub entries: Vec<Entry>,
}
struct SavedPlan {
    plan: Preview,
    created: Instant,
}
static PLANS: OnceLock<Mutex<HashMap<String, SavedPlan>>> = OnceLock::new();
pub fn save_plan(
    action: &str,
    degrees: Option<i32>,
    entries: Vec<Entry>,
) -> Result<Preview, String> {
    let p = Preview {
        token: Uuid::new_v4().to_string(),
        action: action.into(),
        degrees,
        entries,
    };
    let mut plans = PLANS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .map_err(|e| e.to_string())?;
    plans.retain(|_, p| p.created.elapsed() < Duration::from_secs(900));
    if plans.len() > 128 {
        return Err("Quá nhiều preview đang chờ".into());
    }
    plans.insert(
        p.token.clone(),
        SavedPlan {
            plan: p.clone(),
            created: Instant::now(),
        },
    );
    Ok(p)
}
pub fn take_plan(token: &str, action: &str) -> Result<Preview, String> {
    let p = PLANS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .map_err(|e| e.to_string())?
        .remove(token)
        .ok_or("Preview không tồn tại hoặc đã dùng; hãy preview lại")?;
    if p.created.elapsed() > Duration::from_secs(900) || p.plan.action != action {
        return Err("Preview hết hạn hoặc sai thao tác".into());
    }
    Ok(p.plan)
}
pub fn validate_entries(entries: &[Entry]) -> Result<(), String> {
    let mut ids = HashSet::new();
    let mut targets = HashSet::new();
    for e in entries {
        let s = Path::new(&e.source);
        let t = Path::new(&e.target);
        unchanged(s, &e.expected)?;
        validate_parent(t)?;
        if !ids.insert(e.expected.identity.clone()) {
            return Err("Nguồn trùng hoặc hardlink alias".into());
        }
        // Conservative on both OSes, also handles case-insensitive volumes.
        if !targets.insert(e.target.to_lowercase()) {
            return Err("Trùng tên đích trong batch".into());
        }
        if s != t && exists(t)? {
            return Err(format!("Đích đã tồn tại: {}", e.target));
        }
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileResult {
    pub path: String,
    pub target_path: String,
    pub status: String,
    pub error_message: Option<String>,
    pub journal_path: Option<String>,
}
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct OperationResult {
    pub success_count: usize,
    pub failed_count: usize,
    pub results: Vec<FileResult>,
}
impl OperationResult {
    pub fn push(&mut self, e: &Entry, result: Result<String, String>) {
        match result {
            Ok(journal) => {
                self.success_count += 1;
                self.results.push(FileResult {
                    path: e.source.clone(),
                    target_path: e.target.clone(),
                    status: "completed".into(),
                    error_message: None,
                    journal_path: Some(journal),
                });
            }
            Err(error) => {
                self.failed_count += 1;
                self.results.push(FileResult {
                    path: e.source.clone(),
                    target_path: e.target.clone(),
                    status: "failed".into(),
                    error_message: Some(error.clone()),
                    journal_path: error
                        .rsplit_once("; hồ sơ phục hồi: ")
                        .map(|(_, path)| path.to_string()),
                });
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Journal {
    pub version: u32,
    pub id: String,
    pub action: String,
    pub entry: Entry,
    pub backup: String,
    pub stage: String,
    pub output_hash: Option<String>,
    #[serde(default)]
    pub output_expected: Option<Snapshot>,
    #[serde(default)]
    pub backup_expected: Option<Snapshot>,
    pub status: String,
    pub journal_path: String,
}
impl Journal {
    pub fn new(action: &str, e: &Entry) -> Result<Self, String> {
        let parent = Path::new(&e.source).parent().ok_or("Missing parent")?;
        let store = parent.join(STORE);
        if !exists(&store)? {
            match fs::create_dir(&store) {
                Ok(()) => {}
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {}
                Err(error) => return Err(error.to_string()),
            }
        }
        validate_parent(&store.join("probe"))?;
        sync_parent(&store)?;
        let id = Uuid::new_v4().to_string();
        let dir = store.join(&id);
        fs::create_dir(&dir).map_err(|e| e.to_string())?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&dir, fs::Permissions::from_mode(0o700))
                .map_err(|e| e.to_string())?;
        }
        sync_parent(&dir)?;
        let stage = if action == "TRASH" {
            let trash_dir = dir.join("trash");
            fs::create_dir(&trash_dir).map_err(|e| e.to_string())?;
            sync_parent(&trash_dir)?;
            trash_dir.join(
                Path::new(&e.source)
                    .file_name()
                    .ok_or("Missing source filename")?,
            )
        } else {
            Path::new(&e.target)
                .parent()
                .ok_or("Missing target parent")?
                .join(format!(".vxphotos_stage_{}", id))
        };
        let j = Self {
            version: 1,
            id: id.clone(),
            action: action.into(),
            entry: e.clone(),
            backup: dir.join("original").to_string_lossy().into(),
            stage: stage.to_string_lossy().into(),
            output_hash: None,
            output_expected: None,
            backup_expected: None,
            status: "prepared".into(),
            journal_path: dir.join("journal.jsonl").to_string_lossy().into(),
        };
        let mut f = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&j.journal_path)
            .map_err(|e| e.to_string())?;
        writeln!(
            f,
            "{}",
            serde_json::to_string(&j).map_err(|e| e.to_string())?
        )
        .map_err(|e| e.to_string())?;
        f.sync_all().map_err(|e| e.to_string())?;
        sync_parent(Path::new(&j.journal_path))?;
        Ok(j)
    }
    pub fn save(&mut self, status: &str) -> Result<(), String> {
        self.status = status.into();
        validate_parent(Path::new(&self.journal_path))?;
        let mut o = OpenOptions::new();
        o.append(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            o.custom_flags(libc::O_NOFOLLOW);
        }
        let mut f = o.open(&self.journal_path).map_err(|e| e.to_string())?;
        writeln!(
            f,
            "{}",
            serde_json::to_string(self).map_err(|e| e.to_string())?
        )
        .map_err(|e| e.to_string())?;
        f.sync_all().map_err(|e| e.to_string())
    }
    pub fn problem(&self, error: impl std::fmt::Display) -> String {
        format!("{}; hồ sơ phục hồi: {}", error, self.journal_path)
    }
}

pub fn execute_rename(e: &Entry, action: &str) -> Result<String, String> {
    unchanged(Path::new(&e.source), &e.expected)?;
    if e.source == e.target {
        return Err("Nguồn và đích giống nhau; không thay đổi".into());
    }
    let mut j = Journal::new(action, e)?;
    rename_exclusive(Path::new(&e.source), Path::new(&e.target)).map_err(|err| j.problem(err))?;
    fault_point("rename_published");
    if let Err(err) = unchanged(Path::new(&e.target), &e.expected) {
        return Err(j.problem(err));
    }
    sync_parent(Path::new(&e.source))
        .and_then(|_| sync_parent(Path::new(&e.target)))
        .map_err(|err| j.problem(err))?;
    j.save("completed").map_err(|err| j.problem(err))?;
    Ok(j.journal_path)
}

/// Keep the original inode and all filesystem metadata; only a verified clone goes to OS Trash.
pub fn prepare_trash(e: &Entry) -> Result<Journal, String> {
    unchanged(Path::new(&e.source), &e.expected)?;
    let mut j = Journal::new("TRASH", e)?;
    let attempt = (|| {
        let mut source = regular_file(Path::new(&e.source))?;
        let mut stage = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&j.stage)
            .map_err(|err| err.to_string())?;
        std::io::copy(&mut source, &mut stage).map_err(|err| err.to_string())?;
        copy_file_attributes(&source, &stage)?;
        stage.sync_all().map_err(|err| err.to_string())?;
        drop(stage);
        drop(source);
        let stamp = snapshot(Path::new(&j.stage))?;
        if stamp.sha256 != e.expected.sha256 || stamp.size != e.expected.size {
            return Err("Bản sao Trash không khớp; giữ nguồn".into());
        }
        j.output_hash = Some(stamp.sha256.clone());
        j.output_expected = Some(stamp);
        sync_parent(Path::new(&j.stage))?;
        j.save("output_ready")?;
        unchanged(Path::new(&e.source), &e.expected)?;
        rename_exclusive(Path::new(&e.source), Path::new(&j.backup))
            .map_err(|err| err.to_string())?;
        unchanged(Path::new(&j.backup), &e.expected)?;
        j.backup_expected = Some(e.expected.clone());
        sync_parent(Path::new(&e.source))?;
        sync_parent(Path::new(&j.backup))?;
        j.save("trash_staged")?;
        fault_point("trash_staged");
        Ok(())
    })();
    attempt.map_err(|err: String| j.problem(err))?;
    Ok(j)
}

pub fn copy_file_attributes(source: &File, output: &File) -> Result<(), String> {
    let metadata = source.metadata().map_err(|e| e.to_string())?;
    let mut times =
        fs::FileTimes::new().set_modified(metadata.modified().map_err(|e| e.to_string())?);
    if let Ok(accessed) = metadata.accessed() {
        times = times.set_accessed(accessed);
    }
    output.set_times(times).map_err(|e| e.to_string())?;
    output
        .set_permissions(metadata.permissions())
        .map_err(|e| e.to_string())
}

pub fn copy_staged(j: &mut Journal) -> Result<(), String> {
    let mut source = regular_file(Path::new(&j.entry.source))?;
    let mut output = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&j.stage)
        .map_err(|e| e.to_string())?;
    std::io::copy(&mut source, &mut output).map_err(|e| e.to_string())?;
    copy_file_attributes(&source, &output)?;
    output.sync_all().map_err(|e| e.to_string())?;
    drop(output);
    drop(source);
    unchanged(Path::new(&j.entry.source), &j.entry.expected)?;
    let out = snapshot(Path::new(&j.stage))?;
    if out.sha256 != j.entry.expected.sha256 || out.size != j.entry.expected.size {
        return Err("Copy verification thất bại; giữ nguyên nguồn".into());
    }
    j.output_hash = Some(out.sha256.clone());
    j.output_expected = Some(out);
    sync_parent(Path::new(&j.stage))?;
    j.save("output_ready")?;
    rename_exclusive(Path::new(&j.stage), Path::new(&j.entry.target)).map_err(|e| e.to_string())?;
    sync_parent(Path::new(&j.entry.target))?;
    fault_point("copy_published");
    j.save("published")
}

#[tauri::command]
pub fn preview_file_operation(
    source_paths: Vec<String>,
    action_type: String,
    destination_folder: Option<String>,
    degrees: Option<i32>,
) -> Result<Preview, String> {
    let _guard = MUTATIONS.lock().map_err(|e| e.to_string())?;
    if !matches!(action_type.as_str(), "MOVE" | "COPY" | "TRASH" | "ROTATE") {
        return Err("Sai thao tác".into());
    }
    if action_type == "ROTATE" && !matches!(degrees, Some(90 | 180 | 270)) {
        return Err("Góc xoay phải là 90/180/270".into());
    }
    let dest = if matches!(action_type.as_str(), "MOVE" | "COPY") {
        Some(
            fs::canonicalize(destination_folder.ok_or("Thiếu folder đích")?)
                .map_err(|e| e.to_string())?,
        )
    } else {
        None
    };
    let mut entries = Vec::new();
    let mut reserved = HashSet::new();
    for input in source_paths {
        let source = resolved(Path::new(&input))?;
        let stamp = snapshot(&source)?;
        let mut target = source.clone();
        if let Some(ref dest) = dest {
            validate_parent(&dest.join("probe"))?;
            if source.parent() == Some(dest.as_path()) {
                return Err("Nguồn và đích cùng folder; không copy/move vào chính nó".into());
            }
            target = dest.join(source.file_name().ok_or("Invalid source")?);
            if exists(&target)?
                && snapshot(&target)
                    .map(|s| s.identity == stamp.identity)
                    .unwrap_or(false)
            {
                return Err("Đích là cùng tệp/hardlink nguồn".into());
            }
            let stem = source
                .file_stem()
                .and_then(|n| n.to_str())
                .ok_or("Tên không UTF-8")?;
            let ext = source.extension().and_then(|n| n.to_str()).unwrap_or("");
            let mut count = 0;
            while exists(&target)? || reserved.contains(&target.to_string_lossy().to_lowercase()) {
                count += 1;
                if count > 9999 {
                    return Err("Không còn tên đích trống; không ghi đè".into());
                }
                target = dest.join(if ext.is_empty() {
                    format!("{}_{}", stem, count)
                } else {
                    format!("{}_{}.{}", stem, count, ext)
                });
            }
        }
        if action_type == "ROTATE" {
            if source
                .extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(|ext| ext.eq_ignore_ascii_case("png"))
            {
                return Err("Chưa hỗ trợ xoay PNG. Tệp được giữ nguyên.".into());
            }
            if stamp.size > 256 * 1024 * 1024 {
                return Err("JPEG quá lớn cho đường xoay hiện tại".into());
            }
            if fs::metadata(&source)
                .map_err(|e| e.to_string())?
                .permissions()
                .readonly()
            {
                return Err("Ảnh chỉ đọc; không xoay".into());
            }
            let bytes = fs::read(&source).map_err(|e| e.to_string())?;
            super::jpeg_orientation::rotated_jpeg(&bytes, degrees.unwrap())?;
        }
        reserved.insert(target.to_string_lossy().to_lowercase());
        entries.push(Entry {
            source: source.to_str().ok_or("Path không UTF-8")?.into(),
            target: target.to_str().ok_or("Path không UTF-8")?.into(),
            expected: stamp,
        });
    }
    if entries.is_empty() {
        return Err("Không có tệp".into());
    }
    validate_entries(&entries)?;
    save_plan(&action_type, degrees, entries)
}

fn read_journal(path: &Path) -> Result<Journal, String> {
    let path = resolved(path)?;
    let file = regular_file(&path)?;
    let mut data = String::new();
    file.take(4 * 1024 * 1024)
        .read_to_string(&mut data)
        .map_err(|e| e.to_string())?;
    let j: Journal = data
        .lines()
        .filter_map(|line| serde_json::from_str(line).ok())
        .last()
        .ok_or("Journal lỗi; không tự thay đổi dữ liệu")?;
    let parent = Path::new(&j.entry.source)
        .parent()
        .ok_or("Missing source parent")?;
    let dir = parent.join(STORE).join(&j.id);
    let expected_stage = if j.action == "TRASH" {
        dir.join("trash").join(
            Path::new(&j.entry.source)
                .file_name()
                .ok_or("Missing source filename")?,
        )
    } else {
        Path::new(&j.entry.target)
            .parent()
            .ok_or("Missing target parent")?
            .join(format!(".vxphotos_stage_{}", j.id))
    };
    if j.version != 1
        || Uuid::parse_str(&j.id).is_err()
        || path != dir.join("journal.jsonl")
        || j.journal_path != path.to_string_lossy()
        || Path::new(&j.backup) != dir.join("original")
        || Path::new(&j.stage) != expected_stage
    {
        return Err("Journal ngoài phạm vi; không phục hồi".into());
    }
    Ok(j)
}

#[tauri::command]
pub fn list_file_recovery(folder_path: String) -> Result<Vec<Journal>, String> {
    let folder = fs::canonicalize(folder_path).map_err(|e| e.to_string())?;
    let store = folder.join(STORE);
    if !exists(&store)? {
        return Ok(Vec::new());
    }
    validate_parent(&store.join("probe"))?;
    let mut result = Vec::new();
    for entry in fs::read_dir(store).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Ok(j) = read_journal(&entry.path().join("journal.jsonl")) {
            if j.status != "restored" {
                result.push(j);
            }
        }
    }
    result.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(result)
}

#[tauri::command]
pub fn restore_file_operation(journal_path: String, confirmed: bool) -> Result<(), String> {
    if !confirmed {
        return Err("Cần xác nhận phục hồi".into());
    }
    let _guard = MUTATIONS.lock().map_err(|e| e.to_string())?;
    let mut j = read_journal(Path::new(&journal_path))?;
    if j.status == "restored" {
        return Err("Đã phục hồi".into());
    }
    let source = PathBuf::from(&j.entry.source);
    let target = PathBuf::from(&j.entry.target);
    let backup = PathBuf::from(&j.backup);
    let stage = PathBuf::from(&j.stage);
    validate_parent(&source)?;
    validate_parent(&target)?;
    if exists(&backup)? {
        unchanged(
            &backup,
            j.backup_expected.as_ref().unwrap_or(&j.entry.expected),
        )?;
        if exists(&source)? {
            if j.action == "TRASH" {
                unchanged(&source, &j.entry.expected)?;
                return j.save("restored");
            }
            // Only rotation is allowed to move its own output aside. Never overwrite a new source.
            if j.action != "ROTATE" || j.output_expected.as_ref() != Some(&snapshot(&source)?) {
                return Err(j.problem("Tên nguồn đã có tệp khác; giữ bản gốc trong backup"));
            }
            rename_exclusive(&source, &stage).map_err(|e| j.problem(e))?;
            sync_parent(&source)?;
        }
        rename_exclusive(&backup, &source).map_err(|e| j.problem(e))?;
    } else if j.action == "RENAME" || j.action == "MOVE" {
        if exists(&source)? {
            unchanged(&source, &j.entry.expected)?;
        } else {
            unchanged(&target, &j.entry.expected)?;
            rename_exclusive(&target, &source).map_err(|e| j.problem(e))?;
            sync_parent(&target)?;
        }
    } else if j.action == "COPY" {
        unchanged(&source, &j.entry.expected)?;
        if exists(&target)? {
            let out = snapshot(&target)?;
            if j.output_expected.as_ref() != Some(&out) {
                return Err(j.problem("Tệp đích đã đổi; không di chuyển"));
            }
            rename_exclusive(&target, &stage).map_err(|e| j.problem(e))?;
            sync_parent(&target)?;
        }
    } else {
        return Err(j.problem("Không đủ trạng thái để tự phục hồi; giữ nguyên dữ liệu"));
    }
    sync_parent(&source)?;
    j.save("restored")
}
