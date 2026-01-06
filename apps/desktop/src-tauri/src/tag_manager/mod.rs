use crate::tag_manager::traits::{Formats, TagFamily};
use std::path::PathBuf;

mod flac;
mod id3;
mod itunes;
mod riff;
pub mod tag_backend;
pub mod traits;
pub mod utils;

mod vorbis_comments;

#[derive(Debug, Clone)]
pub struct TagManager {
    id3: id3::Id3,
    itunes: itunes::Itunes,
    flac: flac::Flac,

    riff: riff::Riff,
}

impl TagManager {
    pub fn new() -> Self {
        Self {
            id3: id3::Id3::new(),
            itunes: itunes::Itunes::new(),
            flac: flac::Flac::new(),

            riff: riff::Riff::new(),
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

            Formats::Riff => self.riff.get_release_class(&Formats::Riff),
            _ => None,
        }
    }
    pub fn detect_tag_format(&self, file_path: &PathBuf) -> Formats {
        use std::fs;

        if let Some(ext) = file_path
            .extension()
            .and_then(|e| e.to_str())
            .map(|s| s.to_ascii_lowercase())
        {
            match ext.as_str() {
                "m4a" | "mp4" | "m4v" => return Formats::Itunes,

                "ogg" | "opus" => return Formats::Vorbis,
                "wav" | "aiff" | "aif" => return Formats::Riff,
                _ => {}
            }
        }

        let buffer = match fs::read(file_path) {
            Ok(b) => b,
            Err(_) => return Formats::Unknown,
        };

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

        if buffer.len() >= 128 {
            let tag_start = buffer.len() - 128;
            let tail = &buffer[tag_start..];
            if &tail[0..3] == b"TAG" {
                let version = if tail[125] == 0 {
                    Formats::Id3v11
                } else {
                    Formats::Id3v10
                };
                return version;
            }
        }
        if buffer.len() >= 4 && &buffer[0..4] == b"fLaC" {
            return Formats::Flac;
        }

        if file_path.extension().and_then(|e| e.to_str()) == Some("mp3") {
            return Formats::Id3v23;
        }

        Formats::Unknown
    }
}
