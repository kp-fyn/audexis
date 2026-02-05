use crate::commands::import_paths::import_paths;

// use crate::tag_manager::utils::SerializableFile;
use crate::AppState;
use rusqlite::{params, Connection, Result};
use serde::Serialize;
use std::fs::{self, metadata};
use std::path::PathBuf;
use std::thread;

use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager, State};
use walkdir::WalkDir;

#[derive(Serialize)]
pub struct RenameResultItem {
    pub old: String,
    pub new: String,
    pub ok: bool,
    pub error: Option<String>,
}

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

pub fn to_value(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        Some(first_char) => first_char.to_lowercase().chain(chars).collect(),
        None => String::new(),
    }
}
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

pub fn handle_import_files(
    app_handle: tauri::AppHandle,
    paths: Vec<PathBuf>,
    state: State<'_, AppState>,
) {
    // let mut errs: Vec<BackendError> = vec![];
    // {
    //     let mut ws = state.workspace.lock().unwrap();

    //     for path in &paths {
    //         let r = ws.import(path.clone());

    //         if r.is_err() {
    //             errs.push(r.err().unwrap());
    //         }
    //     }
    // }
    let db = state.conn.clone();
    println!("importing files: {:?}", paths.clone().len());

    thread::spawn(move || {
        println!("import thread started");

        let folder = paths.get(0);
        // print!("importing folder: {:?}", folder);
        if folder.is_none() {
            return;
        }
        let mut conn = match db.lock() {
            Ok(c) => c,
            Err(poisoned) => poisoned.into_inner(),
        };

        let folder = folder.unwrap().clone();
        let folder_path = folder.clone().to_string_lossy().to_string();
        match check_import_conflicts(&conn, &folder_path) {
            ImportConflict::ParentExists => {
                println!("wee good")
            }
            ImportConflict::ChildrenExist(children) => {
                println!("removing child adding parent");

                remove_child_roots(&mut conn, &children).ok();
                add_import_root(&conn, &folder_path).ok();
            }
            ImportConflict::Exact => {
                println!("rescan");

                update_root_scan_time(&conn, &folder_path).ok();
            }
            ImportConflict::NotFolder => {
                println!("not a folder");
            }
            ImportConflict::None => {
                print!("adding new root");
                add_import_root(&conn, &folder_path).ok();
            }
        }

        let scanned_files = read_folder(folder);
        if let Err(e) = app_handle.emit("scanned-files", scanned_files.clone()) {
            println!("emit failed: {:?}", e);
        }

        let (new_files, _existing_files) = check_files_against_db(&conn, scanned_files);

        if let Err(e) = insert_pending_files(&mut conn, new_files) {
            println!("insert_pending_files failed: {:?}", e);
        }
        drop(conn);
    });

    println!("import thread spawned");

    // let serializable_files: Vec<SerializableFile> = {
    //     let ws = state.workspace.lock().unwrap();
    //     ws.files
    //         .clone()
    //         .into_iter()
    //         .map(SerializableFile::from)
    //         .collect()
    // };
    // if errs.len() > 0 {
    //     println!("import errors: {:?}", errs);
    //     // app_handle.emit("error", errs).unwrap();
    // }
    // app_handle
    //     .emit("workspace-updated", serializable_files)
    //     .unwrap();

    if let Ok(mut watcher) = state.file_watcher.lock() {
        let _ = watcher.watch_workspace();
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

fn insert_pending_files(conn: &mut Connection, new_files: Vec<PathBuf>) -> Result<()> {
    let tx = conn.transaction()?;

    for file_path in new_files {
        let path_str: String = file_path.to_string_lossy().to_string();
        let file_name = file_path.file_name().and_then(|n| n.to_str()).unwrap_or("");

        let file_size = fs::metadata(&file_path).ok().map(|m| m.len());

        let last_modified = fs::metadata(&file_path)
            .ok()
            .and_then(|m| m.modified().ok());

        let res = tx.execute(
            "INSERT INTO files (path, file_name, file_size, last_modified, status) 
             VALUES (?1, ?2, ?3, ?4, 'pending')",
            params![
                path_str.as_str(),
                file_name,
                file_size.map(|size| size as i64).unwrap_or(0),
                last_modified.map(|t| systemtime_to_unix(t)).unwrap_or(0),
            ],
        );
        // if let Err(e) = res {
        //     println!("Failed to insert file {}: {:?}", path_str, e);
        //     continue;
        // }
    }

    tx.commit()?;
    Ok(())
}
fn check_files_against_db(
    conn: &Connection,
    scanned_files: Vec<PathBuf>,
) -> (Vec<PathBuf>, Vec<PathBuf>) {
    let mut new_files = Vec::new();
    let mut existing_files = Vec::new();

    for file_path in scanned_files {
        let path_str: String = file_path.to_string_lossy().to_string();
        let r = conn.query_row(
            "SELECT 1 FROM files WHERE path = ?1",
            [path_str.as_str()],
            |_e| Ok(true),
        );
        if r.is_err() {
            println!("DB query error for file {}: {:?}", path_str, r.err());
            new_files.push(file_path);
            continue;
        }
        let exists: bool = r.unwrap_or(false);

        if exists {
            let disk_modified = metadata(&file_path).ok().and_then(|m| m.modified().ok());
            if disk_modified.is_none() {
                println!("Failed to get disk modified time for file {}", path_str);
                new_files.push(file_path);
                continue;
            }

            let db_modified: Option<SystemTime> = conn
                .query_row(
                    "SELECT last_modified FROM files WHERE path = ?1",
                    [path_str.as_str()],
                    |row| {
                        let timestamp: i64 = row.get(0)?;
                        Ok(unix_to_systemtime(timestamp))
                    },
                )
                .ok();
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

            if disk_modified != db_modified {
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

enum ImportConflict {
    None,
    Exact,
    NotFolder,
    ParentExists,
    ChildrenExist(Vec<String>),
}

fn check_import_conflicts(conn: &Connection, new_path: &str) -> ImportConflict {
    let is_folder = metadata(new_path).map(|m| m.is_dir()).unwrap_or(false);
    if !is_folder {
        return ImportConflict::NotFolder;
    }
    let exact_exists: bool = conn
        .query_row(
            "SELECT 1 FROM import_roots WHERE path = ?1 AND status = 'active'",
            [new_path],
            |_| Ok(true),
        )
        .unwrap_or(false);

    if exact_exists {
        return ImportConflict::Exact;
    }

    let mut stmt = conn
        .prepare("SELECT path FROM import_roots WHERE status = 'active'")
        .unwrap();

    let existing_roots: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();

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

fn add_import_root(conn: &Connection, path: &str) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO import_roots (path, last_scanned) VALUES (?1, strftime('%s', 'now'))",
        [path],
    )?;
    Ok(())
}

fn remove_child_roots(conn: &mut Connection, children: &[String]) -> Result<(), rusqlite::Error> {
    let tx = conn.transaction()?;

    for child in children {
        // keep for history
        tx.execute(
            "UPDATE import_roots SET status = 'removed' WHERE path = ?1",
            [child],
        )?;
    }

    tx.commit()?;
    Ok(())
}

fn update_root_scan_time(conn: &Connection, path: &str) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE import_roots SET last_scanned = strftime('%s', 'now') WHERE path = ?1",
        [path],
    )?;
    Ok(())
}
