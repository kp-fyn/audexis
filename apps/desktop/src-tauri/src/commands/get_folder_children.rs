use crate::tag_manager::utils::SerializableFile;
use crate::utils::get_tags;
use crate::{AppState, FileNode};

use std::fs;
use tauri::{async_runtime, command, AppHandle, Emitter, State};

#[command]
pub fn get_folder_children(
    folder_path: String,
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<Vec<FileNode>, String> {
    let db = state.db.clone();
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
    let audio_files = children
        .iter()
        .filter(|node| !node.is_directory)
        .map(|node| node.path.clone())
        .collect::<Vec<String>>();

    async_runtime::spawn(async move {
        match get_tags(&db, audio_files).await {
            Ok(files) => {
                let serializable_files: Vec<SerializableFile> =
                    files.into_iter().map(SerializableFile::from).collect();

                let _ = app_handle.emit("workspace-updated", serializable_files);
            }
            Err(e) => {
                println!("Error getting tags: {e}");
            }
        }
    });
    Ok(children)
}
