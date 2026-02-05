use crate::AppState;
use serde::Serialize;

use std::thread;
use tauri::{command, AppHandle, Emitter, State};

#[derive(Debug, Clone, Serialize)]
pub struct FileNode {
    pub path: String,
    pub name: String,
    pub is_directory: bool,
    pub has_children: bool,
}
#[command]
pub fn get_workspace_root(app_handle: AppHandle, state: State<'_, AppState>) {
    let db = state.conn.clone();
    thread::spawn(move || {
        let conn = match db.lock() {
            Ok(c) => c,
            Err(poisoned) => poisoned.into_inner(),
        };
        let mut stmt = conn
            .prepare("SELECT path FROM import_roots WHERE status = 'active' ORDER BY path")
            .map_err(|e| e.to_string());

        if stmt.is_err() {
            println!("Failed to prepare statement: {:?}", stmt.err());
            return;
        }
        let mut stmt = stmt.unwrap();

        let fake_roots = stmt
            .query_map([], |row| {
                let path: String = row.get(0)?;
                Ok(path)
            })
            .map_err(|e| e.to_string());
        if fake_roots.is_err() {
            println!("Failed to query import roots: {:?}", fake_roots.err());
            return;
        }
        let fake_roots = fake_roots.unwrap();
        let roots = fake_roots
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string());
        if roots.is_err() {
            println!("Failed to collect import roots: {:?}", roots.err());
            return;
        }
        let roots = roots.unwrap();

        let mut result = Vec::new();

        for root_path in roots {
            let total_files: usize = conn
                .query_row(
                    "SELECT COUNT(*) FROM files WHERE path LIKE ?1 || '%'",
                    [&root_path],
                    |row| {
                        let count: i64 = row.get(0)?;
                        Ok(count as usize)
                    },
                )
                .unwrap_or(0);

            let has_children: bool = conn
                .query_row(
                    "SELECT COUNT(*) FROM files WHERE path LIKE ?1 || '/%/%'",
                    [&root_path],
                    |row| {
                        let count: i64 = row.get(0)?;
                        Ok(count > 0)
                    },
                )
                .unwrap_or(false);

            let name = root_path
                .split('/')
                .last()
                .unwrap_or(&root_path)
                .to_string();

            result.push(FileNode {
                path: root_path.clone(),
                name,
                is_directory: true,
                has_children,
            });
        }

        let _ = app_handle.emit("workspace-roots", result);
    });
}
