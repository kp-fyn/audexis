use crate::tag_manager::id3::utils::{id3v24_raw_to_tags, id3v24_tags_to_raw};
use crate::tag_manager::id3::v2_3::utils::{
    create_header_with_version, encode_text_payload, to_synchsafe,
};
use crate::tag_manager::traits::TagFormat;
use crate::tag_manager::utils::{FrameKey, TagValue};
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
    fn get_tags(&self, file_path: &PathBuf) -> std::io::Result<HashMap<FrameKey, TagValue>> {
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
        let mut raw: HashMap<String, TagValue> = HashMap::new();
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
            } else if id == "APIC" && !content.is_empty() {
                let _encoding = content[0];
                if let Some(null_pos) = content[1..].iter().position(|&b| b == 0x00) {
                    let mime_type = String::from_utf8_lossy(&content[1..null_pos + 1]).to_string();
                    let pic_type_index = null_pos + 2;
                    if pic_type_index >= content.len() {
                        break;
                    }
                    let _picture_type = content[pic_type_index];
                    let description_start = pic_type_index + 1;
                    let description_end = content[description_start..]
                        .iter()
                        .position(|&b| b == 0x00)
                        .map_or(content.len(), |p| description_start + p);
                    let image_data = if description_end < content.len() {
                        &content[description_end + 1..]
                    } else {
                        &[]
                    };
                    raw.insert(
                        id,
                        TagValue::Picture {
                            mime: mime_type,
                            data: image_data.to_vec(),
                        },
                    );
                }
            }
            pos += 10 + size;
        }
        Ok(id3v24_raw_to_tags(&raw))
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
        if &header[0..3] != b"ID3" || header[3] != 4 {
            return Err(());
        }
        let tag_size = from_synchsafe([header[6], header[7], header[8], header[9]]);
        let mut tag_data = vec![0u8; tag_size];
        file.read_exact(&mut tag_data).map_err(|_| ())?;
        let mut pos = 0usize;
        let mut raw: HashMap<String, Vec<u8>> = HashMap::new();
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
            raw.insert(id, content.to_vec());
            pos += 10 + size;
        }
        let raw_updates = id3v24_tags_to_raw(&updated);
        for (k, v) in raw_updates {
            match v {
                TagValue::Text(t) => {
                    if !t.is_empty() {
                        let encoded = encode_text_payload(&t, false);
                        raw.insert(k.to_string(), encoded);
                    }
                }
                TagValue::Picture { mime, data } => {
                    let encoded = crate::tag_manager::id3::v2_3::utils::encode_img_payload(
                        &mime, 3, "", &data,
                    );
                    raw.insert(k.to_string(), encoded);
                }
            }
        }
        let frames_vec = raw
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
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "V2_4 Tag Format")
    }
}
