mod audio_player;
mod commands;
mod database;
mod file_watcher;

use audio_player::AudioPlayer;
use database::Database;
use std::sync::{Arc, Mutex};
use tauri::{async_runtime, Manager};

pub struct AppState {
    pub audio_player: Arc<Mutex<AudioPlayer>>,
    pub db: Database,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let app_path = app.path().app_data_dir();
            if app_path.is_err() {
                panic!("No app path");
            }
            let app_path = app_path.unwrap();
            let db_path = app_path.join("audexis.db");
            let db = async_runtime::block_on(async {
                Database::init(&db_path)
                    .await
                    .expect("Database failed to initialize")
            });
            app.manage(AppState {
                db: db,
                audio_player: AudioPlayer::new(),
            });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::import_roots::import_roots,
            commands::set_library_roots::set_library_roots
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
