use super::traits::{Formats, TagFamily, TagFormat};
use super::utils::{FrameKey, TagValue};
use std::collections::HashMap;
use std::fmt::Debug;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct Vorbis;

impl TagFamily for Vorbis {
    fn new() -> Self {
        Self
    }
    fn get_release_class(&self, version: &Formats) -> Option<Box<dyn TagFormat>> {
        match version {
            Formats::Vorbis => None, // Placeholder
            _ => None,
        }
    }
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
struct VorbisFormat;

impl TagFormat for VorbisFormat {
    fn new() -> Self {
        Self
    }
    fn get_tags(
        &self,
        _file_path: &PathBuf,
    ) -> Result<HashMap<FrameKey, Vec<TagValue>>, std::io::Error> {
        Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            "Vorbis tag reading not implemented",
        ))
    }
    fn write_tags(
        &self,
        _file_path: &PathBuf,
        _updated_tags: HashMap<FrameKey, Vec<TagValue>>,
    ) -> Result<(), ()> {
        Err(())
    }
}
