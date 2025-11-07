use crate::tag_manager::id3::utils::{raw_to_tags, tags_to_raw};
use crate::tag_manager::traits::TagFormat;
use crate::tag_manager::utils::{FrameKey, RawTagMap, TagMap, TagValue};
use std::collections::HashMap;
use std::fs::{File, OpenOptions};
use std::io::Read;

use crate::tag_manager::id3::v2_3::utils::{build_frame, create_header, encode_text_payload};
use std::path::PathBuf;

pub mod utils;

#[derive(Debug, Clone)]
pub struct V2_3 {}
fn from_synchsafe(bytes: [u8; 4]) -> usize {
    ((bytes[0] as usize) << 21)
        | ((bytes[1] as usize) << 14)
        | ((bytes[2] as usize) << 7)
        | (bytes[3] as usize)
}

impl TagFormat for V2_3 {
    fn new() -> Self {
        Self {}
    }

    fn get_tags(&self, file_path: &PathBuf) -> std::io::Result<HashMap<FrameKey, TagValue>> {
        let has_header = utils::ensure_header(&file_path);

        match has_header {
            Ok(true) => println!("File has ID3 header."),
            Ok(false) => println!("File does not have ID3 header."),
            Err(e) => return Err(e),
        }
        let mut file = File::open(file_path)?;

        let mut header = [0u8; 10];
        file.read_exact(&mut header)?;

        if &header[0..3] != b"ID3" {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Not a valid ID3v2.3 file",
            ));
        }

        let tag_size = from_synchsafe([header[6], header[7], header[8], header[9]]);
        let mut tag_data = vec![0u8; tag_size];
        file.read_exact(&mut tag_data)?;

        let mut tags: TagMap = HashMap::new();
        let mut pos = 0;

        while pos + 10 <= tag_data.len() {
            let id = &tag_data[pos..pos + 4];
            let frame_id = match std::str::from_utf8(id) {
                Ok(s) if s.trim().is_empty() => break,
                Ok(s) => s.to_string(),
                Err(_) => break,
            };

            let size = u32::from_be_bytes([
                tag_data[pos + 4],
                tag_data[pos + 5],
                tag_data[pos + 6],
                tag_data[pos + 7],
            ]) as usize;

            let _flags = &tag_data[pos + 8..pos + 10];

            if pos + 10 + size > tag_data.len() {
                break;
            }

            let content = &tag_data[pos + 10..pos + 10 + size];

            if frame_id.starts_with('T') || frame_id.starts_with("W") {
                if !content.is_empty() {
                    let encoding = content[0];
                    let text = match encoding {
                        0x00 => String::from_utf8_lossy(&content[1..]).to_string(),
                        0x01 => {
                            if content[1..].starts_with(&[0xFF, 0xFE]) {
                                String::from_utf16_lossy(
                                    &content[3..]
                                        .chunks(2)
                                        .map(|c| u16::from_le_bytes([c[0], c[1]]))
                                        .collect::<Vec<_>>(),
                                )
                            } else {
                                "<Unsupported UTF-16>".to_string()
                            }
                        }
                        _ => "<Unknown Encoding>".to_string(),
                    };
                    tags.insert(frame_id, TagValue::Text(text));
                }
            } else if frame_id == "APIC" && !content.is_empty() {
                let _encoding = content[0];
                if let Some(null_pos) = content[1..].iter().position(|&b| b == 0x00) {
                    let mime_type = String::from_utf8_lossy(&content[1..null_pos + 1]).to_string();
                    let description_start = null_pos + 2;
                    let description_end = content[description_start..]
                        .iter()
                        .position(|&b| b == 0x00)
                        .map_or(content.len(), |pos| description_start + pos);
                    let _description =
                        String::from_utf8_lossy(&content[description_start..description_end])
                            .to_string();
                    let image_data = &content[description_end + 1..];

                    tags.insert(
                        frame_id,
                        TagValue::Picture {
                            mime: mime_type,
                            data: image_data.to_vec(),
                        },
                    );
                }
            }

            pos += 10 + size;
        }

        let tags = raw_to_tags(&tags);

        Ok(tags)
    }

    fn write_tags(
        &self,
        file_path: &PathBuf,
        updated_tags: HashMap<FrameKey, TagValue>,
    ) -> Result<(), ()> {
        use std::io::{Read, Seek, SeekFrom, Write};

        let mut file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(file_path)
            .map_err(|_| ())?;

        let mut header = [0u8; 10];
        file.read_exact(&mut header).map_err(|_| ())?;
        if &header[0..3] != b"ID3" || header[3] != 3 {
            return Err(());
        }

        let tag_size = from_synchsafe([header[6], header[7], header[8], header[9]]);
        let mut tag_data = vec![0u8; tag_size];
        file.read_exact(&mut tag_data).map_err(|_| ())?;

        let mut pos: usize = 0;
        let mut raw_tags: RawTagMap = HashMap::new();
        while pos + 10 <= tag_data.len() {
            let id_bytes = &tag_data[pos..pos + 4];
            if id_bytes == [0, 0, 0, 0] {
                break;
            }
            let frame_id = match std::str::from_utf8(id_bytes) {
                Ok(s) if s.trim().is_empty() => break,
                Ok(s) => s.to_string(),
                Err(_) => break,
            };

            let size = u32::from_be_bytes([
                tag_data[pos + 4],
                tag_data[pos + 5],
                tag_data[pos + 6],
                tag_data[pos + 7],
            ]) as usize;

            if size == 0 {
                pos += 10;
                continue;
            }
            if pos + 10 + size > tag_data.len() {
                break;
            }

            let content = &tag_data[pos + 10..pos + 10 + size];
            raw_tags.insert(frame_id, content.to_vec());

            pos += 10 + size;
        }

        let raw_updated_tags = tags_to_raw(&updated_tags);
        for (k, v) in raw_updated_tags {
            match v {
                TagValue::Text(text) => {
                    if !text.is_empty() {
                        let encoded_text = encode_text_payload(&text, false);

                        raw_tags.insert(k.to_string(), encoded_text);
                    }
                }
                TagValue::Picture { mime, data } => {
                    let encoded_data = utils::encode_img_payload(&mime, 3, "", &data);
                    raw_tags.insert(k.to_string(), encoded_data);
                }
            }
        }
        println!(
            "Updated raw tags: {:?}",
            raw_tags.keys().collect::<Vec<_>>()
        );

        let frames = raw_tags
            .iter()
            .map(|(id, content)| build_frame(id, content))
            .collect::<Vec<_>>();
        let total_frame_size: usize = frames.iter().map(|f| f.len()).sum();
        let header = create_header(total_frame_size);

        let mut id3_tag = Vec::with_capacity(10 + total_frame_size);
        id3_tag.extend_from_slice(&header);
        for frame in frames {
            id3_tag.extend_from_slice(&frame);
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
        write!(f, "V2_3 Tag Format")
    }
}
