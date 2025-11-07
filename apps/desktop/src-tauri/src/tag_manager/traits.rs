use crate::tag_manager::utils::{FrameKey, TagValue};
use std::collections::HashMap;
use std::fmt::{Debug, Display};
use std::path::PathBuf;
use std::{fmt, write};

#[derive(Debug, Clone)]
pub enum Formats {
    Id3v22,
    Id3v23,
    Id3v24,
    Id3v11,
    Id3v10,
    Itunes,
    Unknown,
}
impl Display for Formats {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Formats::Id3v10 => "id3v1.0",
            Formats::Id3v11 => "id3v1.1",
            Formats::Id3v22 => "id3v2.2",
            Formats::Id3v23 => "id3v2.3",
            Formats::Id3v24 => "id3v2.4",
            Formats::Itunes => "Itunes",
            Formats::Unknown => "Unknown",
        };
        write!(f, "{}", s)
    }
}
pub trait TagFamily {
    fn new() -> Self
    where
        Self: Sized;

    fn get_release_class(&self, version: &Formats) -> Option<Box<dyn TagFormat>>;
}

pub trait TagFormat: Debug {
    fn new() -> Self
    where
        Self: Sized;

    fn get_tags(&self, file_path: &PathBuf) -> Result<HashMap<FrameKey, TagValue>, std::io::Error>;
    fn write_tags(
        &self,
        file_path: &PathBuf,
        updated_tags: HashMap<FrameKey, TagValue>,
    ) -> Result<(), ()>;
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result;
}

impl Display for dyn TagFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}
