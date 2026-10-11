use std::path::Path;
use std::process::Command;

#[tauri::command]
pub async fn select_folder_dialog(default_path: Option<String>) -> Result<Option<String>, String> {
    let mut dialog = rfd::AsyncFileDialog::new().set_title("Chọn Thư mục Ảnh");

    if let Some(ref path) = default_path {
        let p = Path::new(path);
        if p.exists() {
            dialog = dialog.set_directory(p);
        }
    }

    let folder = dialog.pick_folder().await;
    Ok(folder.map(|f| f.path().to_string_lossy().to_string()))
}

#[tauri::command]
pub fn reveal_in_file_manager(file_path: String) -> Result<(), String> {
    let p = Path::new(&file_path);
    if !p.exists() {
        return Err("File does not exist".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg("-R").arg(&file_path).spawn();
    }

    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("explorer")
            .arg(format!("/select,{}", file_path))
            .spawn();
    }

    Ok(())
}

#[tauri::command]
pub fn open_in_system_viewer(file_path: String) -> Result<(), String> {
    let p = Path::new(&file_path);
    if !p.exists() {
        return Err("File does not exist".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(&file_path).spawn();
    }

    #[cfg(target_os = "windows")]
    {
        tauri_plugin_opener::open_path(&file_path, None::<&str>).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn open_native_preview(file_path: String) -> Result<(), String> {
    let p = Path::new(&file_path);
    if !p.exists() {
        return Err("File does not exist".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        // On macOS, qlmanage -p opens the native floating Quick Look window
        let _ = Command::new("qlmanage").arg("-p").arg(&file_path).spawn();
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows fallback to system viewer
        open_in_system_viewer(file_path)?;
    }

    Ok(())
}

#[tauri::command]
pub fn move_to_trash(
    file_paths: Vec<String>,
    confirmation_token: Option<String>,
) -> Result<super::file_safety::OperationResult, String> {
    use super::file_safety::*;
    let _guard = MUTATIONS.lock().map_err(|e| e.to_string())?;
    let plan = take_plan(
        &confirmation_token.ok_or("Cần preview và xác nhận")?,
        "TRASH",
    )?;
    if plan.entries.len() != file_paths.len()
        || plan.entries.iter().zip(file_paths).any(|(e, p)| {
            resolved(Path::new(&p))
                .map(|s| s != Path::new(&e.source))
                .unwrap_or(true)
        })
    {
        return Err("Danh sách Trash đã đổi sau preview".into());
    }
    validate_entries(&plan.entries)?;
    let mut result = OperationResult::default();
    for e in plan.entries {
        let attempt = (|| {
            let mut j = prepare_trash(&e)?;
            trash::delete(Path::new(&j.stage)).map_err(|err| j.problem(err))?;
            if exists(Path::new(&e.source))? {
                return Err(j.problem("Tệp nguồn vẫn tồn tại sau Trash"));
            }
            j.save("trashed").map_err(|err| j.problem(err))?;
            Ok(j.journal_path)
        })();
        result.push(&e, attempt);
    }
    Ok(result)
}
