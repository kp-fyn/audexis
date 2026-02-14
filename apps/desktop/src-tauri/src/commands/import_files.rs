use crate::utils::handle_import_files;
use crate::AppState;
use rfd::FileDialog;
use std::env;
use std::path::PathBuf;
use tauri::{command, AppHandle, State};
#[command]
pub fn import_files(app_handle: AppHandle, file_type: &str, state: State<'_, AppState>) {
    let home_dir: String = match env::home_dir() {
        Some(fp) => String::from(fp.to_string_lossy()),
        None => ".".to_owned(),
    };
    const SUPPORTED_EXTENSIONS: [&str; 15] = [
        "m4a", "mp4", "qt", "m4b", "m4v", "mov", "ogg", "opus", "oga", "spx", "ogv", "mp3", "mp2",
        "mp1", "flac",
    ];

    let selections: Vec<PathBuf> = if file_type == "file" {
        FileDialog::new()
            .set_title("Select files or folders")
            .set_directory(home_dir.clone())
            .add_filter("Audio Files", &SUPPORTED_EXTENSIONS)
            .pick_files()
            .unwrap_or_default()
            .into_iter()
            .map(Into::into)
            .collect()
    } else {
        FileDialog::new()
            .set_title("Select files or folders")
            .set_directory(home_dir)
            .add_filter("Audio Files", &SUPPORTED_EXTENSIONS)
            .pick_folders()
            .unwrap_or_default()
            .into_iter()
            .map(Into::into)
            .collect()
    };
    if selections.is_empty() {
        return;
    }
    handle_import_files(app_handle, selections, state);
}
