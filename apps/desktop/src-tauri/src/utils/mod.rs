use crate::commands::import_paths::import_paths;
use crate::config::user::ViewMode;
use crate::database::Database;
use std::path::MAIN_SEPARATOR_STR;
// use crate::tag_manager::utils::SerializableFile;
use crate::tag_manager::tag_backend::{BackendError, DefaultBackend, TagBackend};
use crate::tag_manager::utils::{
    File, FrameKey, SerializableFile, TagValue, UserTextEntry, UserUrlEntry,
};

use crate::{AppState, FileNode};
use serde::Serialize;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs::{self, metadata};
use std::path::PathBuf;

use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{async_runtime, Emitter, Manager, State};
use walkdir::WalkDir;

#[derive(Serialize)]
pub struct RenameResultItem {
    pub old: String,
    pub new: String,
    pub ok: bool,
    pub error: Option<String>,
}

/// Make it pretty
pub fn to_label(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars().peekable();

    while let Some(c) = chars.next() {
        if c.is_ascii_uppercase()
            && !result.is_empty()
            && chars
                .peek()
                .map_or(true, |&next_c| next_c.is_ascii_lowercase())
        {
            result.push(' ');
        }
        result.push(c);
    }
    result
}
/// Check if file is in folder
pub fn is_in_folder(folder: &PathBuf, file: &PathBuf) -> bool {
    let folder_path = format!(
        "{}{}",
        folder.to_string_lossy().to_string(),
        MAIN_SEPARATOR_STR
    );
    println!("check");
    println!(":{:?}", file.to_string_lossy().to_string());
    println!("{:?}", &folder_path);
    file.to_string_lossy().to_string().starts_with(&folder_path)
}
/// To Lowercase basically
pub fn to_value(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        Some(first_char) => first_char.to_lowercase().chain(chars).collect(),
        None => String::new(),
    }
}
/// Handle files imported externarlly
pub fn handle_file_associations(app_handle: tauri::AppHandle, paths: Vec<PathBuf>) {
    let binding = app_handle.clone();
    let state = binding.try_state();
    if state.is_none() {
        return;
    }
    let state = state.unwrap();
    let string_paths: Vec<String> = paths
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();
    import_paths(app_handle, string_paths, state);
}
/// Add new File to Database if doesn't exist already
pub fn index_files(app_handle: tauri::AppHandle, paths: Vec<PathBuf>) -> Result<Vec<PathBuf>, ()> {
    let state = app_handle.state::<AppState>();

    let db = state.db.clone();
    let result = async_runtime::block_on(async {
        let (new_files, _existing_files) = check_files_against_db(&db.pool, paths).await;
        if let Err(e) = insert_pending_files(&db.pool, new_files.clone()).await {
            println!("insert_pending_files failed: {e}");
        }
        Ok::<_, ()>(new_files)
    });

    result
}

/// Attempt to import files
pub fn handle_import_files(
    app_handle: tauri::AppHandle,
    paths: Vec<PathBuf>,
    state: State<'_, AppState>,
) {
    let mut errs: Vec<BackendError> = vec![];
    if state.view_mode == ViewMode::Simple {
        {
            let mut ws = state.workspace.lock().unwrap();
            for path in paths {
                let r = ws.import(PathBuf::from(path));
                if let Err(e) = r {
                    println!("error importing file: {:?}", e);
                    errs.push(e);
                }
            }
        }

        let serializable_files: Vec<SerializableFile> = {
            let ws = state.workspace.lock().unwrap();
            ws.files
                .clone()
                .into_iter()
                .map(SerializableFile::from)
                .collect()
        };

        if !errs.is_empty() {
            app_handle.emit("error", errs).unwrap();
        }

        app_handle
            .emit("workspace-updated", serializable_files)
            .unwrap();

        if let Ok(mut watcher) = state.file_watcher.lock() {
            let _ = watcher.watch_workspace();
        }
    } else {
        let db = state.db.clone();
        println!("importing files: {:?}", paths.clone().len());

        let app_handle = app_handle.clone();
        async_runtime::spawn(async move {
            println!("import task started");

            let folder = paths.get(0).cloned();
            if folder.is_none() {
                return;
            }

            let folder = folder.unwrap();
            let folder_path = folder.to_string_lossy().to_string();

            match check_import_conflicts(&db.pool, &folder_path).await {
                ImportConflict::ParentExists => {
                    println!("parent folder already imported");
                    return;
                }
                ImportConflict::ChildrenExist(children) => {
                    let _ = remove_child_roots(&db.pool, &children).await;
                    let _ = add_import_root(&db.pool, &folder_path).await;
                }
                ImportConflict::Exact => {
                    let _ = update_root_scan_time(&db.pool, &folder_path).await;
                }
                ImportConflict::NotFolder => {
                    println!("not a folder");
                    return;
                }
                ImportConflict::None => {
                    let _ = add_import_root(&db.pool, &folder_path).await;
                }
            }

            let scanned_files = read_folder(folder);
            if let Err(e) = app_handle.emit("scanned-files", scanned_files.clone()) {
                println!("emit failed: {:?}", e);
            }

            let (new_files, _existing_files) =
                check_files_against_db(&db.pool, scanned_files).await;
            if let Err(e) = insert_pending_files(&db.pool, new_files).await {
                println!("insert_pending_files failed: {e}");
            }

            let roots: Vec<String> = sqlx::query_scalar(
                "SELECT path FROM import_roots WHERE status = 'active' ORDER BY path",
            )
            .fetch_all(&db.pool)
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
        });

        if let Ok(mut watcher) = state.file_watcher.lock() {
            let _ = watcher.watch_workspace();
        }
    }
}
pub fn is_supported_file(path: &PathBuf) -> bool {
    const SUPPORTED_EXTENSIONS: [&str; 15] = [
        "m4a", "mp4", "qt", "m4b", "m4v", "mov", "ogg", "opus", "oga", "spx", "ogv", "mp3", "mp2",
        "mp1", "flac",
    ];
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext_str| SUPPORTED_EXTENSIONS.contains(&ext_str.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// Read folder recursivley and return all supported files
fn read_folder(path: PathBuf) -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = vec![];
    let is_folder = metadata(&path).map(|m| m.is_dir()).unwrap_or(false);
    if is_folder {
        for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
            let entry_path = entry.path().to_path_buf();
            let entry_is_folder = metadata(&entry_path).map(|m| m.is_dir()).unwrap_or(false);
            if !entry_is_folder {
                let is_supported = is_supported_file(&entry_path);

                if is_supported {
                    files.push(entry_path);
                }
            }
        }
    } else {
        files.push(path);
    }
    files
}

fn unix_to_systemtime(timestamp: i64) -> SystemTime {
    UNIX_EPOCH + Duration::from_secs(timestamp as u64)
}
fn systemtime_to_unix(time: SystemTime) -> i64 {
    time.duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::from_secs(0))
        .as_secs() as i64
}
/// Remove File from db
pub fn delete_file_path(app_handle: tauri::AppHandle, file_path: PathBuf) {
    let state = app_handle.state::<AppState>();

    let db = state.db.clone();
    let file_path_str = file_path.to_string_lossy().to_string();

    let _ = async_runtime::block_on(async {
        let _ = sqlx::query("DELETE FROM files WHERE path = ?1")
            .bind(file_path_str)
            .execute(&db.pool)
            .await;
    });
}

/// Update file path in db when file is renamed or moved
pub fn update_file_path(app_handle: tauri::AppHandle, old_path: PathBuf, new_path: PathBuf) {
    let state = app_handle.state::<AppState>();

    let db = state.db.clone();

    let new_path_str = new_path.to_string_lossy().to_string();
    let old_path_str = old_path.to_string_lossy().to_string();

    let _ = async_runtime::block_on(async {
        let exists = sqlx::query_scalar::<_, i64>("SELECT 1 FROM files WHERE path = ?1")
            .bind(&new_path_str)
            .fetch_optional(&db.pool)
            .await
            .ok()
            .flatten()
            .is_some();

        if exists {
            let _ = sqlx::query("DELETE FROM files WHERE path = ?1")
                .bind(&old_path_str)
                .execute(&db.pool)
                .await;
        } else {
            let new_file_name = new_path
                .file_name()
                .unwrap_or(OsStr::new("file"))
                .to_string_lossy()
                .to_string();

            let _ = sqlx::query("UPDATE files SET path = ?2, file_name = ?3 WHERE path = ?1")
                .bind(&old_path_str)
                .bind(&new_path_str)
                .bind(new_file_name)
                .execute(&db.pool)
                .await;
        }
    });
}

/// Insert new files into the database with pending status. If file already exists, update its metadata.
async fn insert_pending_files(
    pool: &SqlitePool,
    new_files: Vec<PathBuf>,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    for file_path in new_files {
        let path_str: String = file_path.to_string_lossy().to_string();
        let file_name = file_path.file_name().and_then(|n| n.to_str()).unwrap_or("");

        let file_size = fs::metadata(&file_path).ok().map(|m| m.len());

        let last_modified = fs::metadata(&file_path)
            .ok()
            .and_then(|m| m.modified().ok());

        let res = sqlx::query(
            "INSERT INTO files (path, file_name, file_size, last_modified, status) \
             VALUES (?1, ?2, ?3, ?4, 'pending') \
             ON CONFLICT(path)\
              DO UPDATE SET file_name=?2, file_size=?3",
        )
        .bind(path_str.as_str())
        .bind(file_name)
        .bind(file_size.map(|size| size as i64).unwrap_or(0))
        .bind(last_modified.map(systemtime_to_unix).unwrap_or(0))
        .execute(&mut *tx)
        .await;

        if let Err(e) = res {
            println!("Failed to insert file {}: {:?}", path_str, e);
            continue;
        }
    }

    tx.commit().await?;
    Ok(())
}
/// Check scanned files against database and return new files that are not in the database or have been modified since last scan, and existing files that are up to date.
async fn check_files_against_db(
    pool: &SqlitePool,
    scanned_files: Vec<PathBuf>,
) -> (Vec<PathBuf>, Vec<PathBuf>) {
    let mut new_files = Vec::new();
    let mut existing_files = Vec::new();

    for file_path in scanned_files {
        let path_str: String = file_path.to_string_lossy().to_string();
        let exists = sqlx::query_scalar::<_, i64>("SELECT 1 FROM files WHERE path = ?1")
            .bind(path_str.as_str())
            .fetch_optional(pool)
            .await
            .ok()
            .flatten()
            .is_some();

        if exists {
            let disk_modified = metadata(&file_path).ok().and_then(|m| m.modified().ok());
            // if no modified timestamp in file metaadata add to new files
            if disk_modified.is_none() {
                new_files.push(file_path);
                continue;
            }

            let db_modified: Option<SystemTime> =
                sqlx::query_scalar::<_, i64>("SELECT last_modified FROM files WHERE path = ?1")
                    .bind(path_str.as_str())
                    .fetch_optional(pool)
                    .await
                    .ok()
                    .flatten()
                    .map(unix_to_systemtime);
            // if no modified timestamp in file metaadata add to new files

            if db_modified.is_none() {
                println!("Failed to get DB modified time for file {}", path_str);
                new_files.push(file_path);
                continue;
            }
            let db_modified = db_modified.unwrap();
            let disk_modified = disk_modified.unwrap();
            let db_modified = db_modified
                .duration_since(UNIX_EPOCH)
                .unwrap_or(Duration::from_secs(0))
                .as_secs();
            let disk_modified = disk_modified
                .duration_since(UNIX_EPOCH)
                .unwrap_or(Duration::from_secs(1))
                .as_secs();

            if disk_modified > db_modified {
                print!("File changed: frm {:?} to {:?}", db_modified, disk_modified);
                new_files.push(file_path);
            } else {
                existing_files.push(file_path);
            }
        } else {
            new_files.push(file_path);
        }
    }

    (new_files, existing_files)
}

/// Get Root folders
pub async fn get_imported_folders(db: &Database) -> Vec<String> {
    let imported_folders =
        sqlx::query_scalar("SELECT path FROM import_roots WHERE status = 'active'")
            .fetch_all(&db.pool)
            .await
            .unwrap_or_default();

    imported_folders
}
enum ImportConflict {
    None,
    Exact,
    NotFolder,
    ParentExists,
    ChildrenExist(Vec<String>),
}

/// Check for import conflicts when adding a new import root.
async fn check_import_conflicts(pool: &SqlitePool, new_path: &str) -> ImportConflict {
    let is_folder = metadata(new_path).map(|m| m.is_dir()).unwrap_or(false);
    if !is_folder {
        return ImportConflict::NotFolder;
    }

    let exact_exists = sqlx::query_scalar::<_, i64>(
        "SELECT 1 FROM import_roots WHERE path = ?1 AND status = 'active'",
    )
    .bind(new_path)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
    .is_some();

    if exact_exists {
        return ImportConflict::Exact;
    }

    let existing_roots: Vec<String> =
        sqlx::query_scalar("SELECT path FROM import_roots WHERE status = 'active'")
            .fetch_all(pool)
            .await
            .unwrap_or_default();

    for root in &existing_roots {
        if new_path.starts_with(root) && new_path != root {
            return ImportConflict::ParentExists;
        }
    }

    let children: Vec<String> = existing_roots
        .into_iter()
        .filter(|root| root.starts_with(new_path) && root != new_path)
        .collect();

    if !children.is_empty() {
        return ImportConflict::ChildrenExist(children);
    }

    ImportConflict::None
}

/// Add new import root to database
async fn add_import_root(pool: &SqlitePool, path: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO import_roots (path, last_scanned, status) VALUES (?1, strftime('%s', 'now'), 'active')\
         ON CONFLICT(path) DO UPDATE SET status = 'active', last_scanned = strftime('%s', 'now')",
    )
    .bind(path)
    .execute(pool)
    .await?;

    Ok(())
}
/// Mark child roots as removed when a parent root is added. This keeps the history of imports intact while preventing duplicate scans. The actual scanning logic should ignore roots marked as removed.
async fn remove_child_roots(pool: &SqlitePool, children: &[String]) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    for child in children {
        sqlx::query("UPDATE import_roots SET status = 'removed' WHERE path = ?1")
            .bind(child)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;
    Ok(())
}
/// useless for now
async fn update_root_scan_time(pool: &SqlitePool, path: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE import_roots SET last_scanned = strftime('%s', 'now') WHERE path = ?1")
        .bind(path)
        .execute(pool)
        .await?;
    Ok(())
}
/// Get tags from database if exists.
/// If does not exist read file metadata from disk
pub async fn get_tags(
    db: &Database,
    file_paths: Vec<String>,
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
            }
        }

        let is_indexed = sqlx::query_scalar::<_, i64>(
            "SELECT 1 FROM files WHERE path = ?1 AND metadata_status = 'indexed'",
        )
        .bind(file_path.as_str())
        .fetch_optional(&db.pool)
        .await
        .map_err(|e| e.to_string())?
        .is_some();

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

            let file = File {
                path: PathBuf::from(&file_path),
                tags,
                freeforms: Vec::new(),
                tag_format,
                tag_formats,
                id: uuid::Uuid::new_v4(),
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

            let file = File {
                path: PathBuf::from(&file_path),
                tags,
                freeforms: Vec::new(),
                tag_format,
                tag_formats,
                id: uuid::Uuid::new_v4(),
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

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM tag_text WHERE file_path = ?1")
        .bind(file_path)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM tag_pictures WHERE file_path = ?1")
        .bind(file_path)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM tag_user_text WHERE file_path = ?1")
        .bind(file_path)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM tag_user_url WHERE file_path = ?1")
        .bind(file_path)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM tag_comment WHERE file_path = ?1")
        .bind(file_path)
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
                    sqlx::query("INSERT INTO tag_text (file_path, key, value) VALUES (?1, ?2, ?3)")
                        .bind(file_path)
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
                        "INSERT INTO tag_pictures (file_path, key, mime_type, data, picture_type, description) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    )
                    .bind(file_path)
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
                        "INSERT INTO tag_user_text (file_path, key, value, description) VALUES (?1, ?2, ?3, ?4)",
                    )
                    .bind(file_path)
                    .bind(frame_key.to_string())
                    .bind(&ut.value)
                    .bind(&ut.description)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
                }
                TagValue::UserUrl(uu) => {
                    sqlx::query(
                        "INSERT INTO tag_user_url (file_path, key, url, description) VALUES (?1, ?2, ?3, ?4)",
                    )
                    .bind(file_path)
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
                        "INSERT INTO tag_comment (file_path, key, text, encoding, language, description) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    )
                    .bind(file_path)
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
    let tag_txt: Vec<(String, String)> =
        sqlx::query_as("SELECT key, value FROM tag_text WHERE file_path = ?1")
            .bind(file_path)
            .fetch_all(pool)
            .await
            .unwrap_or_default();

    let tag_pics: Vec<(String, String, Vec<u8>, i64, String)> = sqlx::query_as(
        "SELECT key, mime_type, data, picture_type, description FROM tag_pictures WHERE file_path = ?1",
    )
    .bind(file_path)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let tag_user_texts: Vec<(String, String, String)> =
        sqlx::query_as("SELECT key, value, description FROM tag_user_text WHERE file_path = ?1")
            .bind(file_path)
            .fetch_all(pool)
            .await
            .unwrap_or_default();

    let tag_user_urls: Vec<(String, String, String)> =
        sqlx::query_as("SELECT key, url, description FROM tag_user_url WHERE file_path = ?1")
            .bind(file_path)
            .fetch_all(pool)
            .await
            .unwrap_or_default();

    let tag_comments: Vec<(String, String, String, String, String)> = sqlx::query_as(
        "SELECT key, text, encoding, language, description FROM tag_comment WHERE file_path = ?1",
    )
    .bind(file_path)
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
