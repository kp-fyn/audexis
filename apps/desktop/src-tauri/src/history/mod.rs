use crate::tag_manager::tag_backend::{DefaultBackend, TagBackend};
use crate::tag_manager::utils::Changes;
use crate::tag_manager::utils::{FrameKey, SerializableTagValue};
use crate::AppState;
use serde::Serialize;
use std::collections::HashMap;
use tauri::State;
use tauri::{AppHandle, Emitter};
use uuid::Uuid;
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryUpdate {
    pub can_undo: bool,
    pub can_redo: bool,
}
pub struct History {
    pub changes: Vec<Action>,
    pub app_handle: AppHandle,
    pub cursor: isize,
}

pub struct Frames {
    pub before: HashMap<FrameKey, Vec<SerializableTagValue>>,
    pub after: HashMap<FrameKey, Vec<SerializableTagValue>>,
}
pub enum HistoryActionType {
    Tags(HashMap<Uuid, Frames>),
}

impl HistoryActionType {
    pub fn apply(&self, app: &State<'_, AppState>, is_undo: bool) {
        match self {
            HistoryActionType::Tags(fc) => {
                let ws = app.workspace.lock().unwrap();

                fc.iter().for_each(|(id, fc)| {
                    let file = ws.get_file(*id);
                    if file.is_none() {
                        return;
                    }
                    let file = file.unwrap();
                    let frames = if is_undo {
                        fc.before.clone()
                    } else {
                        fc.after.clone()
                    };
                    println!("{:?}", frames);
                    let backend = DefaultBackend::new();
                    backend.write_changes(&Changes {
                        tags: frames,
                        paths: vec![file.path.to_string_lossy().to_string()],
                    });
                });
            }
        }
    }
}
pub struct Action {
    pub action_type: HistoryActionType,
}

impl Action {
    pub fn undo(&self, app: &State<'_, AppState>) {
        self.action_type.apply(app, true);
    }

    pub fn redo(&self, app: &State<'_, AppState>) {
        self.action_type.apply(app, false);
    }
}
impl History {
    pub fn new(app: &AppHandle) -> Self {
        Self {
            app_handle: app.clone(),
            changes: Vec::new(),
            cursor: -1,
        }
    }
    pub fn clear(&mut self) {
        self.changes.clear();
        self.cursor = -1;
        let payload = HistoryUpdate {
            can_redo: (self.cursor + 1) <= self.changes.len() as isize - 1,
            can_undo: self.cursor >= 0,
        };
        let _ = self.app_handle.emit("history_update", payload);
    }
    pub fn add(&mut self, change: Action) {
        if (self.cursor) < self.changes.len() as isize - 1 {
            self.changes.truncate((self.cursor + 1) as usize);
        }

        self.changes.push(change);

        self.cursor = self.changes.len() as isize - 1;
        let payload = HistoryUpdate {
            can_redo: (self.cursor + 1) <= self.changes.len() as isize - 1,
            can_undo: self.cursor >= 0,
        };
        let _ = self.app_handle.emit("history_update", payload);
    }
    pub fn undo(&mut self, app: &State<'_, AppState>) {
        if self.cursor >= 0 {
            let action = &self.changes[self.cursor as usize];
            action.undo(app);
            self.cursor -= 1;
            let payload = HistoryUpdate {
                can_redo: (self.cursor + 1) <= self.changes.len() as isize - 1,
                can_undo: self.cursor >= 0,
            };
            let _ = self.app_handle.emit("history_update", payload);
        }
    }
    pub fn redo(&mut self, app: &State<'_, AppState>) {
        if (self.cursor + 1) <= self.changes.len() as isize - 1 {
            self.cursor += 1;
            let action = &self.changes[self.cursor as usize];
            action.redo(app);
            let payload = HistoryUpdate {
                can_redo: (self.cursor + 1) <= self.changes.len() as isize - 1,
                can_undo: self.cursor >= 0,
            };
            let _ = self.app_handle.emit("history_update", payload);
        }
    }
}
