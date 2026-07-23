mod audio_player;
mod commands;
mod config;
mod constants;
mod database;
mod file_watcher;
mod history;
mod tag_manager;
mod utils;

use crate::audio_player::AudioPlayer;
use crate::config::user::{load_config, Theme, CONFIG_FILE};
use crate::database::Database;
use crate::file_watcher::FileWatcher;
use crate::utils::handle_file_associations;

use serde::Serialize;
use tauri::{LogicalPosition, Position};

use std::env;
use std::sync::{Arc, Mutex};

use tauri::{
    async_runtime,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent, TitleBarStyle, WebviewUrl, WebviewWindowBuilder,
};

pub struct AppState {
    pub file_watcher: Mutex<FileWatcher>,
    pub history: Mutex<history::History>,
    pub audio_player: Arc<Mutex<AudioPlayer>>,
    pub db: Database,
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
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;
            TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|_app, event| match event.id.as_ref() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        } else {
                            #[cfg(target_os = "macos")]
                            {
                                let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
                            }
                            let path = app
                                .path()
                                .app_data_dir()
                                .expect("Failed to get app data directory");
                            let app_path = app.path().app_data_dir();
                            if app_path.is_err() {
                                return;
                            }
                            let app_path = app_path.unwrap();
                            let db_path = app_path.join("audexis.db");
                            let db = async_runtime::block_on(async {
                                Database::init(&db_path)
                                    .await
                                    .expect("Database failed to initialize")
                            });
                            let config_path = path.join(CONFIG_FILE);

                            let user_config = load_config(&config_path);
                            let theme = match user_config.theme {
                                Theme::Light => "light",
                                Theme::Dark => "dark",
                            };
                            let view = "folder";
                            let onboarding = user_config.onboarding;

                            app.manage(AppState {
                                file_watcher: Mutex::new(FileWatcher::new(&app)),
                                audio_player: AudioPlayer::new(),
                                history: Mutex::new(history::History::new(&app)),
                                db: db,
                            });
                            if let Ok(mut watcher) = app.state::<AppState>().file_watcher.lock() {
                                let _ = watcher.watch_workspace();
                            }
                            let win_builder = WebviewWindowBuilder::new(
                                app,
                                "main",
                                WebviewUrl::App(
                                    format!(
                                        "index.html?theme={}&onboarding={}&view={}",
                                        theme,
                                        onboarding.to_string(),
                                        view
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
                            let win_builder = win_builder.decorations(true);
                            let win_builder = win_builder
                                .traffic_light_position(LogicalPosition::new(16.0, 20.0));
                            let window = win_builder.build().unwrap();

                            window.show().unwrap();
                        }
                    }
                    _ => {}
                })
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;

            let path = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            let db_path = app.path().app_data_dir()?.join("audexis.db");
            println!("{}", db_path.to_str().unwrap());
            let db = async_runtime::block_on(async {
                Database::init(&db_path)
                    .await
                    .expect("Database failed to initialize")
            });
            let config_path = path.join(CONFIG_FILE);

            let user_config = load_config(&config_path);
            let theme = match user_config.theme {
                Theme::Light => "light",
                Theme::Dark => "dark",
            };
            let view = "folder";
            let onboarding = user_config.onboarding;

            let args: Vec<String> = std::env::args().collect();
            let is_autostart = args.contains(&"--autostart".to_string());
            if is_autostart == true {
                #[cfg(target_os = "macos")]
                {
                    let _ = app
                        .handle()
                        .set_activation_policy(tauri::ActivationPolicy::Accessory);
                }
            } else {
                #[cfg(target_os = "macos")]
                {
                    let _ = app
                        .handle()
                        .set_activation_policy(tauri::ActivationPolicy::Regular);
                }
            }

            app.manage(AppState {
                file_watcher: Mutex::new(FileWatcher::new(&app.handle())),
                history: Mutex::new(history::History::new(&app.handle())),
                audio_player: AudioPlayer::new(),
                db: db,
            });
            if let Ok(mut watcher) = app.state::<AppState>().file_watcher.lock() {
                let _ = watcher.watch_workspace();
            }
            if is_autostart {
                return Ok(());
            }
            // let win_builder = WebviewWindowBuilder::new(
            //     app,
            //     "main",
            //     WebviewUrl::App(
            //         format!(
            //             "index.html?theme={}&onboarding={}&view={}",
            //             theme,
            //             onboarding.to_string(),
            //             view
            //         )
            //         .into(),
            //     ),
            // )
            // .title("Audexis")
            // .min_inner_size(800.0, 600.0)
            // .maximized(true)
            // .visible(false);
            // let win_builder = win_builder.maximized(true);
            // #[cfg(target_os = "macos")]
            // let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);
            // let win_builder = win_builder.decorations(false);
            // let window = win_builder.build().unwrap();

            // window.show().unwrap();
            #[cfg(target_os = "windows")]
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
                        files.push(std::path::PathBuf::from(maybe_file))
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
            commands::request_playback::request_playback,
            commands::set_folder_config::set_folder_config,
            commands::save_frame_changes::save_frame_changes,
            commands::remove_files::remove_files,
            commands::get_all_columns::get_all_columns,
            commands::open::open,
            commands::get_folder_config::get_folder_config,
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
            commands::get_folder_children::get_folder_children,
            commands::request_file::request_file,
            commands::get_files::get_files
        ])
        .build(tauri::generate_context!())
        .expect("Error while running Audexis")
        .run(|app_handle, event| match event {
            RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
                #[cfg(target_os = "macos")]
                {
                    let _ = app_handle.set_activation_policy(tauri::ActivationPolicy::Accessory);
                }
            }
            #[cfg(any(target_os = "macos"))]
            RunEvent::Opened { urls } => {
                let paths: Vec<std::path::PathBuf> = urls
                    .into_iter()
                    .filter_map(|url| url.to_file_path().ok())
                    .collect::<Vec<_>>();
                handle_file_associations(app_handle.clone(), paths);
            }
            _ => {}
        });
}
