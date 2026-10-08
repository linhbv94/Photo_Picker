#[tauri::command]
pub fn clipboard_files(
    window: tauri::Window,
    file_paths: Vec<String>,
    is_cut: bool,
) -> Result<bool, String> {
    if file_paths.is_empty() {
        return Ok(false);
    }

    #[cfg(target_os = "macos")]
    {
        let _ = window;
        return macos_clipboard_files(&file_paths, is_cut);
    }

    #[cfg(target_os = "windows")]
    {
        // Tauri and this adapter use different windows crate versions. Bridge the raw handle.
        let hwnd = window
            .hwnd()
            .ok()
            .map(|handle| windows::Win32::Foundation::HWND(handle.0));
        return windows_clipboard_files(hwnd, &file_paths, is_cut);
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = window;
        let _ = is_cut;
        Ok(true)
    }
}

#[cfg(target_os = "macos")]
fn macos_clipboard_files(file_paths: &[String], _is_cut: bool) -> Result<bool, String> {
    use cocoa::base::{id, nil};
    use cocoa::foundation::{NSArray, NSString};
    use objc::{msg_send, sel, sel_impl};

    unsafe {
        let pasteboard: id = msg_send![objc::runtime::Class::get("NSPasteboard").unwrap(), generalPasteboard];
        let _: () = msg_send![pasteboard, clearContents];

        let mut urls = Vec::new();
        for path_str in file_paths {
            let ns_path = NSString::alloc(nil).init_str(path_str);
            let url: id = msg_send![objc::runtime::Class::get("NSURL").unwrap(), fileURLWithPath: ns_path];
            if url != nil {
                urls.push(url);
            }
        }

        let urls_array = NSArray::arrayWithObjects(nil, &urls);
        let success: bool = msg_send![pasteboard, writeObjects: urls_array];

        Ok(success)
    }
}

#[cfg(target_os = "windows")]
fn windows_clipboard_files(
    hwnd: Option<windows::Win32::Foundation::HWND>,
    file_paths: &[String],
    is_cut: bool,
) -> Result<bool, String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::Win32::Foundation::*;
    use windows::Win32::System::DataExchange::*;
    use windows::Win32::System::Memory::*;
    use windows::Win32::System::Ole::CF_HDROP;
    use windows::Win32::UI::Shell::*;

    unsafe {
        OpenClipboard(hwnd.unwrap_or_default())
            .map_err(|e| format!("Failed to open Windows clipboard: {e}"))?;

        struct ClipboardGuard;
        impl Drop for ClipboardGuard {
            fn drop(&mut self) {
                unsafe {
                    let _ = CloseClipboard();
                }
            }
        }
        let _guard = ClipboardGuard;

        EmptyClipboard().map_err(|e| format!("Failed to empty clipboard: {e}"))?;

        // Build double null-terminated UTF-16 buffer
        let mut buffer: Vec<u16> = Vec::new();
        for path in file_paths {
            let wide: Vec<u16> = OsStr::new(path).encode_wide().collect();
            buffer.extend(wide);
            buffer.push(0); // single null
        }
        buffer.push(0); // double null terminator

        let dropfiles_size = std::mem::size_of::<DROPFILES>();
        let total_size = dropfiles_size + (buffer.len() * 2);

        let h_global = GlobalAlloc(GHND, total_size).map_err(|e| e.to_string())?;
        let p_data = GlobalLock(h_global) as *mut DROPFILES;
        if p_data.is_null() {
            let _ = GlobalFree(h_global);
            return Err("Failed to lock global memory for clipboard".into());
        }

        (*p_data).pFiles = dropfiles_size as u32;
        (*p_data).fWide = true.into();

        let p_paths = (p_data as *mut u8).add(dropfiles_size) as *mut u16;
        std::ptr::copy_nonoverlapping(buffer.as_ptr(), p_paths, buffer.len());

        let _ = GlobalUnlock(h_global);

        if let Err(e) = SetClipboardData(CF_HDROP.0 as u32, HANDLE(h_global.0)) {
            let _ = GlobalFree(h_global);
            return Err(format!("SetClipboardData failed: {e}"));
        }

        // If cut, register CFSTR_PREFERREDDROPEFFECT with DROPEFFECT_MOVE (0x2)
        if is_cut {
            let format_name: Vec<u16> = OsStr::new("Preferred DropEffect")
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();
            let format_id = RegisterClipboardFormatW(windows::core::PCWSTR(format_name.as_ptr()));
            if format_id == 0 {
                return Err("RegisterClipboardFormatW for Preferred DropEffect failed".into());
            }
            let h_effect = GlobalAlloc(GHND, 4)
                .map_err(|e| format!("GlobalAlloc for Preferred DropEffect failed: {e}"))?;
            let p_effect = GlobalLock(h_effect) as *mut u32;
            if p_effect.is_null() {
                let _ = GlobalFree(h_effect);
                return Err("Failed to lock memory for Preferred DropEffect".into());
            }
            *p_effect = 2; // DROPEFFECT_MOVE
            let _ = GlobalUnlock(h_effect);
            if let Err(e) = SetClipboardData(format_id, HANDLE(h_effect.0)) {
                let _ = GlobalFree(h_effect);
                return Err(format!("SetClipboardData for Preferred DropEffect failed: {e}"));
            }
        }

        Ok(true)
    }
}
