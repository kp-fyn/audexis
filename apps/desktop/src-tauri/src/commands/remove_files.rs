use crate::tag_manager::utils::SerializableFile;
use crate::AppState;
use std::path::PathBuf;
use tauri::{command, AppHandle, Emitter, State};
#[command]
pub fn remove_files(app_handle: AppHandle, paths: Vec<String>, state: State<'_, AppState>) {
    {
        let mut ws = state.workspace.lock().unwrap();
        for p in &paths {
            ws.remove_file(&PathBuf::from(p));
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
}
