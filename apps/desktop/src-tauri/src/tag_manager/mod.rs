use crate::tag_manager::traits::{Formats, TagFamily};
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::PathBuf;
mod flac;
mod id3;
mod itunes;
mod ogg;
pub mod tag_backend;
pub mod traits;
pub mod utils;

mod vorbis_comments;

#[derive(Debug, Clone)]
pub struct TagManager {
    id3: id3::Id3,
    itunes: itunes::Itunes,
    flac: flac::Flac,
    ogg: ogg::Ogg,
}

impl TagManager {
    pub fn new() -> Self {
        Self {
            id3: id3::Id3::new(),
            itunes: itunes::Itunes::new(),
            flac: flac::Flac::new(),
            ogg: ogg::Ogg::new(),
        }
    }

    pub fn get_release_class(&self, version: &Formats) -> Option<Box<dyn traits::TagFormat>> {
        match version {
            Formats::Id3v10 | Formats::Id3v11 => self.id3.get_release_class(version),
            Formats::Id3v22 => self.id3.get_release_class(&Formats::Id3v22),
            Formats::Id3v23 => self.id3.get_release_class(&Formats::Id3v23),
            Formats::Id3v24 => self.id3.get_release_class(&Formats::Id3v24),
            Formats::Itunes => self.itunes.get_release_class(&Formats::Itunes),
            Formats::Flac => self.flac.get_release_class(&Formats::Flac),
            Formats::Ogg => self.ogg.get_release_class(&Formats::Ogg),

            _ => None,
        }
    }
    pub fn detect_tag_format(&self, file_path: &PathBuf) -> Formats {
        let mut f = match File::open(file_path) {
            Ok(f) => f,
            Err(_) => return Formats::Unknown,
        };

        const PREFIX_LEN: usize = 4096;
        let mut header = vec![0u8; PREFIX_LEN];
        let header_len = match f.read(&mut header) {
            Ok(n) => n,
            Err(_) => return Formats::Unknown,
        };
        header.truncate(header_len);

        let header4 = if header.len() >= 4 {
            Some(&header[0..4])
        } else {
            None
        };

        if header4 == Some(b"fLaC") {
            return Formats::Flac;
        }

        if header4 == Some(b"RIFF") {
            return Formats::Riff;
        }

        if header4 == Some(b"OggS") {
            return Formats::Ogg;
        }

        let is_itunes_mp4 = {
            let mut found = false;
            let mut i = 0usize;
            while i + 8 <= header.len() {
                let size =
                    u32::from_be_bytes([header[i], header[i + 1], header[i + 2], header[i + 3]])
                        as usize;
                let typ = &header[i + 4..i + 8];
                if typ == b"ftyp" {
                    if size >= 16 && i + 16 <= header.len() {
                        let major = &header[i + 8..i + 12];
                        let compat_start = i + 16;
                        let compat_end = (i + size).min(header.len());
                        let compat = if compat_start <= compat_end {
                            &header[compat_start..compat_end]
                        } else {
                            &[]
                        };

                        let is_known_brand = |b: &[u8]| {
                            matches!(
                                b,
                                b"M4A "
                                    | b"M4B "
                                    | b"M4V "
                                    | b"mp41"
                                    | b"mp42"
                                    | b"isom"
                                    | b"iso2"
                                    | b"qt  "
                            )
                        };

                        if is_known_brand(major) {
                            found = true;
                            break;
                        }

                        let mut j = 0usize;
                        while j + 4 <= compat.len() {
                            if is_known_brand(&compat[j..j + 4]) {
                                found = true;
                                break;
                            }
                            j += 4;
                        }
                    }
                    break;
                }

                if size >= 8 {
                    i = i.saturating_add(size);
                } else {
                    i += 1;
                }
            }
            found
        };

        if is_itunes_mp4 {
            return Formats::Itunes;
        }

        if header.len() >= 5 && &header[0..3] == b"ID3" {
            let version_byte = header[3];
            let revision_byte = header[4];

            return match (version_byte, revision_byte) {
                (2, 0) => Formats::Id3v22,
                (3, 0) => Formats::Id3v23,
                (4, 0) => Formats::Id3v24,
                _ => Formats::Unknown,
            };
        }

        if let Ok(meta) = f.metadata() {
            let len = meta.len();
            if len >= 128 {
                if f.seek(SeekFrom::End(-128)).is_ok() {
                    let mut tail = [0u8; 128];
                    if f.read_exact(&mut tail).is_ok() {
                        if &tail[0..3] == b"TAG" {
                            return if tail[125] == 0 {
                                Formats::Id3v11
                            } else {
                                Formats::Id3v10
                            };
                        }
                    }
                }
            }
        }
        let file_extenssion = file_path.extension().and_then(|e| e.to_str());

        if file_extenssion == Some("mp3")
            || file_extenssion == Some("mp2")
            || file_extenssion == Some("mp1")
        {
            return Formats::Id3v23;
        }

        Formats::Unknown
    }
}
