use crate::AppState;

use tauri::{command, State};

#[command]
pub fn request_playback(paths: Vec<String>, state: State<'_, AppState>) {
    let player = state.audio_player.lock().unwrap();
    player.play(paths.get(0).unwrap().to_owned());
}
