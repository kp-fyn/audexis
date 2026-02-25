use crate::tag_manager::utils::{File, SerializableFile};
use crate::utils::{get_imported_folders, get_tags, is_in_folder};
use crate::AppState;
use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;

use tauri::{command, AppHandle, State};

#[command]
pub fn request_file(path: String, state: State<'_, AppState>) -> Result<SerializableFile, ()> {
    let file_exists = fs::exists(&path).unwrap_or(false);
    if file_exists == false {
        return Err(());
    }
    let db: std::sync::Arc<std::sync::Mutex<Connection>> = state.conn.clone();

    let conn = db
        .lock()
        .map_err(|e| format!("Failed to lock DB connection: {e}"));
    if conn.is_err() {
        return Err(());
    }
    let mut conn = conn.unwrap();
    let roots = get_imported_folders(&conn);
    let mut is_valid = false;
    for root in roots {
        is_valid = is_in_folder(&PathBuf::from(root), &PathBuf::from(&path));
        if is_valid == true {
            break;
        }
    }
    if is_valid == false {
        return Err(());
    }

    let files = get_tags(&mut conn, vec![path]);
    if files.is_err() {
        return Err(());
    }
    let files = files.unwrap();
    let file = files.get(0);
    if file.is_none() {
        return Err(());
    }
    let file = file.unwrap().clone();
    let serialized = SerializableFile::from(file);
    return Ok(serialized);
}
