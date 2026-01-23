use crate::constants::FRAME_KEYS;
use crate::tag_manager::utils::FrameKey;
use tauri::command;

#[command]
pub fn get_multi_frame_keys() -> Vec<FrameKey> {
    let keys: Vec<FrameKey> = FRAME_KEYS
        .iter()
        .filter(|fk| fk.is_multi_valued())
        .cloned()
        .collect();
    keys
}
