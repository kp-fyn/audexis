use super::traits::{Formats, TagFormat};
use super::utils::{Changes, File, FrameKey, SerializableTagValue, TagValue};
use super::TagManager;
use base64::Engine;
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use uuid::Uuid;
pub trait TagBackend {
    fn read(&self, path: &PathBuf) -> Result<File, BackendError>;

    fn write_changes(&self, changes: &Changes) -> Vec<BackendError>;
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
        use std::fs::File;
        use std::io::{Read, Seek, SeekFrom};

        let mut out: Vec<Formats> = vec![primary.clone()];

        let mut f = match File::open(path) {
            Ok(f) => f,
            Err(_) => return out,
        };

        const PREFIX_LEN: usize = 4096;
        let mut header = vec![0u8; PREFIX_LEN];
        let header_len = match f.read(&mut header) {
            Ok(n) => n,
            Err(_) => return out,
        };
        header.truncate(header_len);

        let push_unique = |out: &mut Vec<Formats>, fmt: Formats| {
            if !out.contains(&fmt) {
                out.push(fmt);
            }
        };

        if header.len() >= 4 {
            match &header[0..4] {
                b"fLaC" => push_unique(&mut out, Formats::Flac),
                b"OggS" => push_unique(&mut out, Formats::Ogg),
                b"RIFF" => push_unique(&mut out, Formats::Riff),
                _ => {}
            }
        }

        let is_itunes_mp4 = {
            let mut found = false;
            let mut i = 0usize;
            while i + 8 <= header.len() {
                let size =
                    u32::from_be_bytes([header[i], header[i + 1], header[i + 2], header[i + 3]])
                        as usize;
                let typ = &header[i + 4..i + 8];
                if typ == b"ftyp" {
                    if size >= 16 && i + 16 <= header.len() {
                        let major = &header[i + 8..i + 12];
                        let compat_start = i + 16;
                        let compat_end = (i + size).min(header.len());
                        let compat = if compat_start <= compat_end {
                            &header[compat_start..compat_end]
                        } else {
                            &[]
                        };

                        let is_known_brand = |b: &[u8]| {
                            matches!(
                                b,
                                b"M4A "
                                    | b"M4B "
                                    | b"M4V "
                                    | b"mp41"
                                    | b"mp42"
                                    | b"isom"
                                    | b"iso2"
                                    | b"qt  "
                            )
                        };

                        if is_known_brand(major) {
                            found = true;
                            break;
                        }

                        let mut j = 0usize;
                        while j + 4 <= compat.len() {
                            if is_known_brand(&compat[j..j + 4]) {
                                found = true;
                                break;
                            }
                            j += 4;
                        }
                    }
                    break;
                }

                if size >= 8 {
                    i = i.saturating_add(size);
                } else {
                    i += 1;
                }
            }
            found
        };

        if is_itunes_mp4 {
            push_unique(&mut out, Formats::Itunes);
        }

        if header.len() >= 5 && &header[0..3] == b"ID3" {
            match (header[3], header[4]) {
                (2, 0) => push_unique(&mut out, Formats::Id3v22),
                (3, 0) => push_unique(&mut out, Formats::Id3v23),
                (4, 0) => push_unique(&mut out, Formats::Id3v24),
                _ => {}
            }
        }

        if let Ok(meta) = f.metadata() {
            let len = meta.len();
            if len >= 128 {
                if f.seek(SeekFrom::End(-128)).is_ok() {
                    let mut tail = [0u8; 128];
                    if f.read_exact(&mut tail).is_ok() {
                        if &tail[0..3] == b"TAG" {
                            let ver = if tail[125] == 0 {
                                Formats::Id3v11
                            } else {
                                Formats::Id3v10
                            };
                            push_unique(&mut out, ver);
                        }
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
        println!("Detected format: {:?}", fmt);
        let release = self
            .resolve_release(&fmt)
            .ok_or_else(|| BackendError::UnsupportedFormat(fmt.clone()))?;
        let tag_map = release.get_tags(path)?;
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

    fn write_changes(&self, changes: &Changes) -> Vec<BackendError> {
        let mut results: Vec<BackendError> = Vec::new();
        for path_str in &changes.paths {
            let path = PathBuf::from(path_str);
            let fmt = self.resolve_format(&path);
            let Some(release) = self.resolve_release(&fmt) else {
                results.push(BackendError::WriteFailed(TagError {
                    path: path_str.clone(),
                    public_message: "Unsupported format".to_string(),
                    internal_message: "Could not resolve tag format for writing".to_string(),
                }));
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
            if write_res.is_err() {
                results.push(BackendError::WriteFailed(TagError {
                    path: path_str.clone(),
                    public_message: "Failed to write tags".to_string(),
                    internal_message: "An error occurred while writing tags".to_string(),
                }));
                continue;
            }
        }
        results
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum BackendError {
    UnsupportedFormat(Formats),
    ReadFailed(TagError),
    WriteFailed(TagError),
}
#[derive(Debug, Clone, Serialize)]
pub struct TagError {
    pub path: String,
    pub public_message: String,
    pub internal_message: String,
}

#[derive(Debug, Clone, Serialize)]
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
