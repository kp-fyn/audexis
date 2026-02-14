use std::collections::HashMap;
use std::collections::HashSet;
use std::ffi::OsStr;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::time::Duration;

use notify::event::RemoveKind;
use notify::event::RenameMode;
use notify::RecursiveMode;
use notify::Watcher;
use notify_debouncer_full::DebouncedEvent;
use notify_debouncer_full::{new_debouncer, Debouncer, FileIdMap};
use rusqlite::Connection;

use tauri::{AppHandle, Emitter, Manager};

use crate::config::user::load_config;
use crate::config::user::ViewMode;
use crate::config::user::CONFIG_FILE;
use crate::tag_manager::utils::SerializableFile;
use crate::utils::delete_file_path;
use crate::utils::get_imported_folders;
use crate::utils::index_files;
use crate::utils::is_supported_file;
use crate::utils::update_file_path;
use crate::AppState;
use crate::FileNode;
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
#[serde[tag = "op", content = "file"]]
pub enum OpEvent {
    Create(CreatedFile),
    Modify(ModifiedFile),
    Remove(DeletedFile),
}

#[derive(Debug, Serialize, Clone)]
pub struct CreatedFile {
    pub path: PathBuf,
    pub name: String,
    pub is_directory: bool,
    pub parent_path: PathBuf,
}
#[derive(Debug, Serialize, Clone)]
pub struct ModifiedFile {
    pub path: PathBuf,
    pub old_path: PathBuf,
    pub name: String,
    pub is_directory: bool,
    pub parent_path: PathBuf,
}
#[derive(Debug, Serialize, Clone)]
pub struct DeletedFile {
    pub path: PathBuf,
    pub parent_path: PathBuf,
}
pub struct Ev {
    pub kind: notify::event::EventKind,
}
pub struct FileWatcher {
    app_handle: AppHandle,
    debouncer: Option<Debouncer<notify::RecommendedWatcher, FileIdMap>>,
    is_folder_view: bool,
}
impl FileWatcher {
    pub fn new(app: &AppHandle) -> Self {
        let app_handle = app.clone();
        let path = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data directory");
        let config_path = path.join(CONFIG_FILE);
        let user_config = load_config(&config_path);
        let is_folder_view = user_config.view == ViewMode::Folder;
        Self {
            app_handle: app_handle,
            debouncer: None,
            is_folder_view,
        }
    }

    pub fn watch_workspace(&mut self) -> Result<(), String> {
        let app_handle = self.app_handle.clone();
        let is_folder_view = self.is_folder_view;

        let mut debouncer = new_debouncer(
            Duration::from_millis(500),
            None,
            move |res: Result<Vec<DebouncedEvent>, _>| match res {
                Ok(events) => {
                    FileWatcher::handle_events(is_folder_view, &app_handle, &events);
                }
                Err(e) => eprintln!("file watcher error: {:?}", e),
            },
        )
        .map_err(|e| format!("failed to create debouncer: {e}"))?;

        let mut roots: HashSet<PathBuf> = HashSet::new();

        let app_handle = self.app_handle.clone();
        let state = app_handle.state::<AppState>();

        if self.is_folder_view == true {
            let db: std::sync::Arc<std::sync::Mutex<Connection>> = state.conn.clone();

            let conn = db
                .lock()
                .map_err(|e| format!("Failed to lock DB connection: {e}"))?;
            let imported_folders = get_imported_folders(&conn);
            for folder in imported_folders {
                roots.insert(PathBuf::from(folder));
            }
            drop(conn);
        } else {
            if let Ok(ws_guard) = state.workspace.lock() {
                for f in &ws_guard.files {
                    if let Some(parent) = f.path.parent() {
                        roots.insert(parent.to_path_buf());
                    }
                }
            }
        }
        for root in roots {
            if let Err(e) = debouncer.watcher().watch(&root, RecursiveMode::Recursive) {
                eprintln!("watch error for {:?}: {}", root, e);
            } else {
                let _ = debouncer.cache().add_root(&root, RecursiveMode::Recursive);
            }
        }
        if let Some(old_debouncer) = self.debouncer.take() {
            old_debouncer.stop();
        }
        self.debouncer = Some(debouncer);
        Ok(())
    }

    fn handle_events(is_folder_view: bool, app_handle: &AppHandle, events: &[DebouncedEvent]) {
        use notify::event::{EventKind, ModifyKind};

        let mut touched: HashMap<PathBuf, Ev> = HashMap::new();
        let mut modified: HashMap<PathBuf, Vec<PathBuf>> = HashMap::new();
        let mut op_events: Vec<OpEvent> = Vec::new();
        let mut pending_renames: HashMap<usize, PathBuf> = HashMap::new();
        for ev in events {
            println!("File event: {:?}", ev.event.kind);
            match &ev.event.kind {
                EventKind::Modify(ModifyKind::Name(rename_mode)) => match rename_mode {
                    RenameMode::Both => {
                        if ev.event.paths.len() >= 2 {
                            for file_path in &ev.event.paths {
                                println!("{:?}", file_path);
                            }
                            let old_path = ev.event.paths[0].clone();
                            let new_path = ev.event.paths[1].clone();
                            let parent_path =
                                old_path.parent().unwrap_or(Path::new("/")).to_path_buf();
                            let file_name = new_path
                                .file_name()
                                .unwrap_or(OsStr::new("file"))
                                .to_string_lossy()
                                .to_string();

                            if new_path.is_dir() && new_path.exists() {
                                let op_event = OpEvent::Modify(ModifiedFile {
                                    path: new_path,
                                    old_path,
                                    name: file_name,
                                    is_directory: true,
                                    parent_path,
                                });
                                op_events.push(op_event);
                            } else {
                                if is_supported_file(&old_path) == true {
                                    if is_folder_view == true {
                                        update_file_path(
                                            app_handle.clone(),
                                            old_path.clone(),
                                            new_path.clone(),
                                        );
                                        let op_event = OpEvent::Modify(ModifiedFile {
                                            path: new_path,
                                            old_path,
                                            name: file_name,
                                            is_directory: false,
                                            parent_path,
                                        });
                                        op_events.push(op_event);
                                    } else {
                                        modified.insert(
                                            ev.paths
                                                .get(0)
                                                .unwrap_or(&PathBuf::new())
                                                .to_path_buf()
                                                .to_owned(),
                                            ev.paths[1..].to_vec(),
                                        );
                                    }
                                }
                            }
                        }
                    }
                    RenameMode::From => {
                        if let Some(tracker) = ev.event.attrs.tracker() {
                            pending_renames.insert(tracker, ev.event.paths[0].clone());
                        }
                    }
                    RenameMode::To => {
                        if let Some(tracker) = ev.event.attrs.tracker() {
                            if let Some(old_path) = pending_renames.remove(&tracker) {
                                let new_path = ev.event.paths[0].clone();

                                let parent_path =
                                    old_path.parent().unwrap_or(Path::new("/")).to_path_buf();

                                if new_path.is_dir() == false
                                    && is_supported_file(&new_path) == true
                                {
                                    update_file_path(
                                        app_handle.clone(),
                                        old_path.clone(),
                                        new_path.clone(),
                                    );
                                }
                                if new_path.is_dir() == false
                                    && is_supported_file(&new_path) == false
                                {
                                    continue;
                                }
                                let file_name = new_path
                                    .file_name()
                                    .unwrap_or(OsStr::new("file"))
                                    .to_string_lossy()
                                    .to_string();

                                if new_path.exists() == true {
                                    let op_event = OpEvent::Modify(ModifiedFile {
                                        path: new_path.clone(),
                                        old_path,
                                        name: file_name,
                                        is_directory: new_path.is_dir(),
                                        parent_path,
                                    });
                                    op_events.push(op_event);
                                }
                            }
                        }
                    }

                    _ => {}
                },

                EventKind::Create(_) => {
                    if is_folder_view == true {
                        let mut file_nodes: Vec<FileNode> = Vec::new();
                        let new_files = index_files(app_handle.clone(), ev.paths.clone());
                        for p in &ev.paths {
                            let name = p
                                .file_name()
                                .unwrap_or(OsStr::new(""))
                                .to_string_lossy()
                                .to_string();
                            let is_directory = p.is_dir();
                            file_nodes.push(FileNode {
                                path: p.to_str().unwrap_or("").to_string(),
                                name,
                                is_directory,
                            });
                        }

                        for new_file in new_files.unwrap_or_default() {
                            let name = new_file
                                .file_name()
                                .unwrap_or(OsStr::new(""))
                                .to_string_lossy()
                                .to_string();
                            let is_directory = false;
                            file_nodes.push(FileNode {
                                path: new_file.to_str().unwrap_or("").to_string(),
                                name,
                                is_directory,
                            });
                        }
                        for file_node in file_nodes {
                            if let Some(existing_index) = op_events.iter().position(|ev| match ev {
                                OpEvent::Create(f) => f.path == file_node.path,
                                OpEvent::Modify(f) => f.path == file_node.path,
                                OpEvent::Remove(f) => f.path == file_node.path,
                            }) {
                                let should_add = op_events.iter().any(|fe| match fe {
                                    OpEvent::Remove(f) => {
                                        fs::exists(f.path.clone()).unwrap_or(false)
                                    }
                                    _ => true,
                                });
                                if should_add == false {
                                    continue;
                                }
                                let parent_path = PathBuf::from(&file_node.path)
                                    .parent()
                                    .unwrap_or_else(|| Path::new(""))
                                    .to_path_buf();
                                let p = PathBuf::from(file_node.path.clone());
                                let is_directory = p.is_dir();

                                op_events[existing_index] = OpEvent::Create(CreatedFile {
                                    path: p,
                                    name: file_node.name,
                                    is_directory,
                                    parent_path,
                                });
                            } else {
                                let parent_path = PathBuf::from(&file_node.path)
                                    .parent()
                                    .unwrap_or_else(|| Path::new(""))
                                    .to_path_buf();
                                let p = PathBuf::from(file_node.path.clone());
                                let is_directory = p.is_dir();
                                op_events.push(OpEvent::Create(CreatedFile {
                                    path: p,
                                    name: file_node.name,
                                    is_directory,
                                    parent_path,
                                }));
                            }
                        }
                    } else {
                        for p in &ev.paths {
                            touched.insert(
                                p.to_path_buf(),
                                Ev {
                                    kind: ev.event.kind.clone(),
                                },
                            );
                        }
                    }
                }

                EventKind::Remove(_) => {
                    if is_folder_view {
                        for p in &ev.paths {
                            delete_file_path(app_handle.clone(), p.clone());
                            let parent_path = p.parent().unwrap_or(Path::new("/")).to_path_buf();
                            op_events.push(OpEvent::Remove(DeletedFile {
                                path: p.clone(),
                                parent_path,
                            }));
                        }
                    } else {
                        for p in &ev.paths {
                            touched.insert(
                                p.to_path_buf(),
                                Ev {
                                    kind: ev.event.kind.clone(),
                                },
                            );
                        }
                    }
                }
                _ => {}
            }
        }
        if is_folder_view == true {
            app_handle.emit("folder-view-events", op_events).ok();
            return;
        }
        let state: tauri::State<AppState> = app_handle.state();
        let mut ws = match state.workspace.lock() {
            Ok(g) => g,
            Err(_) => return,
        };

        let mut was_modified = false;
        println!("Total touched files: {:?}", modified);
        if modified.is_empty() == false {
            for (k, v) in modified {
                let mut prev_path: Option<PathBuf> = k.clone().into();

                for p in v.iter() {
                    let path_to_find: PathBuf =
                        prev_path.as_ref().cloned().unwrap_or_else(|| k.clone());
                    println!("Path to find: {:?}", path_to_find);
                    let file = ws.get_file_by_path_mut(&path_to_find);
                    if file.is_none() {
                        continue;
                    }
                    let file = file.unwrap();

                    if p == &path_to_find {
                        continue;
                    }

                    let pe = fs::exists(p.as_path());
                    let path_exists: bool = match pe {
                        Ok(exists) => {
                            if !exists {
                                false
                            } else {
                                true
                            }
                        }
                        Err(_) => continue,
                    };
                    if path_exists == false {
                        continue;
                    }

                    prev_path = Some(p.clone());
                    print!("Renaming file from {:?} to {:?}\n", file.path, p);
                    file.path = p.clone();
                    was_modified = true;
                }
            }
        }
        if was_modified {
            let serializable_files: Vec<SerializableFile> = ws
                .files
                .clone()
                .into_iter()
                .map(SerializableFile::from)
                .collect();
            let _ = app_handle.emit("workspace-updated", serializable_files);
        }
        if touched.is_empty() {
            return;
        }

        let (did_change, serializable_files) = {
            println!("Handling {} touched files", touched.len());

            let mut changed = false;
            for p in touched {
                let pe = fs::exists(p.0.as_path());
                let path_exists: bool = match pe {
                    Ok(exists) => {
                        if !exists {
                            println!("File was removed: {:?}", p.0);
                            println!("Is rename: {:?}", p.1.kind.is_modify());
                            println!("File does not exist: {:?}", p.0);
                            if ws.remove_file(&p.0) {
                                changed = true;
                            }
                            false
                        } else {
                            true
                        }
                    }
                    Err(_) => {
                        if ws.remove_file(&p.0) {
                            changed = true;
                        }
                        false
                    }
                };
                let pth = p.0.clone();

                if p.1.kind.is_create() || p.1.kind.is_modify() {
                    println!("is create");
                    changed = true;
                } else {
                    if path_exists && p.1.kind.is_modify() {
                        ws.refresh_tags(&pth);
                    }
                }
            }
            if !changed {
                (false, Vec::new())
            } else {
                let files: Vec<SerializableFile> = ws
                    .files
                    .clone()
                    .into_iter()
                    .map(SerializableFile::from)
                    .collect();
                (true, files)
            }
        };

        if did_change {
            let _ = app_handle.emit("workspace-updated", serializable_files);
        }
    }
}
