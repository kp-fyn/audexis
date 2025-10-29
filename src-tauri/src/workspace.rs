use std::collections::HashMap;
use tauri::AppHandle;

use crate::tag_manager::traits::Formats;
use crate::tag_manager::utils::{File, FrameKey, TagValue};
use crate::tag_manager::TagManager;

use std::fs::metadata;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct Workspace {
    tag_manager: TagManager,
    app_handle: AppHandle,
    pub files: Vec<File>,
}

impl Workspace {
    pub fn new(app: &AppHandle) -> Self {
        Self {
            tag_manager: TagManager::new(),
            app_handle: app.clone(),
            files: Vec::new(),
        }
    }
    pub fn write_tags(
        &mut self,
        file_paths: Vec<String>,
        updated_tags: HashMap<FrameKey, TagValue>,
    ) {
        for file_path_str in file_paths {
            println!("{}", file_path_str);
            let file_path = PathBuf::from(&file_path_str);
            if let Some(file) = self.files.iter_mut().find(|x| x.path == file_path) {
                if let Some(rc) = self.tag_manager.get_release_class(&file.tag_format) {
                    match rc.write_tags(&file.path, updated_tags.clone()) {
                        Ok(_) => match rc.get_tags(&file.path) {
                            Ok(refreshed) => {
                                file.tags = refreshed;
                            }
                            Err(e) => {
                                eprintln!("Failed to re-read tags after write ({}). Falling back to merge.", e);
                                for (k, v) in &updated_tags {
                                    file.tags.insert(*k, v.clone());
                                }
                            }
                        },
                        Err(_) => {
                            eprintln!("Failed to write tags for: {}", file_path_str);
                            continue;
                        }
                    }
                } else {
                    eprintln!("No tag format handler for: {}", file_path_str);
                }
            } else {
                println!("Path not found in workspace: {}", file_path_str);
                continue;
            }
        }
    }
    pub fn remove_file(&mut self, file_path: &PathBuf) -> bool {
        if let Some(index) = self.files.iter().position(|f| &f.path == file_path) {
            self.files.remove(index);
            return true;
        } else {
            return false;
        }
    }
    pub fn refresh_tags(&mut self, file_path: &PathBuf) -> bool {
        if let Some(file) = self.files.iter_mut().find(|x| &x.path == file_path) {
            if let Some(rc) = self.tag_manager.get_release_class(&file.tag_format) {
                match rc.get_tags(&file.path) {
                    Ok(refreshed) => {
                        file.tags = refreshed;
                        return true;
                    }
                    Err(e) => {
                        eprintln!("Failed to refresh tags for {}: {}", file_path.display(), e);
                        return false;
                    }
                }
            } else {
                eprintln!("No tag format handler for: {}", file_path.display());
                return false;
            }
        } else {
            println!("Path not found in workspace: {}", file_path.display());
            return false;
        }
    }

    pub fn import(&mut self, file: PathBuf) -> bool {
        if let Some(index) = self.files.iter().position(|f| f.path == file) {
            println!("Found file at index: {}", index.to_string());
            return false;
        }
        let md = match metadata(&file) {
            Ok(m) => m,
            Err(e) => {
                eprintln!("Could not read metadata: {}", e);
                return false;
            }
        };
        println!("{}", md.is_file());
        if md.is_file() {
            let tag_format_str = self.tag_manager.detect_tag_format(&file);
            match tag_format_str {
                Formats::Unknown => {
                    return false;
                }

                _ => {
                    print!("{:?}", &tag_format_str);
                    let tag_format = self.tag_manager.get_release_class(&tag_format_str);
                    print!("{:?}", &tag_format);
                    match tag_format {
                        Some(tag_format) => {
                            println!("{}", tag_format);
                            let tags = tag_format.get_tags(&file);

                            match tags {
                                Ok(tags) => {
                                    tag_format.write_tags(&file, tags.clone());
                                    let audio_file = File {
                                        path: file.clone(),
                                        tag_format: tag_format_str,
                                        tags,
                                    };
                                    self.files.push(audio_file);
                                    return true;
                                }
                                Err(e) => {
                                    eprintln!("Error reading tags: {}", e);
                                }
                            }
                        }
                        None => return false,
                    }
                    return false;
                }
            }
        } else {
            return false;
        }
    }
}
