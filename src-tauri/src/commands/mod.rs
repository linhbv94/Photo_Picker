pub mod exif_reader;
pub mod fs_scan;
pub mod move_copy;
pub mod platform;
pub mod rename;
pub mod rotate;
pub mod clipboard;

pub use fs_scan::{create_subfolder, get_subfolders, read_directory};
pub use move_copy::move_or_copy_files;
pub use platform::{
    move_to_trash, open_in_system_viewer, open_native_preview, reveal_in_file_manager,
    select_folder_dialog,
};
pub use rename::{apply_batch_rename, preview_batch_rename};
pub use rotate::rotate_lossless;
pub use clipboard::clipboard_files;

pub mod file_safety;
pub mod jpeg_orientation;
pub use file_safety::{preview_file_operation,list_file_recovery,restore_file_operation};
#[cfg(test)] mod file_safety_tests;
