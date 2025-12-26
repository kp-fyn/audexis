use super::traits::{Formats, TagFormat};
use super::utils::{Changes, File, FrameKey, SerializableFile, SerializableTagValue, TagValue};
use super::TagManager;
use base64::Engine;
use std::collections::HashMap;
use std::path::PathBuf;
use uuid::Uuid;
pub trait TagBackend {
    fn read(&self, path: &PathBuf) -> Result<File, BackendError>;

    fn write_changes(&self, changes: &Changes) -> Vec<WriteResult>;
}

#[derive(Debug, Clone)]
pub struct DefaultBackend {
    manager: TagManager,
}

impl DefaultBackend {
    pub fn new() -> Self {
        Self {
            manager: TagManager::new(),
        }
    }

    fn resolve_format(&self, path: &PathBuf) -> Formats {
        self.manager.detect_tag_format(path)
    }

    fn resolve_release(&self, fmt: &Formats) -> Option<Box<dyn TagFormat>> {
        self.manager.get_release_class(fmt)
    }

    fn detect_all_formats(&self, path: &PathBuf, primary: &Formats) -> Vec<Formats> {
        use std::fs;
        let mut out: Vec<Formats> = vec![primary.clone()];
        if let Ok(buffer) = fs::read(path) {
            if buffer.len() >= 5 && &buffer[0..3] == b"ID3" {
                let v = match (buffer[3], buffer[4]) {
                    (2, 0) => Some(Formats::Id3v22),
                    (3, 0) => Some(Formats::Id3v23),
                    (4, 0) => Some(Formats::Id3v24),
                    _ => None,
                };
                if let Some(ver) = v {
                    if !out.contains(&ver) {
                        out.push(ver);
                    }
                }
            }

            if buffer.len() >= 128 {
                let tail = &buffer[buffer.len() - 128..];
                if &tail[0..3] == b"TAG" {
                    let ver = if tail[125] == 0 {
                        Formats::Id3v11
                    } else {
                        Formats::Id3v10
                    };
                    if !out.contains(&ver) {
                        out.push(ver);
                    }
                }
            }
        }
        out
    }
}

impl TagBackend for DefaultBackend {
    fn read(&self, path: &PathBuf) -> Result<File, BackendError> {
        let fmt = self.resolve_format(path);
        let release = self
            .resolve_release(&fmt)
            .ok_or_else(|| BackendError::UnsupportedFormat(fmt.clone()))?;
        let tag_map = release
            .get_tags(path)
            .map_err(|_| BackendError::ReadFailed(path.display().to_string()))?;
        let freeforms = release.get_freeforms(path).unwrap_or_default();
        let tag_formats = self.detect_all_formats(path, &fmt);
        Ok(File {
            id: Uuid::new_v4(),
            path: path.clone(),
            tags: tag_map,
            tag_format: fmt,
            tag_formats,
            freeforms,
        })
    }

    fn write_changes(&self, changes: &Changes) -> Vec<WriteResult> {
        let mut results = Vec::with_capacity(changes.paths.len());
        for path_str in &changes.paths {
            let path = PathBuf::from(path_str);
            let fmt = self.resolve_format(&path);
            let Some(release) = self.resolve_release(&fmt) else {
                results.push(WriteResult {
                    path: path_str.clone(),
                    status: WriteStatus::Unsupported,
                    diff: None,
                });
                continue;
            };
            let mut updated: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();
            for (k, vals) in &changes.tags {
                let mut out_vals: Vec<TagValue> = Vec::new();
                for v in vals {
                    match v {
                        super::utils::SerializableTagValue::Text(s) => {
                            out_vals.push(TagValue::Text(s.clone()))
                        }
                        super::utils::SerializableTagValue::Picture {
                            mime,
                            data_base64,
                            picture_type,
                            description,
                        } => {
                            if let Ok(data) =
                                base64::engine::general_purpose::STANDARD.decode(data_base64)
                            {
                                out_vals.push(TagValue::Picture {
                                    mime: mime.clone(),
                                    data,
                                    picture_type: *picture_type,
                                    description: description.clone(),
                                });
                            }
                        }
                        super::utils::SerializableTagValue::UserText(item) => {
                            out_vals.push(TagValue::UserText(item.clone()))
                        }
                        super::utils::SerializableTagValue::UserUrl(item) => {
                            out_vals.push(TagValue::UserUrl(item.clone()))
                        }
                    }
                }
                updated.insert(*k, out_vals);
            }
            let existing_tags = match release.get_tags(&path) {
                Ok(m) => m,
                Err(_) => HashMap::new(),
            };
            let mut diffs: Vec<TagDiff> = Vec::new();
            for (k, new_vals) in &updated {
                let old_vals = existing_tags.get(k).cloned();
                if old_vals.as_ref() != Some(new_vals) {
                    diffs.push(TagDiff::from_change(
                        *k,
                        old_vals.clone(),
                        Some(new_vals.clone()),
                    ));
                }
            }

            let write_res = release.write_tags(&path, updated);
            match write_res {
                Ok(_) => results.push(WriteResult {
                    path: path_str.clone(),
                    status: WriteStatus::Ok,
                    diff: if diffs.is_empty() { None } else { Some(diffs) },
                }),
                Err(_) => results.push(WriteResult {
                    path: path_str.clone(),
                    status: WriteStatus::Failed,
                    diff: if diffs.is_empty() { None } else { Some(diffs) },
                }),
            }
        }
        results
    }
}

#[derive(Debug, Clone)]
pub enum BackendError {
    UnsupportedFormat(Formats),
    ReadFailed(String),
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct WriteResult {
    pub path: String,
    pub status: WriteStatus,
    pub diff: Option<Vec<TagDiff>>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub enum WriteStatus {
    Ok,
    Failed,
    Unsupported,
    DryRun,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TagDiff {
    pub key: String,
    pub before: Option<Vec<SerializableTagValue>>,
    pub after: Option<Vec<SerializableTagValue>>,
}

impl TagDiff {
    fn from_change(
        key: FrameKey,
        before: Option<Vec<TagValue>>,
        after: Option<Vec<TagValue>>,
    ) -> Self {
        let key_str = key.to_string();
        let conv_vec = |opt_vec: Option<Vec<TagValue>>| -> Option<Vec<SerializableTagValue>> {
            opt_vec.map(|vec| {
                vec.into_iter()
                    .map(|v| match v {
                        TagValue::Text(s) => SerializableTagValue::Text(s),
                        TagValue::Picture {
                            mime,
                            data,
                            picture_type,
                            description,
                        } => SerializableTagValue::Picture {
                            mime,
                            data_base64: base64::engine::general_purpose::STANDARD.encode(data),
                            picture_type,
                            description,
                        },
                        TagValue::UserText(item) => SerializableTagValue::UserText(item),
                        TagValue::UserUrl(item) => SerializableTagValue::UserUrl(item),
                    })
                    .collect()
            })
        };
        TagDiff {
            key: key_str,
            before: conv_vec(before),
            after: conv_vec(after),
        }
    }
}

pub fn summarize(files: &[Result<File, BackendError>]) -> Vec<SerializableFile> {
    files
        .iter()
        .filter_map(|r| match r {
            Ok(f) => Some(SerializableFile::from(f.clone())),
            Err(_) => None,
        })
        .collect()
}
