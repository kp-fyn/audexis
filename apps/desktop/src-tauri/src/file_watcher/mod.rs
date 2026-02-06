use std::collections::HashMap;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

use notify::RecursiveMode;
use notify::Watcher;
use notify_debouncer_full::DebouncedEvent;
use notify_debouncer_full::{new_debouncer, Debouncer, FileIdMap};
use tauri::{AppHandle, Emitter, Manager};

use crate::tag_manager::utils::SerializableFile;
use crate::workspace::Workspace;
use crate::AppState;

pub struct Ev {
    pub kind: notify::event::EventKind,
}
pub struct FileWatcher {
    app_handle: AppHandle,
    debouncer: Option<Debouncer<notify::RecommendedWatcher, FileIdMap>>,
}
impl FileWatcher {
    pub fn new(app: &AppHandle) -> Self {
        Self {
            app_handle: app.clone(),
            debouncer: None,
        }
    }

    pub fn with_workspace<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&mut Workspace) -> R,
    {
        let state: tauri::State<AppState> = self.app_handle.state();
        let mut ws = state.workspace.lock().expect("workspace lock aint good");
        f(&mut ws)
    }
    pub fn watch_workspace(&mut self) -> Result<(), String> {
        let app_handle = self.app_handle.clone();

        let mut debouncer = new_debouncer(
            Duration::from_millis(500),
            None,
            move |res: Result<Vec<DebouncedEvent>, _>| match res {
                Ok(events) => {
                    FileWatcher::handle_events(&app_handle, &events);
                }
                Err(e) => eprintln!("file watcher error: {:?}", e),
            },
        )
        .map_err(|e| format!("failed to create debouncer: {e}"))?;

        let mut roots: HashSet<PathBuf> = HashSet::new();
        let state = self.app_handle.state::<AppState>();
        if let Ok(ws_guard) = state.workspace.lock() {
            for f in &ws_guard.files {
                if let Some(parent) = f.path.parent() {
                    roots.insert(parent.to_path_buf());
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

    fn handle_events(app_handle: &AppHandle, events: &[DebouncedEvent]) {
        use notify::event::{EventKind, ModifyKind};

        let mut touched: HashMap<PathBuf, Ev> = HashMap::new();
        let mut modified: HashMap<PathBuf, Vec<PathBuf>> = HashMap::new();
        for ev in events {
            println!("File event: {:?}", ev.event.kind);
            match &ev.event.kind {
                EventKind::Modify(ModifyKind::Name(_)) | EventKind::Modify(ModifyKind::Data(_)) => {
                    modified.insert(
                        ev.paths
                            .get(0)
                            .unwrap_or(&PathBuf::new())
                            .to_path_buf()
                            .to_owned(),
                        ev.paths[1..].to_vec(),
                    );
                }
                EventKind::Create(_) => {
                    println!("Create or Modify event");
                    println!("paths: {:?} ", ev.paths);
                    for p in &ev.paths {
                        touched.insert(
                            p.to_path_buf(),
                            Ev {
                                kind: ev.event.kind.clone(),
                            },
                        );
                    }
                }
                EventKind::Remove(_) => {
                    for p in &ev.paths {
                        touched.insert(
                            p.to_path_buf(),
                            Ev {
                                kind: ev.event.kind.clone(),
                            },
                        );
                    }
                }
                _ => {}
            }
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
