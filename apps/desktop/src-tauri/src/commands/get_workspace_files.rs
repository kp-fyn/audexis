use crate::config::user::{get_config_path, load_config, save_config};
use crate::tag_manager::utils::SerializableFile;
use crate::AppState;
use tauri::{command, AppHandle, Emitter, State};

#[command]
pub fn get_workspace_files(app_handle: AppHandle, state: State<'_, AppState>) {
    let ws = state.workspace.lock().unwrap();
    let serializable_files: Vec<SerializableFile> = ws
        .files
        .clone()
        .into_iter()
        .map(SerializableFile::from)
        .collect();
    let path = get_config_path(&app_handle);
    let user_config = load_config(&path);

    app_handle
        .emit("workspace-updated", serializable_files)
        .unwrap();
    app_handle
        .emit("user-config-updated", &user_config)
        .unwrap();
    if user_config.just_updated {
        let user_config_path = get_config_path(&app_handle);
        let mut config = user_config.clone();
        config.just_updated = false;
        let _ = save_config(&user_config_path, &config);
    }
}
