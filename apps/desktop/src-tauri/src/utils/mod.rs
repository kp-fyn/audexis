use std::path::PathBuf;

use crate::commands::import_paths::import_paths;
use serde::Serialize;
use tauri::Manager;

#[derive(Serialize)]
pub struct RenameResultItem {
    pub old: String,
    pub new: String,
    pub ok: bool,
    pub error: Option<String>,
}

pub fn to_label(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars().peekable();

    while let Some(c) = chars.next() {
        if c.is_ascii_uppercase()
            && !result.is_empty()
            && chars
                .peek()
                .map_or(true, |&next_c| next_c.is_ascii_lowercase())
        {
            result.push(' ');
        }
        result.push(c);
    }
    result
}

pub fn to_value(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        Some(first_char) => first_char.to_lowercase().chain(chars).collect(),
        None => String::new(),
    }
}
pub fn handle_file_associations(app_handle: tauri::AppHandle, paths: Vec<PathBuf>) {
    let binding = app_handle.clone();
    let state = binding.try_state();
    if state.is_none() {
        return;
    }
    let state = state.unwrap();
    let string_paths: Vec<String> = paths
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();
    import_paths(app_handle, string_paths, state);
}
