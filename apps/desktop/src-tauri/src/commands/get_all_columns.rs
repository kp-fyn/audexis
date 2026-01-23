use crate::config::user::Column;
use crate::constants::FRAME_KEYS;
use crate::tag_manager::utils::FrameKey;
use crate::utils::{to_label, to_value};
use tauri::command;
#[command]
pub fn get_all_columns() -> Vec<Column> {
    let mut columns: Vec<Column> = Vec::new();

    for frame_key in FRAME_KEYS {
        columns.push(Column {
            label: to_label(&frame_key.to_string()),
            value: to_value(&frame_key.to_string()),

            size: match frame_key {
                FrameKey::Year
                | FrameKey::TrackNumber
                | FrameKey::Length
                | FrameKey::BeatsPerMinute
                | FrameKey::PlayCount => 100,
                FrameKey::UnsyncedLyrics
                | FrameKey::Comments
                | FrameKey::UserDefinedURL
                | FrameKey::CommercialURL
                | FrameKey::CopyrightURL
                | FrameKey::AudioFileURL
                | FrameKey::ArtistURL
                | FrameKey::RadioStationURL
                | FrameKey::PaymentURL
                | FrameKey::BitmapImageURL
                | FrameKey::UserDefinedText
                | FrameKey::SynchronizedLyrics => 300,
                _ => 200,
            },
            kind: frame_key.get_kind(),
        });
    }
    columns
}
