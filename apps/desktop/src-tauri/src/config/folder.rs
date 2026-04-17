use std::collections::HashMap;

use crate::tag_manager::utils::{SerializableTagFrame, SerializableTagValue};

struct FolderConfig {
    default_values: HashMap<SerializableTagFrame, SerializableTagValue>,
}

impl Default for FolderConfig {
    fn default() -> Self {
        Self {
            default_values: HashMap::new(),
        }
    }
}

pub const CONFIG_FILE: &str = ".audexisconfig";
