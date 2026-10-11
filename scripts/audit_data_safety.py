#!/usr/bin/env python3
"""Safety regressions sau sửa; bằng chứng trước sửa lưu trong docs/data_safety_audit.md."""
import pathlib, subprocess
root=pathlib.Path(__file__).resolve().parents[1]
subprocess.run(["cargo","test","--offline","--lib"],cwd=root/"src-tauri",check=True)
