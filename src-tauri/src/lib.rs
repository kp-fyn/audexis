mod config;
mod tag_manager;
mod workspace;

use std::collections::HashMap;
use std::sync::Mutex;

use rfd::FileDialog;
use std::env;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, State, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use workspace::Workspace;

use crate::tag_manager::utils::{
    Changes, FrameKey, SerializableFile, SerializableTagValue, TagValue,
};
use tauri::Manager;

use crate::config::user::{
    get_config_path, load_config, save_config, Column, PartialUserConfig, Theme,
};
use config::user;

struct AppState {
    workspace: Mutex<Workspace>,
}

#[tauri::command]
fn update_user_config(patch: PartialUserConfig, app_handle: AppHandle) -> Result<(), String> {
    let path = get_config_path(&app_handle);
    let mut config = load_config(&path);

    if let Some(theme) = patch.theme {
        config.theme = theme;
    }
    if let Some(view) = patch.view {
        config.view = view;
    }
    if let Some(albums) = patch.albums {
        config.albums = albums;
    }
    if let Some(columns) = patch.columns {
        config.columns = columns;
    }
    if let Some(density) = patch.density {
        config.density = density;
    }
    if let Some(onboarding) = patch.onboarding {
        config.onboarding = onboarding;
    }

    save_config(&path, &config).map_err(|e| format!("Save failed: {}", e))?;
    app_handle.emit("user-config-updated", config).unwrap();
    Ok(())
}

#[tauri::command]
fn save_changes(app_handle: AppHandle, changes: Changes, state: State<'_, AppState>) {
    println!("Changes to save: {:?}", changes);
    let mut updates: HashMap<FrameKey, TagValue> = HashMap::new();
    for (frame_key, v) in changes.tags.into_iter() {
        match v {
            SerializableTagValue::Text(t) => {
                updates.insert(frame_key, TagValue::Text(t));
            }
            SerializableTagValue::Picture { mime, data_base64 } => {
                if let Ok(data) = base64::decode(&data_base64) {
                    updates.insert(frame_key, TagValue::Picture { mime, data });
                }
            }
        }
    }
    let mut ws = state.workspace.lock().unwrap();
    ws.write_tags(changes.paths, updates);

    let serializable_files: Vec<SerializableFile> = ws
        .files
        .clone()
        .into_iter()
        .map(SerializableFile::from)
        .collect();
    app_handle
        .emit("workspace-updated", serializable_files)
        .unwrap();
}

#[tauri::command]
fn import_image() -> Option<SerializableTagValue> {
    let home_dir: String = match env::home_dir() {
        Some(fp) => String::from(fp.to_string_lossy()),
        None => ".".to_owned(),
    };
    let maybe_file = FileDialog::new()
        .set_title("Select an image")
        .set_directory(home_dir)
        .add_filter("Image", &["png", "jpg", "jpeg"])
        .pick_file();
    if let Some(file) = maybe_file {
        let path_buf: PathBuf = file.into();
        let path_str = path_buf.to_string_lossy().to_string();

        let img = std::fs::read(&path_buf);
        println!("Selected image path: {}", path_str);
        if img.is_err() {
            return None;
        }
        let img_data = img.unwrap();
        let img_base64 = base64::encode(&img_data);
        let mime = if path_str.ends_with(".png") {
            "image/png"
        } else if path_str.ends_with(".jpg") || path_str.ends_with(".jpeg") {
            "image/jpeg"
        } else {
            "application/octet-stream"
        };

        let img_tag = SerializableTagValue::Picture {
            data_base64: img_base64,
            mime: mime.to_string(),
        };
        Some(img_tag)
    } else {
        None
    }
}

#[tauri::command]
fn get_all_columns() -> Vec<Column> {
    let mut columns: Vec<Column> = Vec::new();
    let frame_keys = [
        FrameKey::Title,
        FrameKey::Artist,
        FrameKey::Album,
        FrameKey::Year,
        FrameKey::TrackNumber,
        FrameKey::Genre,
        FrameKey::AlbumArtist,
        FrameKey::ContentGroup,
        FrameKey::Composer,
        FrameKey::EncodedBy,
        FrameKey::UnsyncedLyrics,
        FrameKey::Length,
        FrameKey::Conductor,
        FrameKey::AttachedPicture,
        FrameKey::UserDefinedURL,
        FrameKey::Comments,
        FrameKey::Private,
        FrameKey::RelativeVolumeAdjustment,
        FrameKey::EncryptionMethod,
        FrameKey::GroupIdRegistration,
        FrameKey::GeneralObject,
        FrameKey::CommercialURL,
        FrameKey::CopyrightURL,
        FrameKey::AudioFileURL,
        FrameKey::ArtistURL,
        FrameKey::RadioStationURL,
        FrameKey::PaymentURL,
        FrameKey::BitmapImageURL,
        FrameKey::UserDefinedText,
        FrameKey::SynchronizedLyrics,
        FrameKey::TempoCodes,
        FrameKey::MusicCDIdentifier,
        FrameKey::EventTimingCodes,
        FrameKey::Sequence,
        FrameKey::PlayCount,
        FrameKey::AudioSeekPointIndex,
        FrameKey::MediaType,
        FrameKey::CommercialFrame,
        FrameKey::AudioEncryption,
        FrameKey::SignatureFrame,
        FrameKey::SoftwareEncoder,
        FrameKey::AudioEncodingMethod,
        FrameKey::RecommendedBufferSize,
        FrameKey::BeatsPerMinute,
        FrameKey::Language,
        FrameKey::FileType,
        FrameKey::Time,
        FrameKey::RecordingDate,
        FrameKey::ReleaseDate,
    ];

    for frame_key in frame_keys {
        columns.push(Column {
            label: to_label(&frame_key.to_string()),
            value: to_value(&frame_key.to_string()),
            size: match frame_key {
                FrameKey::Year
                | FrameKey::TrackNumber
                | FrameKey::Length
                | FrameKey::BeatsPerMinute
                | FrameKey::PlayCount => 100,
                FrameKey::UnsyncedLyrics
                | FrameKey::Comments
                | FrameKey::UserDefinedURL
                | FrameKey::CommercialURL
                | FrameKey::CopyrightURL
                | FrameKey::AudioFileURL
                | FrameKey::ArtistURL
                | FrameKey::RadioStationURL
                | FrameKey::PaymentURL
                | FrameKey::BitmapImageURL
                | FrameKey::UserDefinedText
                | FrameKey::SynchronizedLyrics => 300,
                _ => 200,
            },
            kind: match frame_key {
                FrameKey::AttachedPicture => user::ColumnKind::Image,
                _ => user::ColumnKind::Text,
            },
        });
    }
    columns
}
#[tauri::command]
fn get_workspace_files(app_handle: AppHandle, state: State<'_, AppState>) {
    let ws = state.workspace.lock().unwrap();
    let serializable_files: Vec<SerializableFile> = ws
        .files
        .clone()
        .into_iter()
        .map(SerializableFile::from)
        .collect();
    let path = get_config_path(&app_handle);
    let user_config = load_config(&path);
    app_handle
        .emit("workspace-updated", serializable_files)
        .unwrap();
    app_handle.emit("user-config-updated", user_config).unwrap();
}

#[tauri::command]
fn import_files(app_handle: AppHandle, file_type: &str, state: State<'_, AppState>) {
    let mut ws = state.workspace.lock().unwrap();
    let home_dir: String = match env::home_dir() {
        Some(fp) => String::from(fp.to_string_lossy()),
        None => ".".to_owned(),
    };
    if file_type == "file" {
        let maybe_files = FileDialog::new()
            .set_title("Select files or folders")
            .set_directory(home_dir)
            .add_filter("Audio Files", &["m4a", "mp4", "mp3"])
            .pick_files();
        if let Some(files) = maybe_files {
            if files.is_empty() {
                return;
            }
            for file in files {
                ws.import(file)
            }
        }
    } else {
        let maybe_folders = FileDialog::new()
            .set_title("Select files or folders")
            .set_directory(home_dir)
            .add_filter("Audio Files", &["m4a", "mp4", "mp3"])
            .pick_folders();
        if let Some(folders) = maybe_folders {
            if folders.is_empty() {
                return;
            }
            for folder in folders {
                ws.import(folder)
            }
        }
    }

    let serializable_files: Vec<SerializableFile> = ws
        .files
        .clone()
        .into_iter()
        .map(SerializableFile::from)
        .collect();
    app_handle
        .emit("workspace-updated", serializable_files)
        .unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let path = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory")
                .join(user::CONFIG_FILE);
            let user_config = load_config(&path);
            let theme = match user_config.theme {
                Theme::Light => "light",
                Theme::Dark => "dark",
            };
            let onboarding = user_config.onboarding;
            println!("Onboarding status: {}", onboarding);
            print!("Theme: {}", theme);

            let win_builder = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App(
                    format!(
                        "index.html?theme={}&onboarding={}",
                        theme,
                        onboarding.to_string()
                    )
                    .into(),
                ),
            )
            .title("Audexis")
            .min_inner_size(800.0, 600.0)
            .inner_size(800.0, 600.0);

            #[cfg(target_os = "macos")]
            let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);
            let win_builder = win_builder.decorations(false);

            let _window = win_builder.build().unwrap();

            Ok(())
        })
        .manage(AppState {
            workspace: Mutex::new(Workspace::new()),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            import_files,
            get_workspace_files,
            update_user_config,
            import_image,
            save_changes,
            get_all_columns
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
fn to_label(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars().peekable();

    while let Some(c) = chars.next() {
        if c.is_ascii_uppercase()
            && !result.is_empty()
            && chars
                .peek()
                .map_or(true, |&next_c| next_c.is_ascii_lowercase())
        {
            result.push(' ');
        }
        result.push(c);
    }
    result
}
fn to_value(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        Some(first_char) => first_char.to_lowercase().chain(chars).collect(),
        None => String::new(),
    }
}
