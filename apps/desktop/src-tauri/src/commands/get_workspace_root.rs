use crate::{AppState, FileNode};

use tauri::{command, AppHandle, Emitter, State};

#[command]
pub async fn get_workspace_root(
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), ()> {
    let roots: Vec<String> =
        sqlx::query_scalar("SELECT path FROM import_roots WHERE status = 'active' ORDER BY path")
            .fetch_all(&state.db.pool)
            .await
            .unwrap_or_default();

    let mut result = Vec::new();
    for root_path in roots {
        let name = match std::path::Path::new(&root_path).file_name() {
            Some(name) => name.to_string_lossy().to_string(),
            None => root_path.clone(),
        };

        result.push(FileNode {
            path: root_path,
            name,
            is_directory: true,
        });
    }

    let _ = app_handle.emit("workspace-roots", result);

    Ok(())
}
