use sqlx::{Pool, Sqlite};
use tauri::command;

use crate::database::types::DatabaseMediaFile;

use crate::AppState;

#[command]
pub async fn get_files(state: tauri::State<'_, AppState>) -> Result<Vec<DatabaseMediaFile>, ()> {
    let db = state.db.clone();
    let pool: Pool<Sqlite> = db.pool;
    let files = sqlx::query_as!(DatabaseMediaFile, "SELECT * FROM files")
        .fetch_all(&pool)
        .await;

    if files.is_err() {
        return Err(());
    }
    let files = files.unwrap();

    Ok(files)
}
