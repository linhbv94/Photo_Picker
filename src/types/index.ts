export interface ExifMetadata {
  date_taken: string | null;
  sub_sec_time: string | null;
  camera_make: string | null;
  camera_model: string | null;
  lens_model: string | null;
  focal_length: string | null;
  aperture_f_number: number | null;
  exposure_time: string | null;
  iso_rating: number | null;
  pixel_width: number | null;
  pixel_height: number | null;
  orientation: number;
  software: string | null;
  color_space: string | null;
  white_balance: string | null;
  exposure_mode: string | null;
  has_gps: boolean;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  gps_altitude?: number | null;
}

export interface FileItem {
  id: string;
  path: string;
  filename: string;
  extension: string;
  size_bytes: number;
  modified_timestamp: number;
  created_timestamp: number;
  thumbnail_url?: string;
  exif: ExifMetadata | null;
}

export interface SubfolderItem {
  id: string;
  name: string;
  parent_path: string;
  direct_children_count: number;
  file_count?: number;
}

export interface RenameDiffItem {
  original_path: string;
  original_filename: string;
  new_filename: string;
  new_path: string;
  has_conflict: boolean;
  conflict_resolution?: string;
}

export type ViewMode = 'grid' | 'detail';
export type FilterMode = 'all' | 'camera' | 'screenshot';

export type SortField =
  | 'filename'
  | 'date_taken'
  | 'camera_make'
  | 'camera_model'
  | 'lens_model'
  | 'aperture'
  | 'shutter'
  | 'iso'
  | 'size';

export type SortOrder = 'asc' | 'desc';
