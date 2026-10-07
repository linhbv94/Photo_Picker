use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct MoveCopyResult {
    pub success_count: usize,
    pub failed_paths: Vec<String>,
}

#[tauri::command]
pub fn move_or_copy_files(
    source_paths: Vec<String>,
    destination_folder: String,
    action_type: String,
) -> Result<MoveCopyResult, String> {
    let dest_dir = Path::new(&destination_folder);
    if !dest_dir.exists() || !dest_dir.is_dir() {
        return Err("Destination folder does not exist".to_string());
    }

    let is_move = action_type.to_uppercase() == "MOVE";
    let mut success_count = 0;
    let mut failed_paths = Vec::new();

    for src_str in source_paths {
        let src = Path::new(&src_str);
        if !src.exists() {
            failed_paths.push(src_str);
            continue;
        }

        let file_name = match src.file_name() {
            Some(name) => name,
            None => {
                failed_paths.push(src_str);
                continue;
            }
        };

        let mut target = dest_dir.join(file_name);
        if target.exists() && target != src {
            // Generate non-colliding name: name_1.ext, name_2.ext
            let stem = src.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
            let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("");
            let mut counter = 1;
            loop {
                let candidate_name = if ext.is_empty() {
                    format!("{}_{}", stem, counter)
                } else {
                    format!("{}_{}.{}", stem, counter, ext)
                };
                let candidate_path = dest_dir.join(candidate_name);
                if !candidate_path.exists() {
                    target = candidate_path;
                    break;
                }
                counter += 1;
                if counter > 9999 {
                    break;
                }
            }
        }

        if is_move {
            // First attempt direct rename (fastest on same volume)
            if fs::rename(src, &target).is_ok() {
                success_count += 1;
            } else {
                // Cross-volume safe copy & remove
                let temp_dest = dest_dir.join(format!(".tmp_copy_{}", Uuid::new_v4()));
                if fs::copy(src, &temp_dest).is_ok() {
                    // Verify file size
                    let src_size = src.metadata().map(|m| m.len()).unwrap_or(0);
                    let dest_size = temp_dest.metadata().map(|m| m.len()).unwrap_or(1);
                    if src_size == dest_size && fs::rename(&temp_dest, &target).is_ok() {
                        let _ = fs::remove_file(src);
                        success_count += 1;
                    } else {
                        let _ = fs::remove_file(&temp_dest);
                        failed_paths.push(src_str);
                    }
                } else {
                    failed_paths.push(src_str);
                }
            }
        } else {
            // Copy mode
            if fs::copy(src, &target).is_ok() {
                success_count += 1;
            } else {
                failed_paths.push(src_str);
            }
        }
    }

    Ok(MoveCopyResult {
        success_count,
        failed_paths,
    })
}
