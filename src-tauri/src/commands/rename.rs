use super::{exif_reader::read_exif_fast, file_safety::*};
use chrono::{DateTime, Local, NaiveDateTime};
use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, HashSet},
    path::Path,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenameDiffItem {
    pub original_path: String,
    pub original_filename: String,
    pub new_filename: String,
    pub new_path: String,
    pub has_conflict: bool,
    pub conflict_resolution: Option<String>,
    #[serde(default)]
    pub preview_token: String,
    #[serde(default)]
    pub time_source: String,
    #[serde(default)]
    pub skip_reason: Option<String>,
}

#[tauri::command]
pub fn preview_batch_rename(
    file_paths: Vec<String>,
    _naming_pattern: Option<String>,
    fallback_to_mtime: Option<bool>,
) -> Result<Vec<RenameDiffItem>, String> {
    let _guard = MUTATIONS.lock().map_err(|e| e.to_string())?;
    let mut groups: BTreeMap<String, Vec<(String, String, String, String, Snapshot)>> =
        BTreeMap::new();
    let mut skipped = Vec::new();
    let mut identities = HashSet::new();
    for input in file_paths {
        let source = resolved(Path::new(&input))?;
        let stamp = snapshot(&source)?;
        if !identities.insert(stamp.identity.clone()) {
            return Err("Nguồn trùng/hardlink trong batch".into());
        }
        let filename = source
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Tên không UTF-8")?
            .to_string();
        let path = source.to_str().ok_or("Path không UTF-8")?.to_string();
        let exif = read_exif_fast(&source);
        let date = exif
            .as_ref()
            .and_then(|e| e.date_taken.as_ref())
            .and_then(|s| NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S").ok());
        let (time, provenance) = if let Some(date) = date {
            (Some(date.format("%Y%m%d_%H%M").to_string()), "exif")
        } else if fallback_to_mtime.unwrap_or(false) {
            let m = std::fs::metadata(&source)
                .map_err(|e| e.to_string())?
                .modified()
                .map_err(|e| e.to_string())?;
            let d: DateTime<Local> = m.into();
            (Some(d.format("%Y%m%d_%H%M").to_string()), "mtime")
        } else {
            (None, "unknown")
        };
        if let Some(time) = time {
            // Use a single total ordering, never switch comparators per pair.
            let sub = exif.and_then(|e| e.sub_sec_time).unwrap_or_default();
            unchanged(&source, &stamp)?;
            groups
                .entry(format!("{}|{}", source.parent().unwrap().display(), time))
                .or_default()
                .push((path, filename, sub, provenance.into(), stamp));
        } else {
            skipped.push(RenameDiffItem {
                original_path: path.clone(),
                original_filename: filename.clone(),
                new_filename: filename,
                new_path: path,
                has_conflict: false,
                conflict_resolution: None,
                preview_token: String::new(),
                time_source: provenance.into(),
                skip_reason: Some("Không có ngày chụp hợp lệ; giữ nguyên tên".into()),
            });
        }
    }
    let mut items = Vec::new();
    let mut entries = Vec::new();
    for (key, mut files) in groups {
        let time = key.rsplit('|').next().unwrap();
        files.sort_by(|a, b| a.2.cmp(&b.2).then(a.1.cmp(&b.1)));
        let count = files.len();
        for (i, (path, filename, _, provenance, expected)) in files.into_iter().enumerate() {
            let p = Path::new(&path);
            let ext = p.extension().and_then(|n| n.to_str()).unwrap_or("");
            let new_filename = if count > 1 {
                format!("{}_{:02}.{}", time, i + 1, ext)
            } else {
                format!("{}.{}", time, ext)
            };
            let target = p.parent().unwrap().join(&new_filename);
            let new_path = target.to_str().ok_or("Path không UTF-8")?.to_string();
            let conflict = exists(&target)? && target != p;
            let skip = if target == p {
                Some("Tên đã đúng; không thay đổi".into())
            } else {
                None
            };
            if skip.is_none() {
                entries.push(Entry {
                    source: path.clone(),
                    target: new_path.clone(),
                    expected,
                });
            }
            items.push(RenameDiffItem {
                original_path: path,
                original_filename: filename,
                new_filename,
                new_path,
                has_conflict: conflict,
                conflict_resolution: None,
                preview_token: String::new(),
                time_source: provenance,
                skip_reason: skip,
            });
        }
    }
    let plan = save_plan("RENAME", None, entries)?;
    for item in &mut items {
        if item.skip_reason.is_none() {
            item.preview_token = plan.token.clone();
        }
    }
    items.extend(skipped);
    Ok(items)
}

#[tauri::command]
pub fn apply_batch_rename(items: Vec<RenameDiffItem>) -> Result<OperationResult, String> {
    let _guard = MUTATIONS.lock().map_err(|e| e.to_string())?;
    let active: Vec<_> = items.iter().filter(|i| i.skip_reason.is_none()).collect();
    let token = &active
        .first()
        .ok_or("Không có tệp đủ điều kiện đổi tên")?
        .preview_token;
    if active.iter().any(|i| &i.preview_token != token) {
        return Err("Batch dùng nhiều preview khác nhau".into());
    }
    let plan = take_plan(token, "RENAME")?;
    if plan.entries.len() != active.len()
        || plan.entries.iter().zip(&active).any(|(e, i)| {
            e.source != i.original_path
                || e.target != i.new_path
                || Path::new(&e.source).parent() != Path::new(&e.target).parent()
        })
    {
        return Err("Batch đã đổi sau preview; không thực thi".into());
    }
    validate_entries(&plan.entries)?;
    let mut result = OperationResult::default();
    for e in plan.entries {
        result.push(&e, execute_rename(&e, "RENAME"));
    }
    Ok(result)
}
