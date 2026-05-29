use crate::config::folder;
use tauri::command;

#[command]
pub fn get_folder_config(path: &str) -> folder::FolderConfig {
    let config = folder::get_folder_config(path).unwrap_or_default();
    println!("Returning config for {}: {:?}", path, config);
    config
}
