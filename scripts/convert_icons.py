import os
import sys
import struct
import shutil
import subprocess

def create_ico(png_sizes_and_paths, output_ico_path):
    """
    Creates a valid Windows .ico file from a list of (width, height, png_path).
    Windows Vista+ supports PNG-compressed icons directly in .ico.
    """
    images_data = []
    for w, h, p in png_sizes_and_paths:
        with open(p, 'rb') as f:
            data = f.read()
        images_data.append((w, h, data))

    num_images = len(images_data)
    # Header: 6 bytes
    # Entries: 16 bytes each
    offset = 6 + (num_images * 16)

    header = struct.pack('<HHH', 0, 1, num_images)
    entries = []
    for w, h, data in images_data:
        b_width = 0 if w >= 256 else w
        b_height = 0 if h >= 256 else h
        size = len(data)
        entry = struct.pack('<BBBBHHII', b_width, b_height, 0, 0, 1, 32, size, offset)
        entries.append(entry)
        offset += size

    with open(output_ico_path, 'wb') as f:
        f.write(header)
        for entry in entries:
            f.write(entry)
        for _, _, data in images_data:
            f.write(data)
    print(f"Created {output_ico_path} ({len(images_data)} resolutions)")

def convert_app_icons(app_name, icns_src, trans_src, fill_src, icons_dir):
    print(f"\n================ Processing {app_name} ================")
    os.makedirs(icons_dir, exist_ok=True)
    temp_dir = os.path.join(icons_dir, "_temp_icon_gen")
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    # 1. Generate macOS .icns using native iconutil & sips
    print("1. Generating macOS .icns from:", icns_src)
    iconset_dir = os.path.join(temp_dir, f"{app_name}.iconset")
    os.makedirs(iconset_dir, exist_ok=True)

    iconset_specs = [
        ("icon_16x16.png", 16),
        ("icon_16x16@2x.png", 32),
        ("icon_32x32.png", 32),
        ("icon_32x32@2x.png", 64),
        ("icon_128x128.png", 128),
        ("icon_128x128@2x.png", 256),
        ("icon_256x256.png", 256),
        ("icon_256x256@2x.png", 512),
        ("icon_512x512.png", 512),
        ("icon_512x512@2x.png", 1024),
    ]

    for filename, size in iconset_specs:
        out_path = os.path.join(iconset_dir, filename)
        subprocess.run(["sips", "-z", str(size), str(size), icns_src, "--out", out_path], check=True, stdout=subprocess.DEVNULL)

    output_icns = os.path.join(icons_dir, "icon.icns")
    subprocess.run(["/usr/bin/iconutil", "-c", "icns", iconset_dir, "-o", output_icns], check=True)
    print("-> Successfully generated:", output_icns)

    # 2. Generate Windows .ico from trans_src
    print("2. Generating Windows .ico from:", trans_src)
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    ico_entries = []
    for sz in ico_sizes:
        png_out = os.path.join(temp_dir, f"ico_{sz}.png")
        subprocess.run(["sips", "-z", str(sz), str(sz), trans_src, "--out", png_out], check=True, stdout=subprocess.DEVNULL)
        ico_entries.append((sz, sz, png_out))

    output_ico = os.path.join(icons_dir, "icon.ico")
    create_ico(ico_entries, output_ico)

    # 3. Generate flexible PNG icons from fill_src
    print("3. Generating standard & store PNGs from:", fill_src)
    png_specs = [
        ("32x32.png", 32),
        ("64x64.png", 64),
        ("128x128.png", 128),
        ("128x128@2x.png", 256),
        ("icon.png", 512),
        ("Square30x30Logo.png", 30),
        ("Square44x44Logo.png", 44),
        ("Square71x71Logo.png", 71),
        ("Square89x89Logo.png", 89),
        ("Square107x107Logo.png", 107),
        ("Square142x142Logo.png", 142),
        ("Square150x150Logo.png", 150),
        ("Square284x284Logo.png", 284),
        ("Square310x310Logo.png", 310),
        ("StoreLogo.png", 50),
    ]

    for filename, size in png_specs:
        target_path = os.path.join(icons_dir, filename)
        subprocess.run(["sips", "-z", str(size), str(size), fill_src, "--out", target_path], check=True, stdout=subprocess.DEVNULL)

    # Cleanup temp
    shutil.rmtree(temp_dir, ignore_errors=True)
    print(f"✓ All icons for {app_name} generated successfully in {icons_dir}!")

if __name__ == "__main__":
    # 1. Process VXPhotos (photo_picker)
    convert_app_icons(
        app_name="VXPhotos",
        icns_src="/Users/vic/_Work/zTools/photo_picker/vxphoto_icon_icns.png",
        trans_src="/Users/vic/_Work/zTools/photo_picker/vxphoto_icon_trans.png",
        fill_src="/Users/vic/_Work/zTools/photo_picker/vxphoto_icon_fill.png",
        icons_dir="/Users/vic/_Work/zTools/photo_picker/src-tauri/icons"
    )

    # 2. Process VXMedia (media_tool)
    convert_app_icons(
        app_name="VXMedia",
        icns_src="/Users/vic/_Work/zTools/media_tool/vxmedia_icon_icns.png",
        trans_src="/Users/vic/_Work/zTools/media_tool/vxmedia_icon_trans.png",
        fill_src="/Users/vic/_Work/zTools/media_tool/vxmedia_icon_fill.png",
        icons_dir="/Users/vic/_Work/zTools/media_tool/src-tauri/icons"
    )

    # Also copy icon.icns to media_tool root if needed (media_tool has icon.icns in root)
    if os.path.exists("/Users/vic/_Work/zTools/media_tool/icon.icns"):
        shutil.copy2("/Users/vic/_Work/zTools/media_tool/src-tauri/icons/icon.icns", "/Users/vic/_Work/zTools/media_tool/icon.icns")
        print("Copied updated icon.icns to media_tool root")
