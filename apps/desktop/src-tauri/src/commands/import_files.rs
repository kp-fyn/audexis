use crate::tag_manager::tag_backend::BackendError;
use crate::tag_manager::utils::SerializableFile;
use crate::AppState;
use rfd::FileDialog;
use std::env;
use std::path::PathBuf;
use tauri::{command, AppHandle, Emitter, State};
#[command]
pub fn import_files(app_handle: AppHandle, file_type: &str, state: State<'_, AppState>) {
    let home_dir: String = match env::home_dir() {
        Some(fp) => String::from(fp.to_string_lossy()),
        None => ".".to_owned(),
    };
    const SUPPORTED_EXTENSIONS: [&str; 15] = [
        "m4a", "mp4", "qt", "m4b", "m4v", "mov", "ogg", "opus", "oga", "spx", "ogv", "mp3", "mp2",
        "mp1", "flac",
    ];
    let mut errs: Vec<BackendError> = vec![];
    let selections: Vec<PathBuf> = if file_type == "file" {
        FileDialog::new()
            .set_title("Select files or folders")
            .set_directory(home_dir.clone())
            .add_filter("Audio Files", &SUPPORTED_EXTENSIONS)
            .pick_files()
            .unwrap_or_default()
            .into_iter()
            .map(Into::into)
            .collect()
    } else {
        FileDialog::new()
            .set_title("Select files or folders")
            .set_directory(home_dir)
            .add_filter("Audio Files", &SUPPORTED_EXTENSIONS)
            .pick_folders()
            .unwrap_or_default()
            .into_iter()
            .map(Into::into)
            .collect()
    };
    if selections.is_empty() {
        return;
    }

    {
        let mut ws = state.workspace.lock().unwrap();
        for path in &selections {
            let r = ws.import(path.clone());
            if r.is_err() {
                errs.push(r.err().unwrap());
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
    if errs.len() > 0 {
        println!("import errors: {:?}", errs);
        app_handle.emit("error", errs).unwrap();
    }
    app_handle
        .emit("workspace-updated", serializable_files)
        .unwrap();

    if let Ok(mut watcher) = state.file_watcher.lock() {
        let _ = watcher.watch_workspace();
    }
}
