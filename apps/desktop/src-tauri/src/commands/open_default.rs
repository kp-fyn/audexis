use tauri::{command, AppHandle};
use tauri_plugin_opener::OpenerExt;

#[command]
pub fn open_default(app_handle: AppHandle, path: &str) {
    let _ = app_handle.opener().open_path(path, None::<&str>);
}
