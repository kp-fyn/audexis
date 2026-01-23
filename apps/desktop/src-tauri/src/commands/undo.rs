use crate::tag_manager::utils::SerializableFile;
use crate::AppState;
use tauri::{command, AppHandle, Emitter, State};
#[command]
pub fn undo(state: State<'_, AppState>, app_handle: AppHandle) {
    let mut history = state.history.lock().unwrap();
    history.undo(&state);
    {
        let mut ws = state.workspace.lock().unwrap();
        ws.refresh_all_tags();
        let serializable_files: Vec<SerializableFile> = ws
            .files
            .clone()
            .into_iter()
            .map(SerializableFile::from)
            .collect();
        let _ = app_handle.emit("workspace-updated", serializable_files);
    }
}
