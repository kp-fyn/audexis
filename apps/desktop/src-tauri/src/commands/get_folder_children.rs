use crate::{AppState, FileNode};
use serde::Serialize;

use std::fs;
use tauri::{command, AppHandle, Emitter, State};

#[command]
pub fn get_folder_children(
    folder_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<FileNode>, String> {
    let db = state.conn.clone();
    // let conn = match db.lock() {
    //     Ok(c) => c,
    //     Err(poisoned) => poisoned.into_inner(),
    // };
    let mut children: Vec<FileNode> = Vec::new();
    let result = fs::read_dir(folder_path);
    if result.is_err() {
        return Err(format!("Failed to read directory: {:?}", result.err()));
    }
    let entries = result.unwrap();
    for entry in entries {
        if entry.is_err() {
            continue;
        }
        let entry = entry.unwrap();
        let path = entry.path();
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let is_directory = metadata.is_dir();
        if !is_directory {
            let is_supported = crate::utils::is_supported_file(&path);
            if !is_supported {
                continue;
            }
        }

        children.push(FileNode {
            path: path.to_string_lossy().to_string(),
            name: entry.file_name().to_string_lossy().to_string(),
            is_directory,
        });
    }

    Ok(children)
}
