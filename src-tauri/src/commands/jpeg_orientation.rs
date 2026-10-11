//! JPEG metadata rotation. Compressed image stream and all non-EXIF markers stay byte-identical.
//! This is EXIF orientation editing, not a DCT transform or Orientation=1 normalization.
fn u16_at(b: &[u8], i: usize, le: bool) -> Result<u16, String> {
    let a: [u8; 2] = b.get(i..i + 2).ok_or("EXIF bị cắt")?.try_into().unwrap();
    Ok(if le {
        u16::from_le_bytes(a)
    } else {
        u16::from_be_bytes(a)
    })
}
fn u32_at(b: &[u8], i: usize, le: bool) -> Result<u32, String> {
    let a: [u8; 4] = b.get(i..i + 4).ok_or("EXIF bị cắt")?.try_into().unwrap();
    Ok(if le {
        u32::from_le_bytes(a)
    } else {
        u32::from_be_bytes(a)
    })
}
fn put16(b: &mut [u8], i: usize, v: u16, le: bool) {
    b[i..i + 2].copy_from_slice(&if le { v.to_le_bytes() } else { v.to_be_bytes() });
}
fn put32(b: &mut [u8], i: usize, v: u32, le: bool) {
    b[i..i + 4].copy_from_slice(&if le { v.to_le_bytes() } else { v.to_be_bytes() });
}
fn orientation_after(mut old: u16, degrees: i32) -> Result<u16, String> {
    if !(1..=8).contains(&old) || !matches!(degrees, 90 | 180 | 270) {
        return Err("Orientation/góc xoay không hợp lệ".into());
    }
    // Composition of displayed EXIF transform with a clockwise quarter turn.
    for _ in 0..degrees / 90 {
        old = match old {
            1 => 6,
            2 => 7,
            3 => 8,
            4 => 5,
            5 => 2,
            6 => 3,
            7 => 4,
            8 => 1,
            _ => unreachable!(),
        };
    }
    Ok(old)
}
fn rotate_ifd(
    t: &mut Vec<u8>,
    offset: usize,
    le: bool,
    degrees: i32,
    default: u16,
) -> Result<(usize, u16), String> {
    let count = u16_at(t, offset, le)? as usize;
    let next_field = offset.checked_add(2 + count * 12).ok_or("EXIF overflow")?;
    u32_at(t, next_field, le)?;
    let mut found = None;
    for i in 0..count {
        let p = offset + 2 + i * 12;
        if u16_at(t, p, le)? == 0x112 {
            if found.is_some() || u16_at(t, p + 2, le)? != 3 || u32_at(t, p + 4, le)? != 1 {
                return Err("EXIF Orientation không chuẩn/duplicated".into());
            }
            found = Some(p + 8);
        }
    }
    let old = if let Some(p) = found {
        u16_at(t, p, le)?
    } else {
        default
    };
    let value = orientation_after(old, degrees)?;
    if let Some(p) = found {
        put16(t, p, value, le);
        return Ok((offset, old));
    }
    if count == u16::MAX as usize {
        return Err("EXIF quá nhiều entries".into());
    }
    // Append a new IFD, preserving every existing entry and relative data offset.
    // Existing MakerNotes/GPS/ICC data is not moved or decoded.
    if t.len() % 2 != 0 {
        t.push(0);
    }
    let start = t.len();
    let mut entries: Vec<[u8; 12]> = t[offset + 2..next_field]
        .chunks_exact(12)
        .map(|e| e.try_into().unwrap())
        .collect();
    let mut tag = [0u8; 12];
    put16(&mut tag, 0, 0x112, le);
    put16(&mut tag, 2, 3, le);
    put32(&mut tag, 4, 1, le);
    put16(&mut tag, 8, value, le);
    entries.push(tag);
    entries.sort_by_key(|e| u16_at(e, 0, le).unwrap());
    let next = t[next_field..next_field + 4].to_vec();
    t.extend_from_slice(&if le {
        ((count + 1) as u16).to_le_bytes()
    } else {
        ((count + 1) as u16).to_be_bytes()
    });
    for e in entries {
        t.extend_from_slice(&e);
    }
    t.extend(next);
    Ok((start, old))
}
fn rotate_exif(payload: &[u8], degrees: i32) -> Result<Vec<u8>, String> {
    let mut t = payload.get(6..).ok_or("EXIF thiếu header")?.to_vec();
    let le = match t.get(..2) {
        Some(b"II") => true,
        Some(b"MM") => false,
        _ => return Err("EXIF byte order lỗi".into()),
    };
    if u16_at(&t, 2, le)? != 42 {
        return Err("EXIF không phải TIFF chuẩn".into());
    }
    let root = u32_at(&t, 4, le)? as usize;
    if root < 8 {
        return Err("EXIF IFD offset lỗi".into());
    }
    let next_field = root + 2 + u16_at(&t, root, le)? as usize * 12;
    let next = u32_at(&t, next_field, le)? as usize;
    if next == root {
        return Err("EXIF IFD cycle".into());
    }
    let (new_root, old) = rotate_ifd(&mut t, root, le, degrees, 1)?;
    put32(&mut t, 4, new_root as u32, le);
    if next != 0 {
        if next < 8 {
            return Err("EXIF thumbnail IFD lỗi".into());
        }
        let nf = next + 2 + u16_at(&t, next, le)? as usize * 12;
        if u32_at(&t, nf, le)? != 0 {
            return Err("EXIF nhiều IFD chưa hỗ trợ".into());
        }
        let (new_next, _) = rotate_ifd(&mut t, next, le, degrees, old)?;
        let field = new_root + 2 + u16_at(&t, new_root, le)? as usize * 12;
        put32(&mut t, field, new_next as u32, le);
    }
    let mut p = b"Exif\0\0".to_vec();
    p.extend(t);
    if p.len() + 2 > 65535 {
        return Err("EXIF không còn chỗ cho Orientation".into());
    }
    Ok(p)
}

pub fn rotated_jpeg(data: &[u8], degrees: i32) -> Result<Vec<u8>, String> {
    if data.len() > 256 * 1024 * 1024 {
        return Err("JPEG quá lớn cho đường xoay hiện tại".into());
    }
    if !matches!(degrees, 90 | 180 | 270)
        || !data.starts_with(&[0xff, 0xd8])
        || !data.ends_with(&[0xff, 0xd9])
    {
        return Err("Chỉ hỗ trợ JPEG hợp lệ và góc 90/180/270; không sửa file khác".into());
    }
    let mut p = 2;
    let mut exif = None;
    let mut found_sof = false;
    let scan;
    loop {
        if data.get(p) != Some(&0xff) {
            return Err("JPEG marker lỗi".into());
        }
        let start = p;
        while data.get(p) == Some(&0xff) {
            p += 1;
        }
        let marker = *data.get(p).ok_or("JPEG bị cắt")?;
        p += 1;
        if marker == 0xd9 {
            return Err("JPEG thiếu dữ liệu ảnh".into());
        }
        let len = u16_at(data, p, false)? as usize;
        if len < 2 {
            return Err("JPEG segment length lỗi".into());
        }
        let end = p.checked_add(len).ok_or("JPEG overflow")?;
        let payload = data.get(p + 2..end).ok_or("JPEG segment bị cắt")?;
        if marker == 0xe1 && payload.starts_with(b"Exif\0\0") {
            if exif.is_some() {
                return Err("JPEG có nhiều EXIF segments; không tự sửa".into());
            }
            exif = Some((start, end, rotate_exif(payload, degrees)?));
        }
        if marker == 0xe1
            && payload.starts_with(b"http://ns.adobe.com/")
            && payload.windows(11).any(|w| w == b"Orientation")
        {
            return Err("XMP có Orientation; cần đồng bộ metadata trước khi xoay".into());
        }
        if matches!(marker, 0xc0 | 0xc1 | 0xc2) {
            found_sof = true;
        }
        if marker == 0xda {
            if !found_sof {
                return Err("JPEG thiếu frame".into());
            }
            scan = start;
            break;
        }
        p = end;
    }
    let (start, end, payload) = if let Some(e) = exif {
        e
    } else {
        let value = orientation_after(1, degrees)?;
        let mut p =
            b"Exif\0\0II\x2a\0\x08\0\0\0\x01\0\x12\x01\x03\0\x01\0\0\0\x01\0\0\0\0\0\0\0".to_vec();
        put16(&mut p, 24, value, true);
        (2, 2, p)
    };
    let mut out = Vec::with_capacity(data.len() + payload.len() + 4);
    out.extend_from_slice(&data[..start]);
    out.extend_from_slice(&[0xff, 0xe1]);
    out.extend_from_slice(&((payload.len() + 2) as u16).to_be_bytes());
    out.extend(payload);
    out.extend_from_slice(&data[end..]);
    // Guard the complete SOS + compressed scan tail, not just decoded pixels.
    let output_scan = scan + out.len() - data.len();
    if out.get(output_scan..) != Some(&data[scan..]) {
        return Err("Compressed JPEG data thay đổi; không ghi".into());
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn jpeg() -> Vec<u8> {
        vec![
            0xff, 0xd8, 0xff, 0xe2, 0, 6, 1, 2, 3, 4, 0xff, 0xc0, 0, 2, 0xff, 0xda, 0, 2, 9, 8, 7,
            0xff, 0xd9,
        ]
    }
    #[test]
    fn all_orientations_round_trip() {
        for old in 1..=8 {
            let mut x = old;
            for _ in 0..4 {
                x = orientation_after(x, 90).unwrap();
            }
            assert_eq!(old, x);
            assert_eq!(
                orientation_after(orientation_after(old, 90).unwrap(), 270).unwrap(),
                old
            );
        }
    }
    #[test]
    fn preserves_compressed_stream_and_markers() {
        let src = jpeg();
        let mut out = src.clone();
        for _ in 0..4 {
            out = rotated_jpeg(&out, 90).unwrap();
        }
        assert_eq!(&out[out.len() - 9..], &src[src.len() - 9..]);
        let exif = exif::Reader::new()
            .read_from_container(&mut std::io::Cursor::new(&out))
            .unwrap();
        assert_eq!(
            exif.get_field(exif::Tag::Orientation, exif::In::PRIMARY)
                .unwrap()
                .value
                .get_uint(0),
            Some(1)
        );
        assert!(out.windows(8).any(|w| w == [0xff, 0xe2, 0, 6, 1, 2, 3, 4]));
    }
    #[test]
    fn malformed_inputs_fail_without_panics() {
        for n in 0..jpeg().len() {
            assert!(rotated_jpeg(&jpeg()[..n], 90).is_err());
        }
        assert!(rotated_jpeg(&jpeg(), 45).is_err());
    }
}

#[cfg(test)]
mod metadata_tests {
    use super::*;
    #[test]
    fn both_byte_orders_preserve_external_metadata_when_adding_orientation() {
        for le in [true, false] {
            let mut t = vec![0u8; 38];
            t[..2].copy_from_slice(if le { b"II" } else { b"MM" });
            put16(&mut t, 2, 42, le);
            put32(&mut t, 4, 8, le);
            put16(&mut t, 8, 1, le);
            put16(&mut t, 10, 0x8769, le);
            put16(&mut t, 12, 4, le);
            put32(&mut t, 14, 1, le);
            put32(&mut t, 18, 26, le);
            t[26..].copy_from_slice(b"PRIVATE_DATA");
            let mut payload = b"Exif\0\0".to_vec();
            payload.extend(&t);
            let out = rotate_exif(&payload, 90).unwrap();
            let out = &out[6..];
            assert_eq!(&out[8..t.len()], &t[8..]);
            let root = u32_at(out, 4, le).unwrap() as usize;
            assert_eq!(u16_at(out, root, le).unwrap(), 2);
            assert_eq!(u16_at(out, root + 2, le).unwrap(), 0x112);
            assert_eq!(u16_at(out, root + 10, le).unwrap(), 6);
            assert_eq!(u32_at(out, root + 22, le).unwrap(), 26);
            assert_eq!(&out[26..38], b"PRIVATE_DATA");
        }
    }
    #[test]
    fn conflicting_xmp_and_duplicate_exif_are_refused() {
        let base = vec![
            0xff, 0xd8, 0xff, 0xc0, 0, 2, 0xff, 0xda, 0, 2, 9, 0xff, 0xd9,
        ];
        let payload = b"http://ns.adobe.com/xap/1.0/\0tiff:Orientation=1";
        let mut data = base[..2].to_vec();
        data.extend([0xff, 0xe1]);
        data.extend(((payload.len() + 2) as u16).to_be_bytes());
        data.extend(payload);
        data.extend(&base[2..]);
        assert!(rotated_jpeg(&data, 90).is_err());
        let once = rotated_jpeg(&base, 90).unwrap();
        let end = 4 + u16_at(&once, 4, false).unwrap() as usize;
        let mut duplicate = once[..end].to_vec();
        duplicate.extend(&once[2..end]);
        duplicate.extend(&once[end..]);
        assert!(rotated_jpeg(&duplicate, 90).is_err());
    }
}
