use crate::tag_manager::id3::utils::{id3v22_raw_to_tags, id3v22_tags_to_raw};
use crate::tag_manager::id3::v2_3::utils::{create_header_with_version, encode_text_payload};
use crate::tag_manager::traits::TagFormat;
use crate::tag_manager::utils::{FrameKey, TagValue};
use std::collections::HashMap;
use std::fs::{File, OpenOptions};
use std::io::Read;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct V2_2 {}

impl V2_2 {
    fn frame_size(bytes: &[u8]) -> usize {
        ((bytes[0] as usize) << 16) | ((bytes[1] as usize) << 8) | (bytes[2] as usize)
    }
}

impl TagFormat for V2_2 {
    fn new() -> Self {
        Self {}
    }

    fn get_tags(&self, file_path: &PathBuf) -> std::io::Result<HashMap<FrameKey, TagValue>> {
        let mut file = File::open(file_path)?;
        let mut header = [0u8; 10];
        if file.read_exact(&mut header).is_err() {
            return Ok(HashMap::new());
        }
        if &header[0..3] != b"ID3" || header[3] != 2 {
            return Ok(HashMap::new());
        }
        let tag_size = ((header[6] as usize) << 21)
            | ((header[7] as usize) << 14)
            | ((header[8] as usize) << 7)
            | (header[9] as usize);
        let mut tag_data = vec![0u8; tag_size];
        file.read_exact(&mut tag_data)?;
        let mut pos = 0usize;
        let mut raw: HashMap<String, TagValue> = HashMap::new();
        while pos + 6 <= tag_data.len() {
            let id_bytes = &tag_data[pos..pos + 3];
            if id_bytes.iter().all(|b| *b == 0) {
                break;
            }
            let id = match std::str::from_utf8(id_bytes) {
                Ok(s) if s.trim().is_empty() => break,
                Ok(s) => s.to_string(),
                Err(_) => break,
            };
            let size = V2_2::frame_size(&tag_data[pos + 3..pos + 6]);
            if size == 0 || pos + 6 + size > tag_data.len() {
                break;
            }
            let content = &tag_data[pos + 6..pos + 6 + size];
            if id.starts_with('T') || id.starts_with('W') {
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
                    raw.insert(id, TagValue::Text(text));
                }
            } else if id == "PIC" && content.len() > 4 {
                // let encoding = content[0];
                let image_format = &content[1..4];
                let mut idx = 4;
                if idx >= content.len() {
                    break;
                }
                // let picture_type = content[idx];
                idx += 1;
                if idx >= content.len() {
                    break;
                }
                let desc_end = content[idx..]
                    .iter()
                    .position(|&b| b == 0x00)
                    .map(|o| idx + o)
                    .unwrap_or(idx);
                let image_data_start = if desc_end < content.len() {
                    desc_end + 1
                } else {
                    desc_end
                };
                let image_data = &content[image_data_start..];
                let mime = match std::str::from_utf8(image_format) {
                    Ok(f) => match f {
                        "PNG" => "image/png",
                        "JPG" | "JPEG" => "image/jpeg",
                        _ => "application/octet-stream",
                    }
                    .to_string(),
                    Err(_) => "application/octet-stream".to_string(),
                };
                raw.insert(
                    id,
                    TagValue::Picture {
                        mime,
                        data: image_data.to_vec(),
                    },
                );
            }
            pos += 6 + size;
        }
        Ok(id3v22_raw_to_tags(&raw))
    }

    fn write_tags(
        &self,
        file_path: &PathBuf,
        updated: HashMap<FrameKey, TagValue>,
    ) -> Result<(), ()> {
        use std::io::{Read, Seek, SeekFrom, Write};
        let mut file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(file_path)
            .map_err(|_| ())?;
        let mut header = [0u8; 10];
        file.read_exact(&mut header).map_err(|_| ())?;
        if &header[0..3] != b"ID3" || header[3] != 2 {
            return Err(());
        }
        let tag_size = ((header[6] as usize) << 21)
            | ((header[7] as usize) << 14)
            | ((header[8] as usize) << 7)
            | (header[9] as usize);
        let mut tag_data = vec![0u8; tag_size];
        file.read_exact(&mut tag_data).map_err(|_| ())?;
        let mut pos = 0usize;
        let mut raw: HashMap<String, Vec<u8>> = HashMap::new();
        while pos + 6 <= tag_data.len() {
            let id_bytes = &tag_data[pos..pos + 3];
            if id_bytes.iter().all(|b| *b == 0) {
                break;
            }
            let id = match std::str::from_utf8(id_bytes) {
                Ok(s) if s.trim().is_empty() => break,
                Ok(s) => s.to_string(),
                Err(_) => break,
            };
            let size = V2_2::frame_size(&tag_data[pos + 3..pos + 6]);
            if size == 0 || pos + 6 + size > tag_data.len() {
                break;
            }
            let content = &tag_data[pos + 6..pos + 6 + size];
            raw.insert(id, content.to_vec());
            pos += 6 + size;
        }
        let raw_updates = id3v22_tags_to_raw(&updated);
        for (k, v) in raw_updates {
            match v {
                TagValue::Text(t) => {
                    if !t.is_empty() {
                        let encoded = encode_text_payload(&t, false);
                        raw.insert(k.to_string(), encoded);
                    }
                }
                // TODO: COme back
                TagValue::Picture { .. } => { /* Skipping picture write for v2.2 to keep simple */ }
            }
        }
        let mut frames: Vec<u8> = Vec::new();
        for (id, content) in raw {
            if id.len() != 3 {
                continue;
            }
            let size = content.len();
            if size == 0 {
                continue;
            }
            if size > 0xFFFFFF {
                continue;
            }
            let mut frame = Vec::with_capacity(6 + size);
            frame.extend_from_slice(id.as_bytes());
            frame.push(((size >> 16) & 0xFF) as u8);
            frame.push(((size >> 8) & 0xFF) as u8);
            frame.push((size & 0xFF) as u8);
            frame.extend_from_slice(&content);
            frames.extend_from_slice(&frame);
        }
        let header = create_header_with_version(2, frames.len());
        let mut audio_data = Vec::new();
        file.read_to_end(&mut audio_data).map_err(|_| ())?;
        file.seek(SeekFrom::Start(0)).map_err(|_| ())?;
        file.set_len(0).map_err(|_| ())?;
        file.write_all(&header).map_err(|_| ())?;
        file.write_all(&frames).map_err(|_| ())?;
        file.write_all(&audio_data).map_err(|_| ())?;
        file.flush().map_err(|_| ())?;
        Ok(())
    }
}
