use crate::tag_manager::traits;
use crate::tag_manager::traits::{Formats, TagFormat};

pub mod utils;
mod v1;
mod v2_2;
mod v2_3;
mod v2_4;

#[derive(Debug, Clone)]
pub struct Id3 {
    v1: v1::V1,
    v2_2: v2_2::V2_2,
    v2_3: v2_3::V2_3,
    v2_4: v2_4::V2_4,
}

impl Id3 {
    pub fn new() -> Self {
        Self {
            v1: v1::V1::new(),
            v2_2: v2_2::V2_2::new(),
            v2_3: v2_3::V2_3::new(),
            v2_4: v2_4::V2_4::new(),
        }
    }
}

impl traits::TagFamily for Id3 {
    fn new() -> Self {
        Self {
            v1: v1::V1::new(),
            v2_2: v2_2::V2_2::new(),
            v2_3: v2_3::V2_3::new(),
            v2_4: v2_4::V2_4::new(),
        }
    }
    fn get_release_class(&self, version: &Formats) -> Option<Box<dyn TagFormat>> {
        match version {
            Formats::Id3v10 | Formats::Id3v11 => Some(Box::new(self.v1.clone())),
            Formats::Id3v22 => Some(Box::new(self.v2_2.clone())),
            Formats::Id3v23 => Some(Box::new(self.v2_3.clone())),
            Formats::Id3v24 => Some(Box::new(self.v2_4.clone())),
            _ => None,
        }
    }
}
