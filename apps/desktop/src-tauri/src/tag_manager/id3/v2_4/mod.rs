use crate::tag_manager::id3::utils::{id3v24_raw_to_tags, id3v24_tags_to_raw};
use crate::tag_manager::id3::v2_3::utils::{
    create_header_with_version, encode_text_payload, to_synchsafe,
};
use crate::tag_manager::traits::TagFormat;
use crate::tag_manager::utils::{FrameKey, TagValue, UserTextEntry, UserUrlEntry};
use std::collections::HashMap;
use std::fs::{File, OpenOptions};
use std::io::Read;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct V2_4 {}

fn from_synchsafe(bytes: [u8; 4]) -> usize {
    ((bytes[0] as usize) << 21)
        | ((bytes[1] as usize) << 14)
        | ((bytes[2] as usize) << 7)
        | (bytes[3] as usize)
}

fn frame_from_synchsafe(bytes: [u8; 4]) -> usize {
    from_synchsafe(bytes)
}

fn frame_to_synchsafe(size: usize) -> [u8; 4] {
    to_synchsafe(size as u32)
}

fn build_frame_v24(id: &str, payload: &[u8]) -> Vec<u8> {
    let mut frame = Vec::with_capacity(10 + payload.len());
    frame.extend_from_slice(id.as_bytes());
    frame.extend_from_slice(&frame_to_synchsafe(payload.len()));
    frame.extend_from_slice(&[0x00, 0x00]);
    frame.extend_from_slice(payload);
    frame
}

impl TagFormat for V2_4 {
    fn new() -> Self {
        Self {}
    }
    fn get_tags(&self, file_path: &PathBuf) -> std::io::Result<HashMap<FrameKey, Vec<TagValue>>> {
        let mut file = File::open(file_path)?;
        let mut header = [0u8; 10];
        if file.read_exact(&mut header).is_err() {
            return Ok(HashMap::new());
        }
        if &header[0..3] != b"ID3" || header[3] != 4 {
            return Ok(HashMap::new());
        }
        let tag_size = from_synchsafe([header[6], header[7], header[8], header[9]]);
        let mut tag_data = vec![0u8; tag_size];
        file.read_exact(&mut tag_data)?;
        let mut pos = 0usize;
        let mut raw: HashMap<String, Vec<TagValue>> = HashMap::new();
        while pos + 10 <= tag_data.len() {
            let id_bytes = &tag_data[pos..pos + 4];
            if id_bytes.iter().all(|b| *b == 0) {
                break;
            }
            let id = match std::str::from_utf8(id_bytes) {
                Ok(s) if s.trim().is_empty() => break,
                Ok(s) => s.to_string(),
                Err(_) => break,
            };
            let size = frame_from_synchsafe([
                tag_data[pos + 4],
                tag_data[pos + 5],
                tag_data[pos + 6],
                tag_data[pos + 7],
            ]);
            let _flags = &tag_data[pos + 8..pos + 10];
            if size == 0 || pos + 10 + size > tag_data.len() {
                break;
            }
            let content = &tag_data[pos + 10..pos + 10 + size];
            if id == "TXXX" || id == "WXXX" {
                if !content.is_empty() {
                    let encoding = content[0];
                    let rest = &content[1..];
                    let desc_end = rest.iter().position(|&b| b == 0x00).unwrap_or(rest.len());
                    let (desc_bytes, _ignored_split) = rest.split_at(desc_end);
                    let value_bytes = if desc_end < rest.len() {
                        &rest[desc_end + 1..]
                    } else {
                        &[]
                    };
                    let decode = |bytes: &[u8]| match encoding {
                        0x00 => String::from_utf8_lossy(bytes).to_string(),
                        0x01 => {
                            if bytes.starts_with(&[0xFF, 0xFE]) {
                                String::from_utf16_lossy(
                                    &bytes[2..]
                                        .chunks(2)
                                        .filter(|c| c.len() == 2)
                                        .map(|c| u16::from_le_bytes([c[0], c[1]]))
                                        .collect::<Vec<_>>(),
                                )
                            } else {
                                String::from_utf8_lossy(bytes).to_string()
                            }
                        }
                        _ => String::from_utf8_lossy(bytes).to_string(),
                    };
                    let description = decode(desc_bytes);
                    let value = decode(value_bytes);
                    let entry = if id == "TXXX" {
                        TagValue::UserText(UserTextEntry { description, value })
                    } else {
                        TagValue::UserUrl(UserUrlEntry {
                            description,
                            url: value,
                        })
                    };
                    raw.entry(id).or_default().push(entry);
                }
            } else if id.starts_with('T') || id.starts_with('W') {
                if !content.is_empty() {
                    let encoding = content[0];
                    let text = match encoding {
                        0x00 => String::from_utf8_lossy(&content[1..]).to_string(),
                        0x01 => {
                            if content[1..].starts_with(&[0xFF, 0xFE]) {
                                String::from_utf16_lossy(
                                    &content[3..]
                                        .chunks(2)
                                        .filter(|c| c.len() == 2)
                                        .map(|c| u16::from_le_bytes([c[0], c[1]]))
                                        .collect::<Vec<_>>(),
                                )
                            } else {
                                "<Unsupported UTF-16>".to_string()
                            }
                        }
                        _ => "<Unknown Encoding>".to_string(),
                    };
                    if (id == "TPE1" || id == "TCON") && text.contains('\u{0}') {
                        for part in text.split('\u{0}') {
                            let seg = part.trim();
                            if !seg.is_empty() {
                                raw.entry(id.clone())
                                    .or_default()
                                    .push(TagValue::Text(seg.to_string()));
                            }
                        }
                    } else {
                        raw.entry(id).or_default().push(TagValue::Text(text));
                    }
                }
            } else if id == "APIC" && !content.is_empty() {
                let _encoding = content[0];
                if let Some(mime_null_rel) = content[1..].iter().position(|&b| b == 0x00) {
                    let mime_start = 1usize;
                    let mime_end = 1 + mime_null_rel;
                    let mime_type =
                        String::from_utf8_lossy(&content[mime_start..mime_end]).to_string();
                    let pic_type_index = mime_end + 1;
                    if pic_type_index >= content.len() {
                        break;
                    }
                    let picture_type = content[pic_type_index];
                    let description_start = pic_type_index + 1;
                    let description_end = content[description_start..]
                        .iter()
                        .position(|&b| b == 0x00)
                        .map_or(content.len(), |p| description_start + p);
                    let description = if description_end > description_start {
                        Some(
                            String::from_utf8_lossy(&content[description_start..description_end])
                                .to_string(),
                        )
                    } else {
                        None
                    };
                    let image_data =
                        if description_end < content.len() && description_end + 1 < content.len() {
                            &content[description_end + 1..]
                        } else {
                            &[]
                        };
                    raw.entry(id).or_default().push(TagValue::Picture {
                        mime: mime_type,
                        data: image_data.to_vec(),
                        picture_type: Some(picture_type),
                        description,
                    });
                }
            }
            pos += 10 + size;
        }
        Ok(id3v24_raw_to_tags(&raw))
    }
    fn write_tags(
        &self,
        file_path: &PathBuf,
        updated: HashMap<FrameKey, Vec<TagValue>>,
    ) -> Result<(), ()> {
        use std::io::{Read, Seek, SeekFrom, Write};
        let mut file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(file_path)
            .map_err(|_| ())?;
        let mut header = [0u8; 10];
        file.read_exact(&mut header).map_err(|_| ())?;
        if &header[0..3] != b"ID3" || header[3] != 4 {
            return Err(());
        }
        let tag_size = from_synchsafe([header[6], header[7], header[8], header[9]]);
        let mut tag_data = vec![0u8; tag_size];
        file.read_exact(&mut tag_data).map_err(|_| ())?;
        let mut pos = 0usize;
        let mut raw_frames: Vec<(String, Vec<u8>)> = Vec::new();
        while pos + 10 <= tag_data.len() {
            let id_bytes = &tag_data[pos..pos + 4];
            if id_bytes.iter().all(|b| *b == 0) {
                break;
            }
            let id = match std::str::from_utf8(id_bytes) {
                Ok(s) if s.trim().is_empty() => break,
                Ok(s) => s.to_string(),
                Err(_) => break,
            };
            let size = frame_from_synchsafe([
                tag_data[pos + 4],
                tag_data[pos + 5],
                tag_data[pos + 6],
                tag_data[pos + 7],
            ]);
            if size == 0 || pos + 10 + size > tag_data.len() {
                break;
            }
            let content = &tag_data[pos + 10..pos + 10 + size];
            raw_frames.push((id, content.to_vec()));
            pos += 10 + size;
        }
        let mut pictures: Vec<(FrameKey, Vec<TagValue>)> = Vec::new();
        let mut non_picture: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();
        for (k, vals) in updated.into_iter() {
            if k == FrameKey::AttachedPicture {
                pictures.push((k, vals));
            } else {
                non_picture.insert(k, vals);
            }
        }

        let mut flattened: HashMap<FrameKey, TagValue> = HashMap::new();
        for (k, vals) in non_picture.into_iter() {
            if vals.is_empty() {
                continue;
            }
            if matches!(vals[0], TagValue::Text(_)) && vals.len() > 1 {
                let joined = vals
                    .iter()
                    .filter_map(|v| match v {
                        TagValue::Text(s) => Some(s.clone()),
                        _ => None,
                    })
                    .collect::<Vec<_>>()
                    .join("\u{0}");
                flattened.insert(k, TagValue::Text(joined));
            } else {
                flattened.insert(k, vals[0].clone());
            }
        }
        let raw_updates = id3v24_tags_to_raw(&flattened);
        let mut updated_keys: Vec<String> = raw_updates.keys().map(|k| k.to_string()).collect();
        if !pictures.is_empty() {
            updated_keys.push("APIC".to_string());
        }
        raw_frames.retain(|(id, _)| !updated_keys.iter().any(|k| k == id));

        for (k, v) in raw_updates {
            match v {
                TagValue::Text(t) => {
                    if !t.is_empty() {
                        if k == "TXXX" || k == "WXXX" {
                            let (desc, val) = match t.split_once('=') {
                                Some((d, v)) => (d.to_string(), v.to_string()),
                                None => (String::new(), t.clone()),
                            };
                            let mut payload = Vec::new();
                            payload.push(0x00);
                            payload.extend_from_slice(desc.as_bytes());
                            payload.push(0x00);
                            payload.extend_from_slice(val.as_bytes());
                            raw_frames.push((k.to_string(), payload));
                        } else {
                            let encoded = encode_text_payload(&t, false);
                            raw_frames.push((k.to_string(), encoded));
                        }
                    }
                }
                TagValue::Picture {
                    mime,
                    data,
                    picture_type,
                    description,
                } => {
                    let encoded = crate::tag_manager::id3::v2_3::utils::encode_img_payload(
                        &mime,
                        picture_type.unwrap_or(3),
                        description.as_deref().unwrap_or(""),
                        &data,
                    );
                    raw_frames.push((k.to_string(), encoded));
                }
                TagValue::UserText(ut) => {
                    let mut payload = Vec::new();
                    payload.push(0x00);
                    payload.extend_from_slice(ut.description.as_bytes());
                    payload.push(0x00);
                    payload.extend_from_slice(ut.value.as_bytes());
                    raw_frames.push((k.to_string(), payload));
                }
                TagValue::UserUrl(uu) => {
                    let mut payload = Vec::new();
                    payload.push(0x00);
                    payload.extend_from_slice(uu.description.as_bytes());
                    payload.push(0x00);
                    payload.extend_from_slice(uu.url.as_bytes());
                    raw_frames.push((k.to_string(), payload));
                }
            }
        }
        for (_k, vals) in pictures.into_iter() {
            for v in vals {
                if let TagValue::Picture {
                    mime,
                    data,
                    picture_type,
                    description,
                } = v
                {
                    let encoded = crate::tag_manager::id3::v2_3::utils::encode_img_payload(
                        &mime,
                        picture_type.unwrap_or(3),
                        description.as_deref().unwrap_or(""),
                        &data,
                    );
                    raw_frames.push(("APIC".to_string(), encoded));
                }
            }
        }
        let frames_vec = raw_frames
            .iter()
            .map(|(id, content)| build_frame_v24(id, content))
            .collect::<Vec<_>>();
        let total_size: usize = frames_vec.iter().map(|f| f.len()).sum();
        let header_new = create_header_with_version(4, total_size);
        let mut id3_tag = Vec::with_capacity(10 + total_size);
        id3_tag.extend_from_slice(&header_new);
        for fr in frames_vec {
            id3_tag.extend_from_slice(&fr);
        }
        let mut audio_data = Vec::new();
        file.read_to_end(&mut audio_data).map_err(|_| ())?;
        file.seek(SeekFrom::Start(0)).map_err(|_| ())?;
        file.set_len(0).map_err(|_| ())?;
        file.write_all(&id3_tag).map_err(|_| ())?;
        file.write_all(&audio_data).map_err(|_| ())?;
        file.flush().map_err(|_| ())?;
        Ok(())
    }
}
