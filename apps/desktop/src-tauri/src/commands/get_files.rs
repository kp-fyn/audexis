use crate::tag_manager::utils::SerializableFile;
use crate::utils::tags::get_tags;
use crate::AppState;
use tauri::{command, State};

#[command]
pub async fn get_files(state: State<'_, AppState>) -> Result<Vec<SerializableFile>, String> {
    let rows: Vec<(String,)> = sqlx::query_as(
        r#"
    SELECT f.path
    FROM files f
    LEFT JOIN tag_text tt
        ON tt.file_id = f.id
       AND tt.key = 'title'
    ORDER BY
        CASE
            WHEN tt.value IS NULL OR tt.value = '' THEN 1
            ELSE 0
        END ASC,
        lower(COALESCE(NULLIF(tt.value, ''), f.file_name)) ASC,
        f.id ASC
    "#,
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| e.to_string())?;

    let paths = rows.into_iter().map(|(path,)| path).collect::<Vec<_>>();
    let files = get_tags(&state.db, paths, false).await?;
    Ok(files.into_iter().map(SerializableFile::from).collect())
}
