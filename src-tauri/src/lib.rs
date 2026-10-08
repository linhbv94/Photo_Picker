mod commands;

use commands::*;
use tauri::Emitter;
#[cfg(target_os = "macos")]
use tauri::menu::{AboutMetadataBuilder, MenuBuilder, MenuItemBuilder, SubmenuBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                let about_metadata = AboutMetadataBuilder::new()
                    .name(Some("VXPhotos"))
                    .version(Some(env!("CARGO_PKG_VERSION")))
                    .copyright(Some("by Viet Linh Bui"))
                    .authors(Some(vec!["Viet Linh Bui".into()]))
                    .comments(Some("Trình duyệt và chọn lọc ảnh cá nhân siêu nhẹ"))
                    .build();

                let settings_item = MenuItemBuilder::with_id("open_settings", "Cài đặt...")
                    .accelerator("CmdOrCtrl+,")
                    .build(app)?;

                let app_submenu = SubmenuBuilder::new(app, "VXPhotos")
                    .about(Some(about_metadata))
                    .separator()
                    .item(&settings_item)
                    .separator()
                    .services()
                    .separator()
                    .hide()
                    .hide_others()
                    .show_all()
                    .separator()
                    .quit()
                    .build()?;

                let open_folder = MenuItemBuilder::with_id("open_folder", "Mở thư mục...")
                    .accelerator("CmdOrCtrl+O")
                    .build(app)?;

                let file_submenu = SubmenuBuilder::new(app, "File")
                    .item(&open_folder)
                    .separator()
                    .close_window()
                    .build()?;

                let select_all = MenuItemBuilder::with_id("select_all", "Chọn tất cả")
                    .accelerator("CmdOrCtrl+A")
                    .build(app)?;
                let deselect_all = MenuItemBuilder::with_id("deselect_all", "Bỏ chọn tất cả")
                    .accelerator("Escape")
                    .build(app)?;

                let edit_submenu = SubmenuBuilder::new(app, "Edit")
                    .item(&select_all)
                    .item(&deselect_all)
                    .build()?;

                let view_grid = MenuItemBuilder::with_id("view_grid", "Chế độ lưới ảnh")
                    .accelerator("CmdOrCtrl+1")
                    .build(app)?;
                let view_detail = MenuItemBuilder::with_id("view_detail", "Chế độ danh sách chi tiết")
                    .accelerator("CmdOrCtrl+2")
                    .build(app)?;
                let toggle_sidebar = MenuItemBuilder::with_id("toggle_sidebar", "Bật/Tắt thanh bên")
                    .accelerator("CmdOrCtrl+B")
                    .build(app)?;
                let toggle_info = MenuItemBuilder::with_id("toggle_info", "Bật/Tắt thông tin ảnh")
                    .accelerator("CmdOrCtrl+I")
                    .build(app)?;

                let view_submenu = SubmenuBuilder::new(app, "View")
                    .item(&view_grid)
                    .item(&view_detail)
                    .separator()
                    .item(&toggle_sidebar)
                    .item(&toggle_info)
                    .build()?;

                let rotate_photo = MenuItemBuilder::with_id("rotate_photo", "Xoay ảnh 90° không giảm chất lượng")
                    .accelerator("R")
                    .build(app)?;
                let batch_rename = MenuItemBuilder::with_id("batch_rename", "Đổi tên hàng loạt...")
                    .accelerator("CmdOrCtrl+R")
                    .build(app)?;

                let tools_submenu = SubmenuBuilder::new(app, "Tools")
                    .item(&rotate_photo)
                    .item(&batch_rename)
                    .build()?;

                let menu = MenuBuilder::new(app)
                    .item(&app_submenu)
                    .item(&file_submenu)
                    .item(&edit_submenu)
                    .item(&view_submenu)
                    .item(&tools_submenu)
                    .build()?;

                let _ = app.set_menu(menu);
            }

            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = main_win.set_decorations(false);
                }
            }
            Ok(())
        })
        .on_menu_event(|app_handle, event| match event.id().as_ref() {
            "open_folder" => {
                let _ = app_handle.emit("trigger-open-folder", ());
            }
            "open_settings" => {
                let _ = app_handle.emit("trigger-open-settings", ());
            }
            "select_all" => {
                let _ = app_handle.emit("trigger-select-all", ());
            }
            "deselect_all" => {
                let _ = app_handle.emit("trigger-deselect-all", ());
            }
            "view_grid" => {
                let _ = app_handle.emit("trigger-view-grid", ());
            }
            "view_detail" => {
                let _ = app_handle.emit("trigger-view-detail", ());
            }
            "toggle_sidebar" => {
                let _ = app_handle.emit("trigger-toggle-sidebar", ());
            }
            "toggle_info" => {
                let _ = app_handle.emit("trigger-toggle-info", ());
            }
            "rotate_photo" => {
                let _ = app_handle.emit("trigger-rotate-photo", ());
            }
            "batch_rename" => {
                let _ = app_handle.emit("trigger-batch-rename", ());
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            read_directory,
            get_subfolders,
            create_subfolder,
            rotate_lossless,
            preview_batch_rename,
            apply_batch_rename,
            move_or_copy_files,
            select_folder_dialog,
            reveal_in_file_manager,
            open_in_system_viewer,
            open_native_preview,
            move_to_trash,
            clipboard_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running VXPhotos application");
}
