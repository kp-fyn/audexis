use crate::config::user::ViewMode;
use crate::history::{Action, Frames, HistoryActionType};
use crate::tag_manager::utils::{
    Changes, FrameChanges, FrameKey, SerializableFile, SerializableTagValue,
    SerializableTagValuesWrapper, TagValue, TagValuesWrapper,
};
use crate::utils::get_tags;
use base64::{engine::general_purpose as b64_gp, Engine as _};

use crate::tag_manager::tag_backend::{DefaultBackend, TagBackend};
use crate::AppState;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{command, AppHandle, Emitter, State};

use uuid::Uuid;

#[command]
pub async fn save_frame_changes(
    app_handle: AppHandle,
    frame_changes: FrameChanges,
    state: State<'_, AppState>,
) -> Result<(), ()> {
    let mut before_changes: HashMap<Uuid, HashMap<FrameKey, Vec<SerializableTagValue>>> =
        HashMap::new();

    if state.view_mode == ViewMode::Simple {
        frame_changes.paths.iter().for_each(|p| {
            let pb = PathBuf::from(p);
            let mut ws = state.workspace.lock().unwrap();
            let file = ws.get_file_by_path(&pb);

            if let Some(f) = file {
                let mut frame_map: HashMap<FrameKey, Vec<SerializableTagValue>> = HashMap::new();
                for frame in &frame_changes.frames {
                    let empty: Vec<TagValue> = Vec::new();
                    let old_val = f.tags.get(&frame.key).unwrap_or(&empty);
                    let wrapped_values: TagValuesWrapper = TagValuesWrapper(old_val.to_owned());
                    let existing_vals = wrapped_values.into();
                    frame_map.insert(frame.key, existing_vals);
                }
                before_changes.insert(f.id, frame_map);
            }
        });
        let mut tag_map: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();
        for frame in &frame_changes.frames {
            let wrapped_values = SerializableTagValuesWrapper(frame.values.clone());
            let frame_values: Vec<TagValue> = wrapped_values.into();

            tag_map.insert(frame.key, frame_values);
        }

        let backend = DefaultBackend::new();
        let mut write_changes = Changes {
            paths: frame_changes.paths.clone(),
            tags: HashMap::new(),
        };

        for (k, vec_vals) in tag_map.into_iter() {
            // wrap tag values in wrapper to allow conversion
            let p = TagValuesWrapper(vec_vals);
            let ser_vals: Vec<SerializableTagValue> = p.into();

            write_changes.tags.insert(k, ser_vals);
        }
        let res = backend.write_changes(&write_changes);
        {
            let mut history = state.history.lock().unwrap();

            let mut ws = state.workspace.lock().unwrap();
            history.add(Action {
                action_type: HistoryActionType::Tags({
                    let mut fc_map: HashMap<Uuid, Frames> = HashMap::new();
                    for p in &frame_changes.paths {
                        if let Some(file) = ws.files.iter().find(|f| f.path.to_string_lossy() == *p)
                        {
                            let before_map: HashMap<FrameKey, Vec<SerializableTagValue>> =
                                before_changes
                                    .get(&file.id)
                                    .cloned()
                                    .unwrap_or(HashMap::new());
                            let mut after_map: HashMap<FrameKey, Vec<SerializableTagValue>> =
                                HashMap::new();
                            for frame in &frame_changes.frames {
                                after_map.insert(frame.key, frame.values.clone());
                            }
                            fc_map.insert(
                                file.id,
                                Frames {
                                    before: before_map,
                                    after: after_map,
                                },
                            );
                        }
                    }
                    fc_map
                }),
            });
            for pth in &frame_changes.paths {
                ws.refresh_tags(&PathBuf::from(pth));
            }
            let serializable_files: Vec<SerializableFile> = ws
                .files
                .clone()
                .into_iter()
                .map(SerializableFile::from)
                .collect();
            let _ = app_handle.emit("workspace-updated", serializable_files);
        }
        if res.len() > 0 {
            app_handle.emit("error", res).unwrap();
        }
    } else {
        let current_files = get_tags(&state.db, frame_changes.paths).await;

        if current_files.is_err() {
            //come back later
            return Ok(());
        }
        let current_files = current_files.unwrap();

        let mut tag_map: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();
        for frame in frame_changes.frames {
            for value in &frame.values {}
        }
    }
    return Ok(());
}
