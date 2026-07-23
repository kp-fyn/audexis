use crate::database::Database;
use crate::tag_manager::tag_backend::{DefaultBackend, TagBackend};
use crate::tag_manager::utils::{File, FrameKey, TagValue, UserTextEntry, UserUrlEntry};
use crate::utils::indexing::{insert_pending_files, unix_to_systemtime};
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::fs::metadata;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Get tags from database if exists.
/// If it doesnt try to insert
/// If fails skip
pub async fn get_tags(
    db: &Database,
    file_paths: Vec<String>,
    force: bool,
) -> std::result::Result<Vec<File>, String> {
    let tag_backend = DefaultBackend::new();
    let mut files: Vec<File> = vec![];
    for file_path in file_paths {
        let file_exists_in_db = sqlx::query_scalar::<_, i64>("SELECT 1 FROM files WHERE path = ?1")
            .bind(&file_path)
            .fetch_optional(&db.pool)
            .await
            .map_err(|e| e.to_string())?
            .is_some();

        if !file_exists_in_db {
            let real_path = PathBuf::from(&file_path);
            if real_path.exists() == false {
                continue;
            }

            if let Err(e) = insert_pending_files(&db.pool, vec![real_path]).await {
                println!("Err inserting: {e}");
                continue;
            }
        }

        let mut is_indexed = sqlx::query_scalar::<_, i64>(
            "SELECT 1 FROM files WHERE path = ?1 AND metadata_status = 'indexed'",
        )
        .bind(file_path.as_str())
        .fetch_optional(&db.pool)
        .await
        .map_err(|e| e.to_string())?
        .is_some();

        if force == true {
            is_indexed = false
        }

        let db_modified: Option<SystemTime> =
            sqlx::query_scalar::<_, i64>("SELECT last_modified FROM files WHERE path = ?1")
                .bind(file_path.as_str())
                .fetch_optional(&db.pool)
                .await
                .map_err(|e| e.to_string())?
                .map(unix_to_systemtime);

        let disk_modified = metadata(&file_path).ok().and_then(|m| m.modified().ok());
        let needs_update = if let (Some(db_mod), Some(disk_mod)) = (db_modified, disk_modified) {
            let db_mod_unix = db_mod
                .duration_since(UNIX_EPOCH)
                .unwrap_or(Duration::from_secs(0))
                .as_secs();
            let disk_mod_unix = disk_mod
                .duration_since(UNIX_EPOCH)
                .unwrap_or(Duration::from_secs(1))
                .as_secs();
            db_mod_unix < disk_mod_unix
        } else {
            true
        };

        if !is_indexed || needs_update || !file_exists_in_db {
            let tags = match update_metadata_in_db(&db.pool, &file_path, &tag_backend).await {
                Ok(t) => t,
                Err(e) => {
                    println!("Error updating metadata for file {}: {e}", file_path);
                    continue;
                }
            };
            let tag_format = tag_backend.resolve_format(&PathBuf::from(&file_path));
            let tag_formats =
                tag_backend.detect_all_formats(&PathBuf::from(&file_path), &tag_format);
            let file_id: Option<i64> =
                sqlx::query_scalar::<_, i64>("SELECT id FROM files WHERE path = ?1")
                    .bind(file_path.as_str())
                    .fetch_optional(&db.pool)
                    .await
                    .map_err(|e| e.to_string())?;
            if file_id.is_none() {
                println!(
                    "Error retrieving file ID for file {} after update",
                    file_path
                );
                continue;
            }
            let file_id = file_id.unwrap();

            let file = File {
                path: PathBuf::from(&file_path),
                tags,
                freeforms: Vec::new(),
                tag_format,
                tag_formats,
                id: file_id,
            };
            files.push(file);
            println!("Updated tags for file: {}", file_path);
        } else {
            println!("File already indexed: {}", file_path);

            let tags = match detected_tags_in_db(&db.pool, &file_path).await {
                Ok(t) => t,
                Err(e) => {
                    println!("Error retrieving metadata for file {}: {e}", file_path);
                    continue;
                }
            };
            let tag_format = tag_backend.resolve_format(&PathBuf::from(&file_path));
            let tag_formats =
                tag_backend.detect_all_formats(&PathBuf::from(&file_path), &tag_format);

            let file_id: Option<i64> =
                sqlx::query_scalar::<_, i64>("SELECT id FROM files WHERE path = ?1")
                    .bind(file_path.as_str())
                    .fetch_optional(&db.pool)
                    .await
                    .map_err(|e| e.to_string())?;
            if file_id.is_none() {
                println!(
                    "Error retrieving file ID for file {} after update",
                    file_path
                );
                continue;
            }
            let file_id = file_id.unwrap();

            let file = File {
                path: PathBuf::from(&file_path),
                tags,
                freeforms: Vec::new(),
                tag_format,
                tag_formats,
                id: file_id,
            };
            files.push(file);
        }
    }
    Ok(files)
}

/// Update metadata in database
async fn update_metadata_in_db(
    pool: &SqlitePool,
    file_path: &str,
    tag_backend: &DefaultBackend,
) -> std::result::Result<HashMap<FrameKey, Vec<TagValue>>, String> {
    let f = tag_backend
        .read(&PathBuf::from(file_path))
        .map_err(|e| format!("{e:?}"))?;

    let file_id: i64 = sqlx::query_scalar("SELECT id FROM files WHERE path = ?1")
        .bind(file_path)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Missing file row for path: {}", file_path))?;

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM tag_text WHERE file_id = ?1")
        .bind(file_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM tag_pictures WHERE file_id = ?1")
        .bind(file_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM tag_user_text WHERE file_id = ?1")
        .bind(file_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM tag_user_url WHERE file_id = ?1")
        .bind(file_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM tag_comment WHERE file_id = ?1")
        .bind(file_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    let tags = f.tags;
    for (frame_key, tag_values) in &tags {
        for tag_value in tag_values {
            match tag_value {
                TagValue::Text(text) => {
                    if text.is_empty() {
                        continue;
                    }
                    sqlx::query("INSERT INTO tag_text (file_id, key, value) VALUES (?1, ?2, ?3)")
                        .bind(file_id)
                        .bind(frame_key.to_string())
                        .bind(text)
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| e.to_string())?;
                }
                TagValue::Picture {
                    mime,
                    data,
                    picture_type,
                    description,
                } => {
                    sqlx::query(
                        "INSERT INTO tag_pictures (file_id, key, mime_type, data, picture_type, description) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    )
                    .bind(file_id)
                    .bind(frame_key.to_string())
                    .bind(mime)
                    .bind(data)
                    .bind(picture_type.unwrap_or(3) as i64)
                    .bind(description.clone().unwrap_or_default())
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
                }
                TagValue::UserText(ut) => {
                    sqlx::query(
                        "INSERT INTO tag_user_text (file_id, key, value, description) VALUES (?1, ?2, ?3, ?4)",
                    )
                    .bind(file_id)
                    .bind(frame_key.to_string())
                    .bind(&ut.value)
                    .bind(&ut.description)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
                }
                TagValue::UserUrl(uu) => {
                    sqlx::query(
                        "INSERT INTO tag_user_url (file_id, key, url, description) VALUES (?1, ?2, ?3, ?4)",
                    )
                    .bind(file_id)
                    .bind(frame_key.to_string())
                    .bind(&uu.url)
                    .bind(&uu.description)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
                }
                TagValue::Comment {
                    text,
                    encoding,
                    language,
                    description,
                } => {
                    sqlx::query(
                        "INSERT INTO tag_comment (file_id, key, text, encoding, language, description) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    )
                    .bind(file_id)
                    .bind(frame_key.to_string())
                    .bind(text)
                    .bind(encoding)
                    .bind(language)
                    .bind(description)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
                }
            }
        }
    }

    sqlx::query("UPDATE files SET metadata_status = 'indexed' WHERE path = ?1")
        .bind(file_path)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("UPDATE files SET last_modified = strftime('%s', 'now') WHERE path = ?1")
        .bind(file_path)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(tags)
}

/// Get Tags from Database
async fn detected_tags_in_db(
    pool: &SqlitePool,
    file_path: &str,
) -> std::result::Result<HashMap<FrameKey, Vec<TagValue>>, String> {
    let Some(file_id): Option<i64> = sqlx::query_scalar("SELECT id FROM files WHERE path = ?1")
        .bind(file_path)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
    else {
        return Ok(HashMap::new());
    };

    let tag_txt: Vec<(String, String)> =
        sqlx::query_as("SELECT key, value FROM tag_text WHERE file_id = ?1")
            .bind(file_id)
            .fetch_all(pool)
            .await
            .unwrap_or_default();

    let tag_pics: Vec<(String, String, Vec<u8>, i64, String)> = sqlx::query_as(
        "SELECT key, mime_type, data, picture_type, description FROM tag_pictures WHERE file_id = ?1",
    )
    .bind(file_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let tag_user_texts: Vec<(String, String, String)> =
        sqlx::query_as("SELECT key, value, description FROM tag_user_text WHERE file_id = ?1")
            .bind(file_id)
            .fetch_all(pool)
            .await
            .unwrap_or_default();

    let tag_user_urls: Vec<(String, String, String)> =
        sqlx::query_as("SELECT key, url, description FROM tag_user_url WHERE file_id = ?1")
            .bind(file_id)
            .fetch_all(pool)
            .await
            .unwrap_or_default();

    let tag_comments: Vec<(String, String, String, String, String)> = sqlx::query_as(
        "SELECT key, text, encoding, language, description FROM tag_comment WHERE file_id = ?1",
    )
    .bind(file_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let mut tags: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();

    for (key, value) in tag_txt {
        let Some(frame_key) = FrameKey::from_str(&key) else {
            continue;
        };
        tags.entry(frame_key)
            .or_insert_with(Vec::new)
            .push(TagValue::Text(value));
    }

    for (key, mime_type, data, picture_type, description) in tag_pics {
        if key.is_empty() || mime_type.is_empty() || data.is_empty() {
            continue;
        }
        let Some(frame_key) = FrameKey::from_str(&key) else {
            continue;
        };
        tags.entry(frame_key)
            .or_insert_with(Vec::new)
            .push(TagValue::Picture {
                mime: mime_type,
                data,
                picture_type: Some(picture_type as u8),
                description: Some(description),
            });
    }

    for (key, value, description) in tag_user_texts {
        let Some(frame_key) = FrameKey::from_str(&key) else {
            continue;
        };
        tags.entry(frame_key)
            .or_insert_with(Vec::new)
            .push(TagValue::UserText(UserTextEntry { description, value }));
    }

    for (key, url, description) in tag_user_urls {
        let Some(frame_key) = FrameKey::from_str(&key) else {
            continue;
        };
        tags.entry(frame_key)
            .or_insert_with(Vec::new)
            .push(TagValue::UserUrl(UserUrlEntry { description, url }));
    }

    for (key, text, encoding, language, description) in tag_comments {
        let Some(frame_key) = FrameKey::from_str(&key) else {
            continue;
        };
        tags.entry(frame_key)
            .or_insert_with(Vec::new)
            .push(TagValue::Comment {
                encoding,
                text,
                language,
                description,
            });
    }

    Ok(tags)
}
