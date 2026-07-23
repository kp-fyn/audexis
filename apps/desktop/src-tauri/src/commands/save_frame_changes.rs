use crate::history::{Action, Frames, HistoryActionType};
use crate::tag_manager::utils::{
    Changes, FrameChanges, FrameKey, SerializableFile, SerializableTagValue,
    SerializableTagValuesWrapper, TagValue, TagValuesWrapper,
};
use crate::utils::get_tags;

use crate::tag_manager::tag_backend::{DefaultBackend, TagBackend};
use crate::AppState;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{command, AppHandle, Emitter, State};

#[command]
pub async fn save_frame_changes(
    app_handle: AppHandle,
    frame_changes: FrameChanges,
    state: State<'_, AppState>,
) -> Result<(), ()> {
    let mut before_changes: HashMap<String, HashMap<FrameKey, Vec<SerializableTagValue>>> =
        HashMap::new();

    let current_files = get_tags(&state.db, frame_changes.paths.clone(), false).await;

    if current_files.is_err() {
        //come back later
        return Ok(());
    }

    let mut tag_map: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();
    let backend = DefaultBackend::new();
    let mut write_changes = Changes {
        paths: frame_changes.paths.clone(),
        tags: HashMap::new(),
    };

    for frame in &frame_changes.frames {
        let wrapped_values = SerializableTagValuesWrapper(frame.values.clone());
        let frame_values: Vec<TagValue> = wrapped_values.into();

        tag_map.insert(frame.key, frame_values);
    }
    for (k, vec_vals) in tag_map.into_iter() {
        // wrap tag values in wrapper to allow conversion
        let p = TagValuesWrapper(vec_vals);
        let ser_vals: Vec<SerializableTagValue> = p.into();

        write_changes.tags.insert(k, ser_vals);
    }

    backend.write_changes(&write_changes);

    return Ok(());
}
