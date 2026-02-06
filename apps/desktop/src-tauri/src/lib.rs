mod commands;
mod config;
mod constants;
mod database;
mod file_watcher;
mod history;
mod tag_manager;
mod utils;
mod workspace;

use crate::config::user::{load_config, Theme, CONFIG_FILE};
use crate::file_watcher::FileWatcher;
use crate::utils::handle_file_associations;
use crate::workspace::Workspace;
use rusqlite::Connection;
use serde::Serialize;

use std::env;
use std::sync::{Arc, Mutex};
use tauri::{Manager, RunEvent, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

pub struct AppState {
    pub workspace: Mutex<Workspace>,
    pub file_watcher: Mutex<FileWatcher>,
    pub history: Mutex<history::History>,
    pub conn: Arc<Mutex<Connection>>,
}
#[derive(Debug, Clone, Serialize)]
pub struct FileNode {
    pub path: String,
    pub name: String,
    pub is_directory: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let path = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            let conn = database::init_database(&path.join("audexis.db"))?;
            let config_path = path.join(CONFIG_FILE);

            let user_config = load_config(&config_path);
            let theme = match user_config.theme {
                Theme::Light => "light",
                Theme::Dark => "dark",
            };
            let onboarding = user_config.onboarding;
            app.manage(AppState {
                workspace: Mutex::new(Workspace::new(&app.handle())),
                file_watcher: Mutex::new(FileWatcher::new(&app.handle())),
                history: Mutex::new(history::History::new(&app.handle())),
                conn: Arc::new(Mutex::new(conn)),
            });
            if let Ok(mut watcher) = app.state::<AppState>().file_watcher.lock() {
                let _ = watcher.watch_workspace();
            }

            let win_builder = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App(
                    format!(
                        "index.html?theme={}&onboarding={}",
                        theme,
                        onboarding.to_string()
                    )
                    .into(),
                ),
            )
            .title("Audexis")
            .min_inner_size(800.0, 600.0)
            .maximized(true)
            .visible(false);
            let win_builder = win_builder.maximized(true);
            #[cfg(target_os = "macos")]
            let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);
            let win_builder = win_builder.decorations(false);
            let window = win_builder.build().unwrap();

            window.show().unwrap();

            #[cfg(any(windows, target_os = "linux"))]
            {
                let mut files = Vec::new();
                for maybe_file in std::env::args().skip(1) {
                    if maybe_file.starts_with('-') {
                        continue;
                    }
                    if let Ok(url) = url::Url::parse(&maybe_file) {
                        if let Ok(path) = url.to_file_path() {
                            files.push(path);
                        }
                    } else {
                        files.push(PathBuf::from(maybe_file))
                    }
                }

                handle_file_associations(app.handle().clone(), files);
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::import_files::import_files,
            commands::get_workspace_files::get_workspace_files,
            commands::update_user_config::update_user_config,
            commands::import_image::import_image,
            commands::save_frame_changes::save_frame_changes,
            commands::remove_files::remove_files,
            commands::get_all_columns::get_all_columns,
            commands::open::open,
            commands::import_paths::import_paths,
            commands::open_default::open_default,
            commands::rename_files::rename_files,
            commands::check_update::check_update,
            commands::clean_up_file_names::clean_up_file_names,
            commands::update_app::update_app,
            commands::get_multi_frame_keys::get_multi_frame_keys,
            commands::undo::undo,
            commands::get_all_sidebar_items::get_all_sidebar_items,
            commands::redo::redo,
            commands::get_workspace_root::get_workspace_root,
            commands::get_folder_children::get_folder_children
        ])
        .build(tauri::generate_context!())
        .expect("Error while running Audexis")
        .run(|app_handle, event| {
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            {
                if let RunEvent::Opened { urls } = event {
                    let paths: Vec<std::path::PathBuf> = urls
                        .into_iter()
                        .filter_map(|url| url.to_file_path().ok())
                        .collect::<Vec<_>>();
                    handle_file_associations(app_handle.clone(), paths);
                }
            }
        });
}
