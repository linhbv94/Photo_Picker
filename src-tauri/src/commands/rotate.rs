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
        use std::io::Write;
        use std::os::windows::process::CommandExt;
        use std::process::Command;

        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let rot_type = match degrees {
            90 => "Rotate90FlipNone",
            180 => "Rotate180FlipNone",
            270 => "Rotate270FlipNone",
            _ => return Ok(()),
        };

        let script = format!(
            r#"$ErrorActionPreference = 'Stop';
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false);
$p = [Console]::In.ReadLine();
if ([string]::IsNullOrWhiteSpace($p) -or -not [System.IO.File]::Exists($p)) {{
    Write-Error "Invalid or missing file path: $p";
    exit 1;
}}
Add-Type -AssemblyName System.Drawing;
$ext = [System.IO.Path]::GetExtension($p);
$dir = [System.IO.Path]::GetDirectoryName($p);
$rand = [System.Guid]::NewGuid().ToString('N');
$tmp = [System.IO.Path]::Combine($dir, ".tmp_rot_" + $rand + $ext);
try {{
    $bytes = [System.IO.File]::ReadAllBytes($p);
    $ms = New-Object System.IO.MemoryStream(,$bytes);
    try {{
        $img = [System.Drawing.Image]::FromStream($ms);
        try {{
            $img.RotateFlip([System.Drawing.RotateFlipType]::{});
            $img.Save($tmp, $img.RawFormat);
        }} finally {{
            $img.Dispose();
        }}
    }} finally {{
        $ms.Dispose();
    }}
    if ([System.IO.File]::Exists($tmp)) {{
        [System.IO.File]::Copy($tmp, $p, $true);
        [System.IO.File]::Delete($tmp);
    }} else {{
        throw "Failed to save rotated image to temp file";
    }}
}} catch {{
    if ([System.IO.File]::Exists($tmp)) {{
        [System.IO.File]::Delete($tmp);
    }}
    Write-Error $_;
    exit 1;
}}"#,
            rot_type
        );

        let mut child = Command::new("powershell")
            .creation_flags(CREATE_NO_WINDOW)
            .arg("-NoProfile")
            .arg("-NonInteractive")
            .arg("-WindowStyle")
            .arg("Hidden")
            .arg("-Command")
            .arg(script)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Lỗi khởi chạy PowerShell: {}", e))?;

        if let Some(mut stdin) = child.stdin.take() {
            writeln!(stdin, "{}", path.display())
                .map_err(|e| format!("Lỗi truyền đường dẫn ảnh tới PowerShell: {}", e))?;
        }

        let output = child
            .wait_with_output()
            .map_err(|e| format!("Lỗi thực thi PowerShell: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Lỗi rotate ảnh trên Windows: {}", err.trim()));
        }
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
