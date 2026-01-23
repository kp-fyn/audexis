use crate::tag_manager::tag_backend::BackendError;
use crate::tag_manager::utils::SerializableFile;
use crate::AppState;
use std::path::PathBuf;
use tauri::{command, AppHandle, Emitter, State};

#[command]
pub fn import_paths(app_handle: AppHandle, paths: Vec<String>, state: State<'_, AppState>) {
    let mut ws = state.workspace.lock().unwrap();
    let mut errs: Vec<BackendError> = vec![];

    for path in paths {
        let r = ws.import(PathBuf::from(path));
        if let Err(e) = r {
            println!("error importing file: {:?}", e);
            errs.push(e);
        }
    }
    println!("done");
    let serializable_files: Vec<SerializableFile> = {
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
