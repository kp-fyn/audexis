use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::tag_manager::utils::{FrameKey, SerializableTagValue};
pub const CONFIG_FILE: &str = ".audexisconfig";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FolderConfig {
    pub default_values: HashMap<FrameKey, SerializableTagValue>,
    pub path_pattern: Option<String>,
}

impl Default for FolderConfig {
    fn default() -> Self {
        Self {
            default_values: HashMap::new(),
            path_pattern: None,
        }
    }
}

pub fn get_folder_config(path: &str) -> std::io::Result<FolderConfig> {
    let config_path = std::path::PathBuf::from(path).join(CONFIG_FILE);
    if !config_path.exists() {
        fs::File::create_new(config_path);
        return Ok(FolderConfig::default());
    }
    println!("Loaded config for {:?}: ", &config_path);
    let content = std::fs::read_to_string(config_path)?;
    let config: FolderConfig = serde_json::from_str(&content)?;
    println!("Loaded config for {}: {:?}", path, config);
    Ok(config)
}
pub fn save_folder_config(path: &str, config: &FolderConfig) -> std::io::Result<()> {
    let config_path = std::path::PathBuf::from(path).join(CONFIG_FILE);
    if !&config_path.exists() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            "Failed to serialize config",
        ));
    }
    let json = serde_json::to_string_pretty(config);

    if json.is_err() {
        println!("Failed to serialize config: {:?}", json.err());
        return Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            "Failed to serialize config",
        ));
    }
    println!(
        "Saving config to {:?}: {}",
        config_path,
        json.as_ref().unwrap()
    );
    fs::write(config_path, json.unwrap())
}
