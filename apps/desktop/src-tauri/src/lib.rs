mod config;
mod file_watcher;
mod tag_manager;
mod workspace;
use tauri_plugin_opener::OpenerExt;

// use std::collections::HashMap;
use std::sync::Mutex;

use base64::{engine::general_purpose, Engine as _};

use rfd::FileDialog;
use std::env;
use std::path::PathBuf;
use std::process::Command;
use tauri::window::Color;
use tauri::{AppHandle, Emitter, State, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use workspace::Workspace;

use crate::file_watcher::FileWatcher;
use crate::tag_manager::utils::{
    Changes, FrameChanges, FrameKey, SerializableFile, SerializableTagValue, TagValue,
};
use std::collections::HashMap;
use tauri::Manager;

use crate::config::user::{
    get_config_path, load_config, save_config, Column, PartialUserConfig, Theme,
};
use crate::tag_manager::tag_backend::{DefaultBackend, TagBackend};
use config::user;

pub struct AppState {
    pub workspace: Mutex<Workspace>,
    pub file_watcher: Mutex<FileWatcher>,
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
    if let Some(show_diff_modal) = patch.show_diff_modal {
        config.show_diff_modal = show_diff_modal;
    }

    save_config(&path, &config).map_err(|e| format!("Save failed: {}", e))?;
    app_handle.emit("user-config-updated", config).unwrap();
    Ok(())
}

#[tauri::command]
fn save_changes(app_handle: AppHandle, changes: Changes, state: State<'_, AppState>) {
    let backend = DefaultBackend::new();
    let _ = backend.write_changes(&changes);
    {
        let mut ws = state.workspace.lock().unwrap();
        for p in &changes.paths {
            ws.refresh_tags(&PathBuf::from(p));
        }
        let serializable_files: Vec<SerializableFile> = ws
            .files
            .clone()
            .into_iter()
            .map(SerializableFile::from)
            .collect();
        let _ = app_handle.emit("workspace-updated", serializable_files);
    }
}

#[tauri::command]
fn save_frame_changes(
    app_handle: AppHandle,
    frame_changes: FrameChanges,
    state: State<'_, AppState>,
) {
    let mut tag_map: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();
    for frame in &frame_changes.frames {
        for val in &frame.values {
            match val {
                SerializableTagValue::Text(t) => {
                    tag_map
                        .entry(frame.key)
                        .or_default()
                        .push(TagValue::Text(t.clone()));
                }
                SerializableTagValue::Picture {
                    mime,
                    data_base64,
                    picture_type,
                    description,
                } => {
                    if let Ok(data) = base64::engine::general_purpose::STANDARD.decode(data_base64)
                    {
                        tag_map
                            .entry(frame.key)
                            .or_default()
                            .push(TagValue::Picture {
                                mime: mime.clone(),
                                data,
                                picture_type: *picture_type,
                                description: description.clone(),
                            });
                    }
                }
                SerializableTagValue::UserText(entry) => {
                    tag_map
                        .entry(frame.key)
                        .or_default()
                        .push(TagValue::UserText(entry.clone()));
                }
                SerializableTagValue::UserUrl(entry) => {
                    tag_map
                        .entry(frame.key)
                        .or_default()
                        .push(TagValue::UserUrl(entry.clone()));
                }
            }
        }
    }

    let backend = DefaultBackend::new();
    let mut write_changes = Changes {
        paths: frame_changes.paths.clone(),
        tags: HashMap::new(),
    };
    for (k, vec_vals) in tag_map.into_iter() {
        let ser_vals: Vec<SerializableTagValue> = vec_vals
            .into_iter()
            .map(|v| match v {
                TagValue::Text(s) => SerializableTagValue::Text(s),
                TagValue::Picture {
                    mime,
                    data,
                    picture_type,
                    description,
                } => SerializableTagValue::Picture {
                    mime,
                    data_base64: base64::engine::general_purpose::STANDARD.encode(&data),
                    picture_type,
                    description,
                },
                TagValue::UserText(ut) => SerializableTagValue::UserText(ut),
                TagValue::UserUrl(uu) => SerializableTagValue::UserUrl(uu),
            })
            .collect();
        write_changes.tags.insert(k, ser_vals);
    }
    let _ = backend.write_changes(&write_changes);
    {
        let mut ws = state.workspace.lock().unwrap();
        for p in &frame_changes.paths {
            ws.refresh_tags(&PathBuf::from(p));
        }
        let serializable_files: Vec<SerializableFile> = ws
            .files
            .clone()
            .into_iter()
            .map(SerializableFile::from)
            .collect();
        let _ = app_handle.emit("workspace-updated", serializable_files);
    }
}

#[derive(serde::Serialize)]
struct FrameReadResult {
    path: String,
    frames: Vec<crate::tag_manager::utils::SerializableTagFrame>,
}

#[tauri::command]
fn get_frames(paths: Vec<String>) -> Vec<FrameReadResult> {
    use crate::tag_manager::tag_backend::DefaultBackend;
    use crate::tag_manager::utils::{map_to_frames, SerializableTagFrame};
    let backend = DefaultBackend::new();
    let mut out: Vec<FrameReadResult> = Vec::new();
    for p in paths {
        let pb = std::path::PathBuf::from(&p);
        if let Ok(file) = backend.read(&pb) {
            let frames = map_to_frames(&file.tags)
                .into_iter()
                .map(|f| SerializableTagFrame {
                    key: f.key,
                    values: f
                        .values
                        .into_iter()
                        .map(|v| match v {
                            TagValue::Text(s) => SerializableTagValue::Text(s),
                            TagValue::Picture {
                                mime,
                                data,
                                picture_type,
                                description,
                            } => SerializableTagValue::Picture {
                                mime,
                                data_base64: base64::engine::general_purpose::STANDARD.encode(data),
                                picture_type,
                                description,
                            },
                            TagValue::UserText(ut) => SerializableTagValue::UserText(ut),
                            TagValue::UserUrl(uu) => SerializableTagValue::UserUrl(uu),
                        })
                        .collect(),
                })
                .collect();
            out.push(FrameReadResult { path: p, frames });
        } else {
            out.push(FrameReadResult {
                path: p,
                frames: Vec::new(),
            });
        }
    }
    out
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
        let img_base64 = general_purpose::STANDARD.encode(&img_data);
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
            picture_type: Some(3),
            description: None,
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
        FrameKey::AcoustidId,
        FrameKey::AcoustidFingerprint,
        FrameKey::AlbumArtistSort,
        FrameKey::AlbumSort,
        FrameKey::Arranger,
        FrameKey::ArtistSort,
        FrameKey::Artists,
        FrameKey::Asin,
        FrameKey::Barcode,
        FrameKey::CatalogNumber,
        FrameKey::Compilation,
        FrameKey::ComposerSort,
        FrameKey::Director,
        FrameKey::DiscNumber,
        FrameKey::DiscSubtitle,
        FrameKey::EncoderSettings,
        FrameKey::Engineer,
        FrameKey::Gapless,
        FrameKey::Grouping,
        FrameKey::InitialKey,
        FrameKey::Isrc,
        FrameKey::License,
        FrameKey::Lyricist,
        FrameKey::Lyrics,
        FrameKey::Media,
        FrameKey::Mixer,
        FrameKey::Mood,
        FrameKey::Movement,
        FrameKey::MovementTotal,
        FrameKey::MovementNumber,
        FrameKey::MusicBrainzArtistId,
        FrameKey::MusicBrainzDiscId,
        FrameKey::MusicBrainzOriginalArtistId,
        FrameKey::MusicBrainzOriginalAlbumId,
        FrameKey::MusicBrainzRecordingId,
        FrameKey::MusicBrainzAlbumArtistId,
        FrameKey::MusicBrainzReleaseGroupId,
        FrameKey::MusicBrainzAlbumId,
        FrameKey::MusicBrainzTrackId,
        FrameKey::MusicBrainzReleaseTrackId,
        FrameKey::MusicBrainzTrmId,
        FrameKey::MusicBrainzWorkId,
        FrameKey::MusicIpFingerprint,
        FrameKey::MusicIpPuid,
        FrameKey::OriginalAlbum,
        FrameKey::OriginalArtist,
        FrameKey::OriginalFilename,
        FrameKey::OriginalDate,
        FrameKey::OriginalYear,
        FrameKey::Performer,
        FrameKey::Podcast,
        FrameKey::PodcastUrl,
        FrameKey::Producer,
        FrameKey::Rating,
        FrameKey::Label,
        FrameKey::ReleaseCountry,
        FrameKey::ReleaseStatus,
        FrameKey::ReleaseType,
        FrameKey::Remixer,
        FrameKey::ReplayGainAlbumGain,
        FrameKey::ReplayGainAlbumPeak,
        FrameKey::ReplayGainAlbumRange,
        FrameKey::ReplayGainReferenceLoudness,
        FrameKey::ReplayGainTrackGain,
        FrameKey::ReplayGainTrackPeak,
        FrameKey::ReplayGainTrackRange,
        FrameKey::Script,
        FrameKey::Show,
        FrameKey::ShowSort,
        FrameKey::ShowMovement,
        FrameKey::Subtitle,
        FrameKey::TotalDiscs,
        FrameKey::TotalTracks,
        FrameKey::TitleSort,
        FrameKey::Website,
        FrameKey::Work,
        FrameKey::Writer,
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
fn open(path: &str) {
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg("-R").arg(path).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("explorer").args(["/select,", path]).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let p = Path::new(path);
        let dir = p.parent().unwrap_or_else(|| Path::new(path));
        let _ = Command::new("xdg-open").arg(dir).spawn();
    }
}

#[tauri::command]
fn open_default(app_handle: AppHandle, path: &str) {
    let _ = app_handle.opener().open_path(path, None::<&str>);
}

#[tauri::command]
fn import_files(app_handle: AppHandle, file_type: &str, state: State<'_, AppState>) {
    let home_dir: String = match env::home_dir() {
        Some(fp) => String::from(fp.to_string_lossy()),
        None => ".".to_owned(),
    };
    let selections: Vec<PathBuf> = if file_type == "file" {
        FileDialog::new()
            .set_title("Select files or folders")
            .set_directory(home_dir.clone())
            .add_filter(
                "Audio Files",
                &[
                    "m4a", "mp4", "mp3", "flac", "ogg", "opus", "wav", "aiff", "aif",
                ],
            )
            .pick_files()
            .unwrap_or_default()
            .into_iter()
            .map(Into::into)
            .collect()
    } else {
        FileDialog::new()
            .set_title("Select files or folders")
            .set_directory(home_dir)
            .add_filter(
                "Audio Files",
                &[
                    "m4a", "mp4", "mp3", "flac", "ogg", "opus", "wav", "aiff", "aif",
                ],
            )
            .pick_folders()
            .unwrap_or_default()
            .into_iter()
            .map(Into::into)
            .collect()
    };
    if selections.is_empty() {
        return;
    }

    {
        let mut ws = state.workspace.lock().unwrap();
        for path in &selections {
            ws.import(path.clone());
        }
    }

    let serializable_files: Vec<SerializableFile> = {
        let ws = state.workspace.lock().unwrap();
        ws.files
            .clone()
            .into_iter()
            .map(SerializableFile::from)
            .collect()
    };
    app_handle
        .emit("workspace-updated", serializable_files)
        .unwrap();

    if let Ok(mut watcher) = state.file_watcher.lock() {
        let _ = watcher.watch_workspace();
    }
}

#[derive(serde::Serialize)]
struct RenameResultItem {
    old: String,
    new: String,
    ok: bool,
    error: Option<String>,
}

#[tauri::command]
fn rename_files(
    app_handle: AppHandle,
    pattern: &str,
    paths: Vec<String>,
    state: State<'_, AppState>,
) -> Vec<RenameResultItem> {
    let results = {
        let mut ws = state.workspace.lock().unwrap();
        ws.rename_by_pattern(paths, pattern)
    };

    let serializable_files: Vec<SerializableFile> = {
        let ws = state.workspace.lock().unwrap();
        ws.files
            .clone()
            .into_iter()
            .map(SerializableFile::from)
            .collect()
    };
    app_handle
        .emit("workspace-updated", serializable_files)
        .unwrap();

    results
        .into_iter()
        .map(|(old, new, res)| match res {
            Ok(()) => RenameResultItem {
                old,
                new,
                ok: true,
                error: None,
            },
            Err(e) => RenameResultItem {
                old,
                new,
                ok: false,
                error: Some(e),
            },
        })
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
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
            app.manage(AppState {
                workspace: Mutex::new(Workspace::new(&app.handle())),
                file_watcher: Mutex::new(FileWatcher::new(&app.handle())),
            });
            if let Ok(mut watcher) = app.state::<AppState>().file_watcher.lock() {
                let _ = watcher.watch_workspace();
            }
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
            .maximized(true)
            .background_color(match user_config.theme {
                Theme::Light => Color(241, 241, 241, 255),
                Theme::Dark => Color(10, 10, 10, 255),
            })
            .visible(false);
            let win_builder = win_builder.maximized(true);
            #[cfg(target_os = "macos")]
            let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);
            let win_builder = win_builder.decorations(false);

            let window = win_builder.build().unwrap();

            window.show().unwrap();

            Ok(())
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
            save_frame_changes,
            get_frames,
            get_all_columns,
            open,
            open_default,
            rename_files,
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
