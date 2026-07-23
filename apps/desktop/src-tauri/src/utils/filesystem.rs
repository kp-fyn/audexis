use std::fs::metadata;
use std::path::{PathBuf, MAIN_SEPARATOR_STR};
use walkdir::WalkDir;

/// Check if file is in folder
pub fn is_in_folder(folder: &PathBuf, file: &PathBuf) -> bool {
    let folder_path = format!(
        "{}{}",
        folder.to_string_lossy().to_string(),
        MAIN_SEPARATOR_STR
    );
    println!("check");
    println!(":{:?}", file.to_string_lossy().to_string());
    println!("{:?}", &folder_path);
    file.to_string_lossy().to_string().starts_with(&folder_path)
}

pub fn is_supported_file(path: &PathBuf) -> bool {
    const SUPPORTED_EXTENSIONS: [&str; 15] = [
        "m4a", "mp4", "qt", "m4b", "m4v", "mov", "ogg", "opus", "oga", "spx", "ogv", "mp3", "mp2",
        "mp1", "flac",
    ];
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext_str| SUPPORTED_EXTENSIONS.contains(&ext_str.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// Read folder recursivley and return all supported files
pub(crate) fn read_folder(path: PathBuf) -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = vec![];
    let is_folder = metadata(&path).map(|m| m.is_dir()).unwrap_or(false);
    if is_folder {
        for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
            let entry_path = entry.path().to_path_buf();
            let entry_is_folder = metadata(&entry_path).map(|m| m.is_dir()).unwrap_or(false);
            if !entry_is_folder {
                let is_supported = is_supported_file(&entry_path);

                if is_supported {
                    files.push(entry_path);
                }
            }
        }
    } else {
        files.push(path);
    }
    files
}
