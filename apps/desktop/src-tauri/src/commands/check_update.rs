use tauri::command;
use tauri_plugin_updater::UpdaterExt;
#[command]
pub async fn check_update(app: tauri::AppHandle) -> Option<u8> {
    let updater = app.updater();
    if updater.is_err() {
        return Some(0);
    }
    let updater = updater.unwrap();

    if let Ok(update) = updater.check().await {
        if update.is_some() {
            return Some(1);
        } else {
            return Some(0);
        }
    } else {
        return Some(0);
    }
}
