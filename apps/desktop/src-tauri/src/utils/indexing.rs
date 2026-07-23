use crate::commands::import_paths::import_paths;

use crate::database::Database;
use crate::tag_manager::tag_backend::BackendError;

use crate::utils::filesystem::read_folder;
use crate::{AppState, FileNode};
use sqlx::SqlitePool;
use std::ffi::OsStr;
use std::fs::{self, metadata};
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{async_runtime, Emitter, Manager, State};

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
    // let mut errs: Vec<BackendError> = vec![];

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

        let (new_files, _existing_files) = check_files_against_db(&db.pool, scanned_files).await;
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

pub(crate) fn unix_to_systemtime(timestamp: i64) -> SystemTime {
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
pub(crate) async fn insert_pending_files(
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
