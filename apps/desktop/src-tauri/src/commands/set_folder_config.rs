use crate::config::folder;

use tauri::command;

#[command]
pub fn set_folder_config(config: folder::FolderConfig, path: &str) -> bool {
    let res = folder::save_folder_config(path, &config);
    if res.is_err() {
        false
    } else {
        true
    }
}
