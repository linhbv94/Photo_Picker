#!/usr/bin/env python3
"""Type-check chính core production + tests cho Windows MSVC từ Mac, không giả lập runtime."""
import pathlib, subprocess, tempfile
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="vxphotos_windows_check_") as folder:
    folder=pathlib.Path(folder);(folder/"src").mkdir()
    (folder/"Cargo.toml").write_text("""[package]
name = "vxphotos_safety_check"
version = "0.1.0"
edition = "2021"
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sha2 = "0.10"
uuid = { version = "1", features = ["v4"] }
chrono = "0.4"
kamadak-exif = "0.6"
[target.'cfg(unix)'.dependencies]
libc = "0.2"
""")
    names=["file_safety","jpeg_orientation","exif_reader","rename","move_copy","rotate","file_safety_tests"]
    for name in names:
        source=(root/"src-tauri/src/commands"/(name+".rs")).read_text()
        (folder/"src"/(name+".rs")).write_text(source.replace("#[tauri::command]", ""))
    (folder/"src/lib.rs").write_text("\n".join(("#[cfg(test)] " if n=="file_safety_tests" else "")+"mod "+n+";" for n in names))
    subprocess.run(["cargo","check","--offline","--tests","--target","x86_64-pc-windows-msvc","--target-dir",str(root/"src-tauri/target/safety_check"),"--manifest-path",str(folder/"Cargo.toml")],check=True)
print("Windows core + tests type-check đạt; chưa chạy runtime Windows.")
