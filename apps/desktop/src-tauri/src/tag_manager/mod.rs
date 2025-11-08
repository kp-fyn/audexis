use crate::tag_manager::traits::{Formats, TagFamily};
use std::path::PathBuf;

mod id3;
mod itunes;
pub mod traits;
pub mod utils;

#[derive(Debug, Clone)]
pub struct TagManager {
    id3: id3::Id3,
    itunes: itunes::Itunes,
}

impl TagManager {
    pub fn new() -> Self {
        Self {
            id3: id3::Id3::new(),
            itunes: itunes::Itunes::new(),
        }
    }

    pub fn get_release_class(&self, version: &Formats) -> Option<Box<dyn traits::TagFormat>> {
        match version {
            Formats::Id3v22 => self.id3.get_release_class(&Formats::Id3v22),
            Formats::Id3v23 => self.id3.get_release_class(&Formats::Id3v23),
            Formats::Id3v24 => self.id3.get_release_class(&Formats::Id3v24),
            Formats::Itunes => self.itunes.get_release_class(&Formats::Itunes),

            _ => None,
        }
    }
    pub fn detect_tag_format(&self, file_path: &PathBuf) -> Formats {
        use std::fs;

        if let Some(ext) = file_path.extension().and_then(|e| e.to_str()) {
            if ext == "m4a" || ext == "mp4" {
                return Formats::Itunes;
            }
        }

        let buffer = match fs::read(file_path) {
            Ok(b) => b,
            Err(_) => return Formats::Unknown,
        };

        if buffer.len() >= 128 && &buffer[buffer.len() - 128..buffer.len() - 125] == b"TAG" {
            let version = if buffer[125] == 0 {
                Formats::Id3v10
            } else {
                Formats::Id3v11
            };
            return version;
        }

        if buffer.len() >= 5 && &buffer[0..3] == b"ID3" {
            let version_byte = buffer[3];
            let revision_byte = buffer[4];

            let version = match (version_byte, revision_byte) {
                (2, 0) => Formats::Id3v22,
                (3, 0) => Formats::Id3v23,
                (4, 0) => Formats::Id3v24,
                _ => return Formats::Unknown,
            };

            return version;
        }

        if file_path.extension().and_then(|e| e.to_str()) == Some("mp3") {
            return Formats::Id3v23;
        }

        Formats::Unknown
    }
}
