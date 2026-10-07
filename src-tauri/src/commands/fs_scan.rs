use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::UNIX_EPOCH;
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

use super::exif_reader::{read_exif_fast, ExifMetadata};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub id: String,
    pub path: String,
    pub filename: String,
    pub extension: String,
    pub size_bytes: u64,
    pub modified_timestamp: u64,
    pub created_timestamp: u64,
    pub exif: Option<ExifMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubfolderItem {
    pub id: String,
    pub name: String,
    pub parent_path: String,
    pub direct_children_count: usize,
    pub file_count: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadDirectoryResponse {
    pub scan_id: String,
    pub folder_path: String,
    pub total_files: usize,
    pub files: Vec<FileItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExifChunkItem {
    pub file_id: String,
    pub exif: ExifMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExifChunkStreamPayload {
    pub scan_id: String,
    pub is_last_chunk: bool,
    pub items: Vec<ExifChunkItem>,
}

// Global active scan cancellation flag
static CANCEL_SCAN: std::sync::atomic::AtomicBool = AtomicBool::new(false);

fn is_supported_image(ext: &str) -> bool {
    matches!(
        ext.to_lowercase().as_str(),
        "jpg" | "jpeg" | "png" | "webp" | "heic" | "dng" | "arw" | "cr2" | "cr3" | "nef" | "tif" | "tiff" | "bmp" | "gif" | "avif"
    )
}

#[tauri::command]
pub async fn read_directory(
    app: AppHandle,
    folder_path: String,
    recursive: Option<bool>,
) -> Result<ReadDirectoryResponse, String> {
    // Cancel any previous background scan
    CANCEL_SCAN.store(true, Ordering::SeqCst);
    std::thread::sleep(std::time::Duration::from_millis(15));
    CANCEL_SCAN.store(false, Ordering::SeqCst);

    let path = Path::new(&folder_path);
    if !path.exists() || !path.is_dir() {
        return Err("Folder does not exist or is not a directory".to_string());
    }

    let scan_id = Uuid::new_v4().to_string();
    let is_recursive = recursive.unwrap_or(false);

    let mut files = Vec::new();
    let mut file_paths_for_exif = Vec::new();

    if is_recursive {
        for entry in walkdir::WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let p = entry.path();
                let file_name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if file_name.starts_with('.') {
                    continue;
                }
                let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
                if is_supported_image(ext) {
                    if let Ok(metadata) = entry.metadata() {
                        let mtime = metadata.modified().ok()
                            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                            .map(|d| d.as_secs()).unwrap_or(0);
                        let btime = metadata.created().ok()
                            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                            .map(|d| d.as_secs()).unwrap_or(mtime);

                        let p_str = p.to_string_lossy().to_string();
                        files.push(FileItem {
                            id: p_str.clone(),
                            path: p_str.clone(),
                            filename: file_name.to_string(),
                            extension: ext.to_lowercase(),
                            size_bytes: metadata.len(),
                            modified_timestamp: mtime,
                            created_timestamp: btime,
                            exif: None,
                        });
                        file_paths_for_exif.push(p_str);
                    }
                }
            }
        }
    } else {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.filter_map(|e| e.ok()) {
                let p = entry.path();
                if p.is_file() {
                    let file_name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                    if file_name.starts_with('.') {
                        continue;
                    }
                    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
                    if is_supported_image(ext) {
                        if let Ok(metadata) = entry.metadata() {
                            let mtime = metadata.modified().ok()
                                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                                .map(|d| d.as_secs()).unwrap_or(0);
                            let btime = metadata.created().ok()
                                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                                .map(|d| d.as_secs()).unwrap_or(mtime);

                            let p_str = p.to_string_lossy().to_string();
                            files.push(FileItem {
                                id: p_str.clone(),
                                path: p_str.clone(),
                                filename: file_name.to_string(),
                                extension: ext.to_lowercase(),
                                size_bytes: metadata.len(),
                                modified_timestamp: mtime,
                                created_timestamp: btime,
                                exif: None,
                            });
                            file_paths_for_exif.push(p_str);
                        }
                    }
                }
            }
        }
    }

    // Natural sort initial list by filename
    files.sort_by(|a, b| nat_sort(&a.filename, &b.filename));

    let total_files = files.len();
    let current_scan_id = scan_id.clone();
    let app_handle = app.clone();

    // Spawn background worker to stream EXIF
    std::thread::spawn(move || {
        let chunk_size = 40;
        let mut current_chunk = Vec::new();
        let total = file_paths_for_exif.len();

        for (idx, file_path) in file_paths_for_exif.into_iter().enumerate() {
            if CANCEL_SCAN.load(Ordering::SeqCst) {
                break;
            }

            if let Some(exif_data) = read_exif_fast(&file_path) {
                current_chunk.push(ExifChunkItem {
                    file_id: file_path,
                    exif: exif_data,
                });
            }

            let is_last = idx + 1 == total;
            if current_chunk.len() >= chunk_size || is_last {
                if !current_chunk.is_empty() {
                    let payload = ExifChunkStreamPayload {
                        scan_id: current_scan_id.clone(),
                        is_last_chunk: is_last,
                        items: std::mem::take(&mut current_chunk),
                    };
                    let _ = app_handle.emit("exif_chunk_stream", payload);
                }
            }
        }
    });

    Ok(ReadDirectoryResponse {
        scan_id,
        folder_path,
        total_files,
        files,
    })
}

#[tauri::command]
pub fn get_subfolders(folder_path: String) -> Result<Vec<SubfolderItem>, String> {
    let path = Path::new(&folder_path);
    if !path.exists() || !path.is_dir() {
        return Ok(Vec::new());
    }

    let mut subfolders = Vec::new();
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.filter_map(|e| e.ok()) {
            let p = entry.path();
            if p.is_dir() {
                let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if name.starts_with('.') {
                    continue;
                }

                let mut children_count = 0;
                if let Ok(child_entries) = fs::read_dir(&p) {
                    children_count = child_entries.filter_map(|e| e.ok()).filter(|e| e.path().is_dir()).count();
                }

                subfolders.push(SubfolderItem {
                    id: p.to_string_lossy().to_string(),
                    name: name.to_string(),
                    parent_path: folder_path.clone(),
                    direct_children_count: children_count,
                    file_count: None,
                });
            }
        }
    }

    subfolders.sort_by(|a, b| nat_sort(&a.name, &b.name));
    Ok(subfolders)
}

#[tauri::command]
pub fn create_subfolder(parent_path: String, folder_name: String) -> Result<SubfolderItem, String> {
    let clean_name = folder_name.trim();
    if clean_name.is_empty() || clean_name.contains('/') || clean_name.contains('\\') {
        return Err("Invalid folder name".to_string());
    }

    let new_dir = Path::new(&parent_path).join(clean_name);
    if new_dir.exists() {
        return Err("Folder already exists".to_string());
    }

    fs::create_dir_all(&new_dir).map_err(|e| e.to_string())?;

    Ok(SubfolderItem {
        id: new_dir.to_string_lossy().to_string(),
        name: clean_name.to_string(),
        parent_path,
        direct_children_count: 0,
        file_count: Some(0),
    })
}

// Simple natural sort comparing chunks of numbers vs strings
fn nat_sort(a: &str, b: &str) -> std::cmp::Ordering {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let mut i = 0;
    let mut j = 0;

    while i < a_chars.len() && j < b_chars.len() {
        if a_chars[i].is_ascii_digit() && b_chars[j].is_ascii_digit() {
            let mut num_a: u64 = 0;
            while i < a_chars.len() && a_chars[i].is_ascii_digit() {
                num_a = num_a.saturating_mul(10).saturating_add(a_chars[i].to_digit(10).unwrap() as u64);
                i += 1;
            }

            let mut num_b: u64 = 0;
            while j < b_chars.len() && b_chars[j].is_ascii_digit() {
                num_b = num_b.saturating_mul(10).saturating_add(b_chars[j].to_digit(10).unwrap() as u64);
                j += 1;
            }

            if num_a != num_b {
                return num_a.cmp(&num_b);
            }
        } else {
            let ca = a_chars[i].to_ascii_lowercase();
            let cb = b_chars[j].to_ascii_lowercase();
            if ca != cb {
                return ca.cmp(&cb);
            }
            i += 1;
            j += 1;
        }
    }

    a_chars.len().cmp(&b_chars.len())
}
