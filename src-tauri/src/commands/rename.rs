use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;
use uuid::Uuid;

use super::exif_reader::read_exif_fast;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenameDiffItem {
    pub original_path: String,
    pub original_filename: String,
    pub new_filename: String,
    pub new_path: String,
    pub has_conflict: bool,
    pub conflict_resolution: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApplyRenameResponse {
    pub success_count: usize,
    pub failed_count: usize,
    pub results: Vec<RenameDiffItem>,
}

#[tauri::command]
pub fn preview_batch_rename(
    file_paths: Vec<String>,
    _naming_pattern: Option<String>,
    fallback_to_mtime: Option<bool>,
) -> Result<Vec<RenameDiffItem>, String> {
    let use_mtime_fallback = fallback_to_mtime.unwrap_or(true);

    // Group files by base timestamp YYYYMMDD_HHMM
    let mut date_groups: HashMap<String, Vec<(String, String, Option<String>)>> = HashMap::new();

    for path_str in &file_paths {
        let p = Path::new(path_str);
        if !p.exists() {
            continue;
        }

        let orig_filename = p.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();

        let mut time_str = String::new();
        let mut sub_sec = None;

        // Try EXIF DateTaken
        if let Some(exif) = read_exif_fast(p) {
            if let Some(dt) = exif.date_taken {
                // Expects YYYY-MM-DD HH:MM:SS
                let clean = dt.replace(['-', ':', ' '], "");
                if clean.len() >= 12 {
                    time_str = format!("{}_{}", &clean[0..8], &clean[8..12]);
                    sub_sec = exif.sub_sec_time;
                }
            }
        }

        // Fallback to mtime if needed
        if time_str.is_empty() && use_mtime_fallback {
            if let Ok(metadata) = p.metadata() {
                if let Ok(mtime) = metadata.modified() {
                    let datetime: DateTime<Local> = mtime.into();
                    time_str = datetime.format("%Y%m%d_%H%M").to_string();
                }
            }
        }

        // Ultimate fallback
        if time_str.is_empty() {
            let now = std::time::SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            time_str = format!("image_{}", now);
        }

        date_groups
            .entry(time_str)
            .or_default()
            .push((path_str.clone(), orig_filename, sub_sec));
    }

    let mut diff_items = Vec::new();

    for (time_key, mut files) in date_groups {
        // Sort files within the same minute: first by sub-sec, then original filename
        files.sort_by(|a, b| {
            if a.2.is_some() && b.2.is_some() {
                a.2.cmp(&b.2)
            } else {
                a.1.cmp(&b.1)
            }
        });

        let count = files.len();
        for (idx, (orig_path, orig_filename, _)) in files.into_iter().enumerate() {
            let p = Path::new(&orig_path);
            let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
            let parent_dir = p.parent().unwrap_or_else(|| Path::new(""));

            let new_filename = if count > 1 {
                format!("{}_{:02}.{}", time_key, idx + 1, ext)
            } else {
                format!("{}.{}", time_key, ext)
            };

            let new_path = parent_dir.join(&new_filename).to_string_lossy().to_string();
            let has_conflict = Path::new(&new_path).exists() && new_path != orig_path;

            diff_items.push(RenameDiffItem {
                original_path: orig_path,
                original_filename: orig_filename,
                new_filename,
                new_path,
                has_conflict,
                conflict_resolution: None,
            });
        }
    }

    Ok(diff_items)
}

#[tauri::command]
pub fn apply_batch_rename(items: Vec<RenameDiffItem>) -> Result<ApplyRenameResponse, String> {
    let mut success_count = 0;
    let mut failed_count = 0;
    let mut results = Vec::new();

    // Two-Phase Rename to prevent collision
    // Phase 1: Rename original to temporary UUID file
    let mut temp_renames: Vec<(String, String, String)> = Vec::new(); // (temp_path, original_path, target_path)

    for item in &items {
        let orig = Path::new(&item.original_path);
        if !orig.exists() {
            failed_count += 1;
            continue;
        }

        let parent = orig.parent().unwrap_or_else(|| Path::new(""));
        let temp_filename = format!(".tmp_rename_{}", Uuid::new_v4());
        let temp_path = parent.join(temp_filename).to_string_lossy().to_string();

        if let Ok(_) = fs::rename(orig, &temp_path) {
            temp_renames.push((temp_path, item.original_path.clone(), item.new_path.clone()));
        } else {
            failed_count += 1;
        }
    }

    // Phase 2: Rename from temporary file to target path
    for (temp_path, orig_path, target_path) in temp_renames {
        let target = Path::new(&target_path);
        if let Ok(_) = fs::rename(&temp_path, target) {
            success_count += 1;
            results.push(RenameDiffItem {
                original_path: orig_path,
                original_filename: "".to_string(),
                new_filename: target.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string(),
                new_path: target_path,
                has_conflict: false,
                conflict_resolution: None,
            });
        } else {
            // Rollback if phase 2 failed
            let _ = fs::rename(&temp_path, &orig_path);
            failed_count += 1;
        }
    }

    Ok(ApplyRenameResponse {
        success_count,
        failed_count,
        results,
    })
}
