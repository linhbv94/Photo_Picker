#!/usr/bin/env python3
"""Regression pixel trước/sau 4 lần xoay qua chính pipeline production trên macOS.

Chỉ tạo ảnh tổng hợp trong temp; không sử dụng ảnh người dùng.
Không đánh đồng metadata rotation với DCT rotation; compressed stream được test riêng.
"""
import hashlib
import pathlib
import struct
import subprocess
import tempfile
import zlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

def image(path):
    width, height = 64, 48
    raw = b"".join(b"\0" + bytes((x * 43 + y * 71 + channel * x * y * 13) % 256
        for x in range(width) for channel in range(3)) for y in range(height))
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))

def pixels(path):
    data = path.read_bytes(); offset = 8; compressed = b""
    while offset < len(data):
        length = struct.unpack(">I", data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]; payload = data[offset+8:offset+8+length]
        if kind == b"IHDR":
            width, height, depth, color, _, _, interlace = struct.unpack(">IIBBBBB", payload)
        elif kind == b"IDAT": compressed += payload
        offset += length + 12
    assert depth == 8 and color in (2, 6) and interlace == 0, "PNG fixture decoder supports RGB/RGBA 8-bit only"
    channels = 3 if color == 2 else 4; stride = width * channels
    raw = zlib.decompress(compressed); offset = 0; previous = [0] * stride; rgb = []
    for _ in range(height):
        filt = raw[offset]; row = list(raw[offset+1:offset+1+stride]); offset += stride + 1
        for i in range(stride):
            a = row[i-channels] if i >= channels else 0
            b = previous[i]; c = previous[i-channels] if i >= channels else 0
            if filt == 1: predictor = a
            elif filt == 2: predictor = b
            elif filt == 3: predictor = (a+b)//2
            elif filt == 4:
                p = a+b-c; distances = [abs(p-a), abs(p-b), abs(p-c)]
                predictor = [a,b,c][distances.index(min(distances))]
            elif filt == 0: predictor = 0
            else: raise ValueError("Unsupported PNG filter")
            row[i] = (row[i] + predictor) % 256
        rgb.extend(row[i:i+3] for i in range(0, stride, channels)); previous = row
    return (width, height), rgb

def sips(*args):
    subprocess.run(["/usr/bin/sips", *map(str, args)], check=True, stdout=subprocess.DEVNULL)

def main():
    if sys.platform != "darwin": raise SystemExit("Audit runtime này chỉ kiểm chứng macOS")
    commands = ROOT / "src-tauri/src/commands"
    deps = ROOT / "src-tauri/target/debug/deps"
    with tempfile.TemporaryDirectory(prefix="vxphotos_rotate_regression_") as temp:
        temp = pathlib.Path(temp)
        rust = temp / "rotate.rs"; binary = temp / "rotate"
        modules=[]
        for name in ["file_safety","jpeg_orientation","rotate"]:
            source=(commands / (name+".rs")).read_text()
            print(name, "sha256", hashlib.sha256(source.encode()).hexdigest(), flush=True)
            modules.append("pub mod "+name+" {\n"+source.replace("#[tauri::command]", "")+"\n}")
        rust.write_text("mod commands {\n"+"\n".join(modules)+"\n}\n"+'''
fn main() {
    let args: Vec<String> = std::env::args().collect();
    for _ in 0..4 {
        let plan=commands::file_safety::preview_file_operation(vec![args[1].clone()],"ROTATE".into(),None,Some(90)).unwrap();
        let result=commands::rotate::rotate_lossless(vec![args[1].clone()],90,Some(plan.token)).unwrap();
        assert_eq!(result.success_count,1);
    }
}
''')
        # Let Cargo select one coherent set of serde features/dependencies.
        (temp/"Cargo.toml").write_text('''[package]
name = "vxphotos_rotation_regression"
version = "0.1.0"
edition = "2021"
[[bin]]
name = "vxphotos_rotation_regression"
path = "rotate.rs"
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sha2 = "0.10"
uuid = { version = "1", features = ["v4"] }
libc = "0.2"
''')
        target=ROOT/"src-tauri/target/safety_check"
        subprocess.run(["cargo","build","--offline","--quiet","--manifest-path",str(temp/"Cargo.toml"),"--target-dir",str(target)],check=True)
        binary=target/"debug/vxphotos_rotation_regression"
        png = temp / "synthetic.png"; jpeg = temp / "ảnh_gốc.jpg"
        before = temp / "before.png"; after = temp / "after.png"
        image(png)
        sips("-s", "format", "jpeg", "-s", "formatOptions", "80", png, "--out", jpeg)
        sips("-s", "format", "png", jpeg, "--out", before)
        subprocess.run([str(binary), str(jpeg)], check=True)
        sips("-s", "format", "png", jpeg, "--out", after)
        size_a, a = pixels(before); size_b, b = pixels(after)
        assert size_a == size_b
        changed = sum(x != y for x, y in zip(a, b))
        maximum = max(abs(c-d) for x,y in zip(a,b) for c,d in zip(x,y))
        print(f"4 lần xoay 90°: kích thước {size_a}, pixel RGB thay đổi {changed}/{len(a)}, max channel delta={maximum}")
        assert changed == 0, "JPEG pixels changed after a full orientation round trip"
        print("PASS: JPEG 4×90° giữ nguyên pixel giải mã; dùng pipeline preview/journal production.")

if __name__ == "__main__": main()
