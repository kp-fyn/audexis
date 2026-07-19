use crate::AppState;

use tauri::{command, State};

#[command]
pub fn request_playback(paths: Vec<String>, state: State<'_, AppState>) {
    let player: std::sync::MutexGuard<'_, crate::audio_player::AudioPlayer> =
        state.audio_player.lock().unwrap();
    player
        .queue
        .lock()
        .unwrap()
        .add(paths.get(0).unwrap().to_owned());
}
