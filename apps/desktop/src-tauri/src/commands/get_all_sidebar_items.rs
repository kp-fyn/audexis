use crate::config::user;
use crate::constants::FRAME_KEYS;
use crate::utils::to_label;
use tauri::command;

#[command]
pub fn get_all_sidebar_items() -> Vec<user::SidebarItem> {
    let mut sidebar_items: Vec<user::SidebarItem> = Vec::new();

    for frame_key in FRAME_KEYS {
        sidebar_items.push(user::SidebarItem {
            label: to_label(&frame_key.to_string()),
            value: frame_key.clone(),
            item_type: frame_key.get_kind(),
        });
    }
    sidebar_items
}
