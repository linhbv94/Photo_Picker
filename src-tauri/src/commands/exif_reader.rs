use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExifMetadata {
    pub date_taken: Option<String>,
    pub sub_sec_time: Option<String>,
    pub camera_make: Option<String>,
    pub camera_model: Option<String>,
    pub lens_model: Option<String>,
    pub focal_length: Option<String>,
    pub aperture_f_number: Option<f32>,
    pub exposure_time: Option<String>,
    pub iso_rating: Option<u32>,
    pub pixel_width: Option<u32>,
    pub pixel_height: Option<u32>,
    pub orientation: u32,
    pub software: Option<String>,
    pub color_space: Option<String>,
    pub white_balance: Option<String>,
    pub exposure_mode: Option<String>,
    pub has_gps: bool,
    pub gps_latitude: Option<f64>,
    pub gps_longitude: Option<f64>,
    pub gps_altitude: Option<f64>,
}

pub fn read_exif_fast<P: AsRef<Path>>(path: P) -> Option<ExifMetadata> {
    let file = File::open(path).ok()?;
    let mut buf_reader = BufReader::new(file);
    let exifreader = exif::Reader::new();
    let exif = exifreader.read_from_container(&mut buf_reader).ok()?;

    let get_field_str = |tag: exif::Tag| -> Option<String> {
        exif.get_field(tag, exif::In::PRIMARY).map(|f| f.display_value().to_string().trim_matches('"').to_string())
    };

    let date_taken = get_field_str(exif::Tag::DateTimeOriginal)
        .or_else(|| get_field_str(exif::Tag::DateTimeDigitized))
        .or_else(|| get_field_str(exif::Tag::DateTime));

    // Normalize date format from "YYYY:MM:DD HH:MM:SS" to "YYYY-MM-DD HH:MM:SS"
    let normalized_date = date_taken.map(|d| {
        if d.len() >= 10 && &d[4..5] == ":" && &d[7..8] == ":" {
            format!("{}-{}-{}", &d[0..4], &d[5..7], &d[8..])
        } else {
            d
        }
    });

    let sub_sec_time = get_field_str(exif::Tag::SubSecTimeOriginal)
        .or_else(|| get_field_str(exif::Tag::SubSecTime));

    let camera_make = get_field_str(exif::Tag::Make);
    let camera_model = get_field_str(exif::Tag::Model);
    let lens_model = get_field_str(exif::Tag::LensModel);
    let focal_length = get_field_str(exif::Tag::FocalLength);

    let aperture_f_number = exif.get_field(exif::Tag::FNumber, exif::In::PRIMARY).and_then(|f| {
        match &f.value {
            exif::Value::Rational(v) if !v.is_empty() => Some(v[0].to_f64() as f32),
            _ => None,
        }
    });

    let exposure_time = get_field_str(exif::Tag::ExposureTime);

    let iso_rating = exif.get_field(exif::Tag::PhotographicSensitivity, exif::In::PRIMARY).and_then(|f| {
        match &f.value {
            exif::Value::Short(v) if !v.is_empty() => Some(v[0] as u32),
            exif::Value::Long(v) if !v.is_empty() => Some(v[0]),
            _ => None,
        }
    });

    let pixel_width = exif.get_field(exif::Tag::PixelXDimension, exif::In::PRIMARY).and_then(|f| {
        match &f.value {
            exif::Value::Short(v) if !v.is_empty() => Some(v[0] as u32),
            exif::Value::Long(v) if !v.is_empty() => Some(v[0]),
            _ => None,
        }
    });

    let pixel_height = exif.get_field(exif::Tag::PixelYDimension, exif::In::PRIMARY).and_then(|f| {
        match &f.value {
            exif::Value::Short(v) if !v.is_empty() => Some(v[0] as u32),
            exif::Value::Long(v) if !v.is_empty() => Some(v[0]),
            _ => None,
        }
    });

    let orientation = exif.get_field(exif::Tag::Orientation, exif::In::PRIMARY).and_then(|f| {
        match &f.value {
            exif::Value::Short(v) if !v.is_empty() => Some(v[0] as u32),
            _ => None,
        }
    }).unwrap_or(1);

    let software = get_field_str(exif::Tag::Software);
    let color_space = get_field_str(exif::Tag::ColorSpace);
    let white_balance = get_field_str(exif::Tag::WhiteBalance);
    let exposure_mode = get_field_str(exif::Tag::ExposureMode);

    // Parse GPS
    let mut gps_lat: Option<f64> = None;
    let mut gps_lon: Option<f64> = None;
    let mut gps_alt: Option<f64> = None;

    if let (Some(lat_field), Some(ref_lat)) = (
        exif.get_field(exif::Tag::GPSLatitude, exif::In::PRIMARY),
        exif.get_field(exif::Tag::GPSLatitudeRef, exif::In::PRIMARY),
    ) {
        if let exif::Value::Rational(coords) = &lat_field.value {
            if coords.len() >= 3 {
                let deg = coords[0].to_f64();
                let min = coords[1].to_f64();
                let sec = coords[2].to_f64();
                let mut lat = deg + (min / 60.0) + (sec / 3600.0);
                if ref_lat.display_value().to_string().contains('S') {
                    lat = -lat;
                }
                gps_lat = Some(lat);
            }
        }
    }

    if let (Some(lon_field), Some(ref_lon)) = (
        exif.get_field(exif::Tag::GPSLongitude, exif::In::PRIMARY),
        exif.get_field(exif::Tag::GPSLongitudeRef, exif::In::PRIMARY),
    ) {
        if let exif::Value::Rational(coords) = &lon_field.value {
            if coords.len() >= 3 {
                let deg = coords[0].to_f64();
                let min = coords[1].to_f64();
                let sec = coords[2].to_f64();
                let mut lon = deg + (min / 60.0) + (sec / 3600.0);
                if ref_lon.display_value().to_string().contains('W') {
                    lon = -lon;
                }
                gps_lon = Some(lon);
            }
        }
    }

    if let Some(alt_field) = exif.get_field(exif::Tag::GPSAltitude, exif::In::PRIMARY) {
        if let exif::Value::Rational(v) = &alt_field.value {
            if !v.is_empty() {
                gps_alt = Some(v[0].to_f64());
            }
        }
    }

    let has_gps = gps_lat.is_some() && gps_lon.is_some();

    Some(ExifMetadata {
        date_taken: normalized_date,
        sub_sec_time,
        camera_make,
        camera_model,
        lens_model,
        focal_length,
        aperture_f_number,
        exposure_time,
        iso_rating,
        pixel_width,
        pixel_height,
        orientation,
        software,
        color_space,
        white_balance,
        exposure_mode,
        has_gps,
        gps_latitude: gps_lat,
        gps_longitude: gps_lon,
        gps_altitude: gps_alt,
    })
}
