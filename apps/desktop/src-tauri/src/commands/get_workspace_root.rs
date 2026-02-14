use crate::{AppState, FileNode};

use std::thread;
use tauri::{command, AppHandle, Emitter, State};

#[command]
pub fn get_workspace_root(app_handle: AppHandle, state: State<'_, AppState>) {
    let db = state.conn.clone();
    thread::spawn(move || {
        let conn = match db.lock() {
            Ok(c) => c,
            Err(poisoned) => poisoned.into_inner(),
        };
        let stmt = conn
            .prepare("SELECT path FROM import_roots WHERE status = 'active' ORDER BY path")
            .map_err(|e| e.to_string());

        if stmt.is_err() {
            println!("Failed to prepare statement: {:?}", stmt.err());
            return;
        }
        let mut stmt = stmt.unwrap();

        let roots = stmt
            .query_map([], |row| {
                let path: String = row.get(0)?;
                Ok(path)
            })
            .map_err(|e| e.to_string());
        if roots.is_err() {
            println!("Failed to query import roots: {:?}", roots.err());
            return;
        }
        let roots = roots.unwrap();
        let roots = roots
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string());
        if roots.is_err() {
            println!("Failed to collect import roots: {:?}", roots.err());
            return;
        }
        let roots = roots.unwrap();

        let mut result = Vec::new();

        for root_path in roots {
            let name = match std::path::Path::new(&root_path).file_name() {
                Some(name) => name.to_string_lossy().to_string(),
                None => root_path.clone(),
            };

            result.push(FileNode {
                path: root_path.clone(),
                name,
                is_directory: true,
            });
        }

        let _ = app_handle.emit("workspace-roots", result);
    });
}
