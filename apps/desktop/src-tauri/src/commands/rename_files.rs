use crate::tag_manager::utils::SerializableFile;
use crate::utils::RenameResultItem;
use crate::AppState;
use tauri::{command, AppHandle, Emitter, State};
#[command]
pub fn rename_files(
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
