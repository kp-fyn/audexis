use crate::history::{Action, Frames, HistoryActionType};
use crate::tag_manager::utils::{
    Changes, FrameChanges, FrameKey, SerializableFile, SerializableTagValue, TagValue,
};
use base64::{engine::general_purpose as b64_gp, Engine as _};

use crate::tag_manager::tag_backend::{DefaultBackend, TagBackend};
use crate::AppState;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{command, AppHandle, Emitter, State};

use uuid::Uuid;

#[command]
pub fn save_frame_changes(
    app_handle: AppHandle,
    frame_changes: FrameChanges,
    state: State<'_, AppState>,
) {
    let mut before_changes: HashMap<Uuid, HashMap<FrameKey, Vec<SerializableTagValue>>> =
        HashMap::new();
    frame_changes.paths.iter().for_each(|p| {
        let pb = PathBuf::from(p);
        let mut ws = state.workspace.lock().unwrap();
        let file = ws.get_file_by_path(&pb);
        if let Some(f) = file {
            let mut frame_map: HashMap<FrameKey, Vec<SerializableTagValue>> = HashMap::new();
            for frame in &frame_changes.frames {
                let existing_vals = f
                    .tags
                    .get(&frame.key)
                    .unwrap_or(&Vec::new())
                    .iter()
                    .map(|v| match v {
                        TagValue::Text(s) => SerializableTagValue::Text(s.clone()),
                        TagValue::Picture {
                            mime,
                            data,
                            picture_type,
                            description,
                        } => SerializableTagValue::Picture {
                            mime: mime.clone(),
                            data_base64: b64_gp::STANDARD.encode(&data),
                            picture_type: *picture_type,
                            description: description.clone(),
                        },
                        TagValue::UserText(ut) => SerializableTagValue::UserText(ut.clone()),
                        TagValue::UserUrl(uu) => SerializableTagValue::UserUrl(uu.clone()),
                        TagValue::Comment {
                            encoding,
                            language,
                            description,
                            text,
                        } => SerializableTagValue::Comment {
                            encoding: encoding.clone(),
                            language: language.clone(),
                            description: description.clone(),
                            text: text.clone(),
                        },
                    })
                    .collect::<Vec<SerializableTagValue>>();
                frame_map.insert(frame.key, existing_vals);
            }
            before_changes.insert(f.id, frame_map);
        }
    });
    let mut tag_map: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();
    for frame in &frame_changes.frames {
        for val in &frame.values {
            match val {
                SerializableTagValue::Text(t) => {
                    tag_map
                        .entry(frame.key)
                        .or_default()
                        .push(TagValue::Text(t.clone()));
                }
                SerializableTagValue::Picture {
                    mime,
                    data_base64,
                    picture_type,
                    description,
                } => {
                    if let Ok(data) = base64::engine::general_purpose::STANDARD.decode(data_base64)
                    {
                        tag_map
                            .entry(frame.key)
                            .or_default()
                            .push(TagValue::Picture {
                                mime: mime.clone(),
                                data,
                                picture_type: *picture_type,
                                description: description.clone(),
                            });
                    }
                }
                SerializableTagValue::UserText(entry) => {
                    tag_map
                        .entry(frame.key)
                        .or_default()
                        .push(TagValue::UserText(entry.clone()));
                }
                SerializableTagValue::UserUrl(entry) => {
                    tag_map
                        .entry(frame.key)
                        .or_default()
                        .push(TagValue::UserUrl(entry.clone()));
                }
                SerializableTagValue::Comment {
                    encoding,
                    language,
                    description,
                    text,
                } => {
                    tag_map
                        .entry(frame.key)
                        .or_default()
                        .push(TagValue::Comment {
                            encoding: encoding.clone(),
                            language: language.clone(),
                            description: description.clone(),
                            text: text.clone(),
                        });
                }
            }
        }
    }

    let backend = DefaultBackend::new();
    let mut write_changes = Changes {
        paths: frame_changes.paths.clone(),
        tags: HashMap::new(),
    };

    for (k, vec_vals) in tag_map.into_iter() {
        let ser_vals: Vec<SerializableTagValue> = vec_vals
            .into_iter()
            .map(|v| match v {
                TagValue::Text(s) => SerializableTagValue::Text(s),
                TagValue::Picture {
                    mime,
                    data,
                    picture_type,
                    description,
                } => SerializableTagValue::Picture {
                    mime,
                    data_base64: base64::engine::general_purpose::STANDARD.encode(&data),
                    picture_type,
                    description,
                },
                TagValue::UserText(ut) => SerializableTagValue::UserText(ut),
                TagValue::UserUrl(uu) => SerializableTagValue::UserUrl(uu),
                TagValue::Comment {
                    encoding,
                    language,
                    description,
                    text,
                } => SerializableTagValue::Comment {
                    encoding,
                    language,
                    description,
                    text,
                },
            })
            .collect();
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
                    if let Some(file) = ws.files.iter().find(|f| f.path.to_string_lossy() == *p) {
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
        for p in &frame_changes.paths {
            ws.refresh_tags(&PathBuf::from(p));
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
}
