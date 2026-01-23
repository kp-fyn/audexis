use crate::config::user::{get_config_path, load_config, save_config, PartialUserConfig};

use tauri::{command, AppHandle, Emitter};

#[command]
pub fn update_user_config(patch: PartialUserConfig, app_handle: AppHandle) -> Result<(), String> {
    let path = get_config_path(&app_handle);
    let mut config = load_config(&path);

    if let Some(theme) = patch.theme {
        config.theme = theme;
    }
    if let Some(view) = patch.view {
        config.view = view;
    }
    if let Some(albums) = patch.albums {
        config.albums = albums;
    }
    if let Some(columns) = patch.columns {
        config.columns = columns;
    }
    if let Some(density) = patch.density {
        config.density = density;
    }
    if let Some(sidebar_items) = patch.sidebar_items {
        config.sidebar_items = sidebar_items;
    }
    if let Some(onboarding) = patch.onboarding {
        config.onboarding = onboarding;
    }
    if let Some(show_diff_modal) = patch.show_diff_modal {
        config.show_diff_modal = show_diff_modal;
    }

    save_config(&path, &config).map_err(|e| format!("Save failed: {}", e))?;
    app_handle.emit("user-config-updated", config).unwrap();
    Ok(())
}
