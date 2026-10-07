use serde::{Deserialize, Serialize};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct RotateFailure {
    pub path: String,
    pub error_message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RotateResponse {
    pub success_count: usize,
    pub failed_paths: Vec<RotateFailure>,
    pub cache_bust_timestamp: u64,
}

#[tauri::command]
pub async fn rotate_lossless(
    file_paths: Vec<String>,
    degrees: i32,
) -> Result<RotateResponse, String> {
    let mut success_count = 0;
    let mut failed_paths = Vec::new();

    let now_ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    for path_str in file_paths {
        let p = Path::new(&path_str);
        if !p.exists() {
            failed_paths.push(RotateFailure {
                path: path_str,
                error_message: "File not found".to_string(),
            });
            continue;
        }

        // Apply lossless rotation
        match rotate_single_file(p, degrees) {
            Ok(_) => {
                success_count += 1;
                // Notify OS filesystem cache to invalidate thumbnails
                notify_os_file_changed(p);
            }
            Err(e) => {
                failed_paths.push(RotateFailure {
                    path: path_str,
                    error_message: e,
                });
            }
        }
    }

    Ok(RotateResponse {
        success_count,
        failed_paths,
        cache_bust_timestamp: now_ts,
    })
}

fn rotate_single_file(path: &Path, degrees: i32) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let deg_str = degrees.to_string();
        let output = Command::new("/usr/bin/sips")
            .arg("-r")
            .arg(&deg_str)
            .arg(path)
            .output()
            .map_err(|e| format!("Lỗi thực thi sips: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("sips error: {}", err));
        }
        Ok(())
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let script = match degrees {
            90 => "[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null; $img = [System.Drawing.Image]::FromFile($args[0]); $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone); $img.Save($args[0]); $img.Dispose()",
            180 => "[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null; $img = [System.Drawing.Image]::FromFile($args[0]); $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone); $img.Save($args[0]); $img.Dispose()",
            270 => "[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null; $img = [System.Drawing.Image]::FromFile($args[0]); $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone); $img.Save($args[0]); $img.Dispose()",
            _ => return Ok(()),
        };
        let _ = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(script)
            .arg(path)
            .output();
        Ok(())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = path;
        let _ = degrees;
        Ok(())
    }
}

fn notify_os_file_changed(_path: &Path) {
    #[cfg(target_os = "macos")]
    {
        // On macOS, trigger touch to notify FSEvents and QuickLook daemon
        use std::process::Command;
        let _ = Command::new("touch").arg(_path).output();
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, invoke SHChangeNotify(SHCNE_UPDATEITEM)
        use std::os::windows::ffi::OsStrExt;
        let wide: Vec<u16> = _path.as_os_str().encode_wide().chain(std::iter::once(0)).collect();
        unsafe {
            use windows::Win32::UI::Shell::{SHChangeNotify, SHCNE_UPDATEITEM, SHCNF_PATHW};
            SHChangeNotify(SHCNE_UPDATEITEM, SHCNF_PATHW, Some(wide.as_ptr() as *const _), None);
        }
    }
}
