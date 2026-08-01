use std::path::PathBuf;

use tauri::command;

use crate::AppState;

#[command]
pub async fn set_library_roots(
    state: tauri::State<'_, AppState>,
    folders: Vec<String>,
) -> Result<(), ()> {
    let db = state.db.clone();
    let pool = db.pool;
    let mut paths: Vec<PathBuf> = folders.into_iter().map(PathBuf::from).collect();

    paths.sort();

    let mut real_folders: Vec<PathBuf> = Vec::new();

    for path in paths {
        if let Some(last_kept) = real_folders.last() {
            if path.starts_with(last_kept) && path != *last_kept {
                continue;
            }
        }
        real_folders.push(path);
    }
    for path in real_folders {
        let status = sqlx::query(
            "INSERT INTO import_roots (path, last_scanned) VALUES (?1, 0)\
         ON CONFLICT(path) DO NOTHING",
        )
        .bind(path.into_os_string().to_string_lossy())
        .execute(&pool)
        .await;
        match status {
            Ok(_) => println!("GOod"),
            Err(err) => println!("{:?}", err),
        };
    }
    Ok(())
}
