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
        let _ = Command::new("cmd")
            .args(["/C", "start", "", &file_path])
            .spawn();
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
pub fn move_to_trash(file_paths: Vec<String>) -> Result<usize, String> {
    let mut count = 0;
    for path_str in file_paths {
        let p = Path::new(&path_str);
        if !p.exists() {
            continue;
        }

        #[cfg(target_os = "macos")]
        {
            // AppleScript to move to trash cleanly
            let script = format!(
                "tell application \"Finder\" to delete POSIX file \"{}\"",
                path_str.replace('"', "\\\"")
            );
            if Command::new("osascript").arg("-e").arg(script).output().is_ok() {
                count += 1;
            }
        }

        #[cfg(not(target_os = "macos"))]
        {
            if std::fs::remove_file(p).is_ok() {
                count += 1;
            }
        }
    }
    Ok(count)
}
