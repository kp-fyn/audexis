use crate::tag_manager::utils::{CleanupRule, SerializableFile};
use crate::utils::RenameResultItem;
use crate::AppState;
use tauri::{command, AppHandle, Emitter, State};

#[command]
pub fn clean_up_file_names(
    app_handle: AppHandle,
    options: Vec<CleanupRule>,
    paths: Vec<String>,
    state: State<'_, AppState>,
) -> Vec<RenameResultItem> {
    let results = {
        let mut ws = state.workspace.lock().unwrap();
        ws.clean_up_file_names(paths, options)
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
