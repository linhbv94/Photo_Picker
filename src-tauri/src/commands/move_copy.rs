use super::file_safety::*;
use std::path::Path;

#[tauri::command]
pub fn move_or_copy_files(
    source_paths: Vec<String>,
    destination_folder: String,
    action_type: String,
    confirmation_token: Option<String>,
) -> Result<OperationResult, String> {
    let _guard = MUTATIONS.lock().map_err(|e| e.to_string())?;
    if !matches!(action_type.as_str(), "MOVE" | "COPY") {
        return Err("Sai thao tác MOVE/COPY".into());
    }
    let plan = take_plan(
        &confirmation_token.ok_or("Cần preview và xác nhận")?,
        &action_type,
    )?;
    let destination = std::fs::canonicalize(destination_folder).map_err(|e| e.to_string())?;
    if plan.entries.len() != source_paths.len()
        || plan.entries.iter().zip(source_paths).any(|(e, p)| {
            resolved(Path::new(&p))
                .map(|s| s != Path::new(&e.source))
                .unwrap_or(true)
                || Path::new(&e.target).parent() != Some(destination.as_path())
        })
    {
        return Err("Nguồn/đích đã đổi sau preview".into());
    }
    validate_entries(&plan.entries)?;
    let mut result = OperationResult::default();
    for e in plan.entries {
        result.push(&e, execute(&e, &action_type));
    }
    Ok(result)
}

fn execute(e: &Entry, action: &str) -> Result<String, String> {
    unchanged(Path::new(&e.source), &e.expected)?;
    let mut j = Journal::new(action, e)?;
    if action == "MOVE" {
        match rename_exclusive(Path::new(&e.source), Path::new(&e.target)) {
            Ok(()) => {
                unchanged(Path::new(&e.target), &e.expected).map_err(|e| j.problem(e))?;
                sync_parent(Path::new(&e.source))?;
                sync_parent(Path::new(&e.target))?;
                j.save("completed").map_err(|e| j.problem(e))?;
                return Ok(j.journal_path);
            }
            Err(error) => {
                #[cfg(unix)]
                let cross_volume = error.raw_os_error() == Some(libc::EXDEV);
                #[cfg(windows)]
                let cross_volume = error.raw_os_error() == Some(17);
                #[cfg(not(any(unix, windows)))]
                let cross_volume = false;
                if !cross_volume {
                    return Err(j.problem(error));
                }
            }
        }
    }
    copy_staged(&mut j).map_err(|e| j.problem(e))?;
    if action == "MOVE" {
        unchanged(Path::new(&e.source), &e.expected).map_err(|e| j.problem(e))?;
        // Retain the original on the source volume for recovery instead of unlinking it.
        rename_exclusive(Path::new(&e.source), Path::new(&j.backup))
            .map_err(|err| j.problem(format!("Đã copy sang đích nhưng còn nguồn: {}", err)))?;
        unchanged(Path::new(&j.backup), &e.expected).map_err(|e| j.problem(e))?;
        sync_parent(Path::new(&e.source))?;
        sync_parent(Path::new(&j.backup))?;
    }
    j.save("completed").map_err(|e| j.problem(e))?;
    Ok(j.journal_path)
}
