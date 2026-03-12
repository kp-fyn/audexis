use crate::utils::handle_import_files;
use crate::AppState;
use std::path::PathBuf;
use tauri::{command, AppHandle, State};

#[command]
pub fn import_paths(app_handle: AppHandle, paths: Vec<String>, state: State<'_, AppState>) {
    let path_bufs: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
    handle_import_files(app_handle, path_bufs, state);
}
