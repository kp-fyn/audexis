use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AttachedPicture {
    pub buffer: String,
    pub mime: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Album {
    pub id: String,
    pub album: String,
    pub copyright: Option<String>,
    pub year: Option<String>,
    pub genre: Option<String>,
    pub album_artist: Option<String>,
    pub folder: Option<String>,
    pub file_format_path: Option<String>,
    pub file_format_path_enabled: bool,
    pub attached_picture: Option<AttachedPicture>,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ColumnKind {
    Image,
    Text,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Column {
    pub value: String,
    pub label: String,
    pub kind: ColumnKind,
    pub size: u32,
}

impl Default for Column {
    fn default() -> Self {
        Self {
            value: "".into(),
            label: "".into(),
            size: 200,
            kind: ColumnKind::Text,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Theme {
    Light,
    Dark,
}

impl Default for Theme {
    fn default() -> Self {
        Theme::Light
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ViewMode {
    Simple,
    Folder,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Density {
    Default,
    Compact,
    Comfort,
}

impl Default for Density {
    fn default() -> Self {
        Density::Default
    }
}

impl Default for ViewMode {
    fn default() -> Self {
        ViewMode::Folder
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserConfig {
    pub theme: Theme,
    pub view: ViewMode,
    pub onboarding: bool,
    pub albums: Vec<Album>,
    pub columns: Vec<Column>,
    pub density: Density,
}

impl Default for UserConfig {
    fn default() -> Self {
        Self {
            theme: Theme::Light,
            density: Density::Default,
            view: ViewMode::Folder,
            onboarding: true,
            albums: vec![],
            columns: vec![
                Column {
                    value: "attachedPicture".into(),
                    label: "Cover".into(),
                    size: 50,
                    kind: ColumnKind::Image,
                    ..Default::default()
                },
                Column {
                    value: "path".into(),
                    label: "Path".into(),
                    ..Default::default()
                },
                Column {
                    value: "release".into(),
                    label: "Tag Manager".into(),
                    ..Default::default()
                },
                Column {
                    value: "title".into(),
                    label: "Title".into(),
                    ..Default::default()
                },
                Column {
                    value: "artist".into(),
                    label: "Artist".into(),
                    ..Default::default()
                },
                Column {
                    value: "album".into(),
                    label: "Album".into(),
                    ..Default::default()
                },
                Column {
                    value: "year".into(),
                    label: "Year".into(),
                    ..Default::default()
                },
                Column {
                    value: "trackNumber".into(),
                    label: "Track Number".into(),
                    ..Default::default()
                },
                Column {
                    value: "genre".into(),
                    label: "Genre".into(),
                    ..Default::default()
                },
                Column {
                    value: "albumArtist".into(),
                    label: "Album Artist".into(),
                    ..Default::default()
                },
                Column {
                    value: "composer".into(),
                    label: "Composer".into(),
                    ..Default::default()
                },
                Column {
                    value: "encodedBy".into(),
                    label: "Encoded By".into(),
                    ..Default::default()
                },
                Column {
                    value: "conductor".into(),
                    label: "Conductor".into(),
                    ..Default::default()
                },
            ],
        }
    }
}
#[derive(Debug, Deserialize)]
pub struct PartialUserConfig {
    pub theme: Option<Theme>,
    pub view: Option<ViewMode>,
    pub onboarding: Option<bool>,
    pub albums: Option<Vec<Album>>,
    pub columns: Option<Vec<Column>>,
    pub density: Option<Density>,
}
pub const CONFIG_FILE: &str = "user_config.json";

pub fn get_config_path(app_handle: &AppHandle) -> PathBuf {
    let config_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app config directory");

    if let Err(e) = fs::create_dir_all(&config_dir) {
        eprintln!("Failed to create config directory: {}", e);
    }

    let config_path = config_dir.join(CONFIG_FILE);

    if !config_path.exists() {
        if let Err(e) = fs::write(&config_path, "") {
            eprintln!("Failed to create config file: {}", e);
        }
    }
    println!("Config path: {:?}", config_path);
    config_path
}

pub fn load_config(path: &PathBuf) -> UserConfig {
    if let Ok(contents) = fs::read_to_string(&path) {
        match serde_json::from_str(&contents) {
            Ok(cfg) => cfg,
            Err(_) => {
                let default = UserConfig::default();
                let _ = save_config(path, &default);
                default
            }
        }
    } else {
        let default = UserConfig::default();
        let _ = save_config(path, &default);
        default
    }
}

pub fn save_config(path: &PathBuf, config: &UserConfig) -> std::io::Result<()> {
    let json = serde_json::to_string_pretty(config)?;
    fs::write(path, json)
}
