use std::fs::OpenOptions;
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::PathBuf;
pub fn ensure_header(file_path: &PathBuf) -> std::io::Result<bool> {
    let mut file = OpenOptions::new().read(true).write(true).open(file_path)?;

    let mut header = [0u8; 10];
    file.read_exact(&mut header)?;

    if &header[0..3] == b"ID3" {
        if (header[3] == 3 && header[4] == 0) || (header[3] == 4 && header[4] == 0) {
            Ok(true)
        } else {
            Ok(false)
        }
    } else {
        file.seek(SeekFrom::Start(0))?;
        let mut rest = Vec::new();
        file.read_to_end(&mut rest)?;

        file.seek(SeekFrom::Start(0))?;

        let size: u32 = 0;
        let size_bytes = to_synchsafe(size);

        let id3_header = [
            b'I',
            b'D',
            b'3',
            0x03,
            0x00,
            0x00,
            size_bytes[0],
            size_bytes[1],
            size_bytes[2],
            size_bytes[3],
        ];

        file.write_all(&id3_header)?;
        file.write_all(&rest)?;
        return Ok(false);
    }
}

pub fn to_synchsafe(size: u32) -> [u8; 4] {
    [
        ((size >> 21) & 0x7F) as u8,
        ((size >> 14) & 0x7F) as u8,
        ((size >> 7) & 0x7F) as u8,
        (size & 0x7F) as u8,
    ]
}

// pub fn from_synchsafe(bytes: &[u8]) -> u32 {
//     ((bytes[0] as u32) << 21)
//         | ((bytes[1] as u32) << 14)
//         | ((bytes[2] as u32) << 7)
//         | (bytes[3] as u32)
// }

fn is_latin1(s: &str) -> bool {
    s.chars().all(|c| (c as u32) <= 0xFF)
}

/// encoding 0x00 = ISO 0x01 = UTF-16
pub fn encode_text_payload(text: &str, prefer_utf16: bool) -> Vec<u8> {
    if !prefer_utf16 && is_latin1(text) {
        let mut out = Vec::with_capacity(1 + text.len());
        out.push(0x00);
        out.extend(text.chars().map(|c| (c as u32) as u8));
        out
    } else {
        let mut out = Vec::with_capacity(3 + text.len() * 2);
        out.push(0x01);
        out.push(0xFF);
        out.push(0xFE);
        for u in text.encode_utf16() {
            let [lo, hi] = u.to_le_bytes();
            out.push(lo);
            out.push(hi);
        }
        out
    }
}
pub fn encode_img_payload(
    mime_type: &str,
    picture_type: u8,
    description: &str,
    image_data: &[u8],
) -> Vec<u8> {
    let mut payload = Vec::new();
    payload.push(0x00);
    payload.extend_from_slice(mime_type.as_bytes());
    payload.push(0x00);
    payload.push(picture_type);
    payload.extend_from_slice(description.as_bytes());
    payload.push(0x00);
    payload.extend_from_slice(image_data);

    payload
}

// fn encode_url_payload(url: &str) -> Vec<u8> {
//     url.chars()
//         .map(|c| {
//             if (c as u32) <= 0xFF {
//                 (c as u32) as u8
//             } else {
//                 b'?'
//             }
//         })
//         .collect()
// }

pub fn build_frame(id: &str, payload: &[u8]) -> Vec<u8> {
    let mut frame = Vec::with_capacity(10 + payload.len());
    frame.extend_from_slice(id.as_bytes());
    frame.extend_from_slice(&(payload.len() as u32).to_be_bytes());
    frame.extend_from_slice(&[0x00, 0x00]);
    frame.extend_from_slice(payload);
    frame
}

pub fn create_header(tag_size: usize) -> [u8; 10] {
    let mut header = [0u8; 10];

    header[0..3].copy_from_slice(b"ID3");

    header[3] = 3;
    header[4] = 0;
    header[5] = 0x00;

    let synchsafe_size = to_synchsafe(tag_size as u32);
    header[6..10].copy_from_slice(&synchsafe_size);

    header
}

pub fn create_header_with_version(version: u8, tag_size: usize) -> [u8; 10] {
    let mut header = [0u8; 10];
    header[0..3].copy_from_slice(b"ID3");
    header[3] = version;
    header[4] = 0;
    header[5] = 0x00;
    let synchsafe_size = to_synchsafe(tag_size as u32);
    header[6..10].copy_from_slice(&synchsafe_size);
    header
}
