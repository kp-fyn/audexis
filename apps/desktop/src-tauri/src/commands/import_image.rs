use crate::tag_manager::utils::SerializableTagValue;
use base64::{engine::general_purpose as b64_gp, Engine as _};
use rfd::FileDialog;
use std::env;
use std::path::PathBuf;
use tauri::command;
#[command]
pub fn import_image() -> Option<SerializableTagValue> {
    let home_dir: String = match env::home_dir() {
        Some(fp) => String::from(fp.to_string_lossy()),
        None => ".".to_owned(),
    };
    let maybe_file = FileDialog::new()
        .set_title("Select an image")
        .set_directory(home_dir)
        .add_filter("Image", &["png", "jpg", "jpeg"])
        .pick_file();
    if let Some(file) = maybe_file {
        let path_buf: PathBuf = file.into();
        let path_str = path_buf.to_string_lossy().to_string();

        let img = std::fs::read(&path_buf);
        if img.is_err() {
            return None;
        }
        let img_data = img.unwrap();
        let img_base64 = b64_gp::STANDARD.encode(&img_data);
        let mime = if path_str.ends_with(".png") {
            "image/png"
        } else if path_str.ends_with(".jpg") || path_str.ends_with(".jpeg") {
            "image/jpeg"
        } else {
            "image/png"
        };

        let img_tag = SerializableTagValue::Picture {
            data_base64: img_base64,
            mime: mime.to_string(),
            picture_type: Some(3),
            description: None,
        };
        Some(img_tag)
    } else {
        None
    }
}
