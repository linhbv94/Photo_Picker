use super::{file_safety::*, jpeg_orientation::rotated_jpeg};
use serde::Serialize;
use std::{
    fs::OpenOptions,
    io::{Read, Write},
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Debug, Serialize)]
pub struct RotateResponse {
    pub success_count: usize,
    pub failed_count: usize,
    pub results: Vec<FileResult>,
    pub cache_bust_timestamp: u64,
}

#[tauri::command]
pub fn rotate_lossless(
    file_paths: Vec<String>,
    degrees: i32,
    confirmation_token: Option<String>,
) -> Result<RotateResponse, String> {
    let _guard = MUTATIONS.lock().map_err(|e| e.to_string())?;
    let plan = take_plan(
        &confirmation_token.ok_or("Cần preview và xác nhận")?,
        "ROTATE",
    )?;
    if plan.degrees != Some(degrees)
        || plan.entries.len() != file_paths.len()
        || plan.entries.iter().zip(file_paths).any(|(e, p)| {
            resolved(Path::new(&p))
                .map(|s| s != Path::new(&e.source))
                .unwrap_or(true)
        })
    {
        return Err("Thao tác xoay đã đổi sau preview".into());
    }
    validate_entries(&plan.entries)?;
    let mut result = OperationResult::default();
    for e in plan.entries {
        result.push(&e, rotate_entry(&e, degrees));
    }
    Ok(RotateResponse {
        success_count: result.success_count,
        failed_count: result.failed_count,
        results: result.results,
        cache_bust_timestamp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_millis() as u64,
    })
}

fn rotate_entry(e: &Entry, degrees: i32) -> Result<String, String> {
    unchanged(Path::new(&e.source), &e.expected)?;
    let mut bytes = Vec::new();
    regular_file(Path::new(&e.source))?
        .take(256 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    let output = rotated_jpeg(&bytes, degrees)?;
    unchanged(Path::new(&e.source), &e.expected)?;
    let mut j = Journal::new("ROTATE", e)?;
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&j.stage)
        .map_err(|e| j.problem(e))?;
    file.write_all(&output).map_err(|e| j.problem(e))?;
    file.set_permissions(
        std::fs::metadata(&e.source)
            .map_err(|e| j.problem(e))?
            .permissions(),
    )
    .map_err(|e| j.problem(e))?;
    file.sync_all().map_err(|e| j.problem(e))?;
    drop(file);
    let expected = snapshot(Path::new(&j.stage))?;
    j.output_hash = Some(expected.sha256.clone());
    j.output_expected = Some(expected);
    sync_parent(Path::new(&j.stage))?;
    j.save("output_ready")?;
    unchanged(Path::new(&e.source), &e.expected)?;
    rename_exclusive(Path::new(&e.source), Path::new(&j.backup)).map_err(|err| j.problem(err))?;
    unchanged(Path::new(&j.backup), &e.expected).map_err(|err| j.problem(err))?;
    sync_parent(Path::new(&e.source))?;
    sync_parent(Path::new(&j.backup))?;
    j.save("original_saved")?;
    fault_point("rotation_original_saved");
    if let Err(error) = rename_exclusive(Path::new(&j.stage), Path::new(&e.source)) {
        let rollback = rename_exclusive(Path::new(&j.backup), Path::new(&e.source));
        return Err(j.problem(format!(
            "Không publish được ảnh: {}; rollback: {:?}",
            error, rollback
        )));
    }
    sync_parent(Path::new(&e.source))?;
    fault_point("rotation_published");
    j.save("completed")?;
    Ok(j.journal_path)
}
