use crate::config::user::{get_config_path, load_config, save_config};
use tauri::command;
use tauri_plugin_updater::UpdaterExt;
#[command]
pub async fn update_app(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    println!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    println!("download finished");
                },
            )
            .await?;
        let user_config_path = get_config_path(&app);
        let mut user_config = load_config(&user_config_path);
        user_config.just_updated = true;

        let _ = save_config(&user_config_path, &user_config);
        app.restart();
    }

    Ok(())
}
