mod audio_player;
mod commands;
mod database;
mod file_watcher;
pub mod utils;
use crate::utils::errors::DatabaseError;
use audio_player::AudioPlayer;
use database::Database;
use std::sync::{Arc, Mutex};
use tauri::{async_runtime, Manager};
pub mod tag_manager;
use crate::file_watcher::FileWatcher;

pub struct AppState {
    pub audio_player: Arc<Mutex<AudioPlayer>>,
    pub file_watcher: Mutex<FileWatcher>,
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
            let db_path = app_path.join("audexis_v1.db");
            let db = async_runtime::block_on(async {
                Database::init(&db_path)
                    .await
                    .expect("Database failed to initialize")
            });
            let fw = FileWatcher::new(&app.handle());
            if fw.is_err() {
                panic!("File watcher could not b created");
            }
            let fw = fw.unwrap();
            app.manage(AppState {
                db: db,
                file_watcher: Mutex::new(fw),
                audio_player: AudioPlayer::new(),
            });

            if let Ok(mut watcher) = app.state::<AppState>().file_watcher.lock() {
                async_runtime::block_on(async {
                    let res: Result<(), DatabaseError> = watcher.init().await;
                    let _ = res.inspect_err(|e| println!("{:?}", e));
                    println!("hi");
                });
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::import_roots::import_roots,
            commands::set_library_roots::set_library_roots,
            commands::get_files::get_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
