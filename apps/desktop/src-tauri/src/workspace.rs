use std::collections::HashMap;
use tauri::AppHandle;

use crate::tag_manager::traits::Formats;
use crate::tag_manager::utils::{File, FrameKey, TagValue};
use crate::tag_manager::TagManager;

use std::fs;
use std::fs::metadata;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct Workspace {
    tag_manager: TagManager,
    pub files: Vec<File>,
}

impl Workspace {
    pub fn new(_app: &AppHandle) -> Self {
        Self {
            tag_manager: TagManager::new(),
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
                                    if let Err(e) = tag_format.write_tags(&file, tags.clone()) {
                                        eprintln!(
                                            "Error writing tags back during import for {}: {:?}",
                                            file.display(),
                                            e
                                        );
                                    }
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

    pub fn rename_by_pattern(
        &mut self,
        file_paths: Vec<String>,
        pattern: &str,
    ) -> Vec<(String, String, Result<(), String>)> {
        fn sanitize_filename(name: &str) -> String {
            let mut s = name.trim().to_string();
            let invalid = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];
            s = s
                .chars()
                .map(|c| if invalid.contains(&c) { '_' } else { c })
                .collect();
            let mut prev_space = false;
            let mut out = String::new();
            for ch in s.chars() {
                if ch.is_whitespace() {
                    if !prev_space {
                        out.push(' ');
                    }
                    prev_space = true;
                } else {
                    prev_space = false;
                    out.push(ch);
                }
            }
            out.trim().trim_matches('.').to_string()
        }

        fn apply_pattern(file: &File, pattern: &str) -> String {
            let result = pattern.to_string();
            let mut map: HashMap<String, String> = HashMap::new();
            for (k, v) in &file.tags {
                let key = k.to_string();
                if let TagValue::Text(text) = v {
                    map.insert(key, text.clone());
                }
            }
            let ext = file.path.extension().and_then(|e| e.to_str()).unwrap_or("");
            map.insert("ext".to_string(), ext.to_string());

            let mut out = String::new();
            let mut chars = result.chars().peekable();
            while let Some(c) = chars.next() {
                if c == '{' {
                    let mut name = String::new();
                    while let Some(&nc) = chars.peek() {
                        chars.next();
                        if nc == '}' {
                            break;
                        }
                        name.push(nc);
                    }
                    let val = map.get(&name).cloned().unwrap_or_default();
                    out.push_str(&val);
                } else {
                    out.push(c);
                }
            }
            sanitize_filename(&out)
        }

        let mut results = Vec::new();
        for path_str in file_paths {
            let old_path = PathBuf::from(&path_str);
            if let Some(file) = self.files.iter_mut().find(|x| x.path == old_path) {
                let mut base_name = apply_pattern(file, pattern);
                if base_name.is_empty() {
                    base_name = file
                        .path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("untitled")
                        .to_string();
                }
                let ext = file.path.extension().and_then(|e| e.to_str()).unwrap_or("");
                if !ext.is_empty() {
                    let lower = base_name.to_lowercase();
                    let want = format!(".{}", ext.to_lowercase());
                    if !lower.ends_with(&want) {
                        base_name = format!("{}.{}", base_name, ext);
                    }
                }
                let parent = file.path.parent().unwrap_or(Path::new("."));
                let mut target = parent.join(&base_name);
                if target == file.path {
                    results.push((path_str.clone(), target.display().to_string(), Ok(())));
                    continue;
                }
                if target.exists() {
                    let stem = target
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("file");
                    let ext2 = target.extension().and_then(|e| e.to_str());
                    let mut idx = 1;
                    loop {
                        let candidate = match ext2 {
                            Some(e) if !e.is_empty() => {
                                parent.join(format!("{} ({}).{}", stem, idx, e))
                            }
                            _ => parent.join(format!("{} ({})", stem, idx)),
                        };
                        if !candidate.exists() {
                            target = candidate;
                            break;
                        }
                        idx += 1;
                        if idx > 9999 {
                            break;
                        }
                    }
                }
                match fs::rename(&file.path, &target) {
                    Ok(_) => {
                        file.path = target.clone();
                        results.push((path_str.clone(), target.display().to_string(), Ok(())));
                    }
                    Err(e) => {
                        results.push((
                            path_str.clone(),
                            target.display().to_string(),
                            Err(e.to_string()),
                        ));
                    }
                }
            } else {
                results.push((
                    path_str.clone(),
                    path_str.clone(),
                    Err("File not found in workspace".to_string()),
                ));
            }
        }
        results
    }
}
