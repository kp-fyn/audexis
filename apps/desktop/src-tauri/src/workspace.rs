use std::collections::HashMap;
use tauri::AppHandle;

use crate::tag_manager::tag_backend::{BackendError, DefaultBackend, TagBackend, TagError};
use crate::tag_manager::utils::{CleanupRule, File, FrameKey, SerializableTagValue, TagValue};
use base64::Engine;
use std::fs;
use std::fs::metadata;
use std::path::{Path, PathBuf};
use uuid::Uuid;
#[derive(Debug, Clone)]
pub struct Workspace {
    backend: DefaultBackend,
    pub files: Vec<File>,
}

impl Workspace {
    pub fn new(_app: &AppHandle) -> Self {
        Self {
            backend: DefaultBackend::new(),
            files: Vec::new(),
        }
    }
    pub fn write_tags(
        &mut self,
        file_paths: Vec<String>,
        updated_tags: HashMap<FrameKey, Vec<TagValue>>,
    ) {
        for file_path_str in file_paths {
            let file_path = PathBuf::from(&file_path_str);
            if let Some(file) = self.files.iter_mut().find(|x| x.path == file_path) {
                let mut single_map: HashMap<FrameKey, Vec<TagValue>> = HashMap::new();
                for (k, v) in &updated_tags {
                    single_map.insert(*k, v.clone());
                }
                let changes = crate::tag_manager::utils::Changes {
                    paths: vec![file_path_str.clone()],
                    tags: single_map
                        .into_iter()
                        .map(|(k, vec_vals)| {
                            let ser_vals: Vec<SerializableTagValue> = vec_vals
                                .into_iter()
                                .map(|v| match v {
                                    TagValue::Text(s) => SerializableTagValue::Text(s),
                                    TagValue::Picture {
                                        mime,
                                        data,
                                        picture_type,
                                        description,
                                    } => SerializableTagValue::Picture {
                                        mime,
                                        data_base64: base64::engine::general_purpose::STANDARD
                                            .encode(&data),
                                        picture_type,
                                        description,
                                    },
                                    TagValue::UserText(ut) => SerializableTagValue::UserText(ut),
                                    TagValue::UserUrl(uu) => SerializableTagValue::UserUrl(uu),
                                })
                                .collect();
                            (k, ser_vals)
                        })
                        .collect(),
                };
                let _res = self.backend.write_changes(&changes);
                match self.backend.read(&file.path) {
                    Ok(refreshed) => {
                        file.tags = refreshed.tags;
                    }
                    Err(e) => {
                        eprintln!("Failed to refresh tags for {}: {:?}", file_path_str, e);
                    }
                }
            } else {
                eprintln!("Path not found in workspace: {}", file_path_str);
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
            match self.backend.read(&file.path) {
                Ok(refreshed) => {
                    file.tags = refreshed.tags;
                    return true;
                }
                Err(e) => {
                    eprintln!(
                        "Failed to refresh tags for {}: {:?}",
                        file_path.display(),
                        e
                    );
                    return false;
                }
            }
        } else {
            eprintln!("Path not found in workspace: {}", file_path.display());
            return false;
        }
    }
    pub fn refresh_all_tags(&mut self) {
        for file in self.files.iter_mut() {
            match self.backend.read(&file.path) {
                Ok(refreshed) => {
                    file.tags = refreshed.tags;
                }
                Err(e) => {
                    eprintln!(
                        "Failed to refresh tags for {}: {:?}",
                        file.path.display(),
                        e
                    );
                }
            }
        }
    }
    pub fn get_file_by_path(&mut self, path: &Path) -> Option<&mut File> {
        self.files.iter_mut().find(|f| f.path == path)
    }

    pub fn import(&mut self, file: PathBuf) -> Result<(), BackendError> {
        if let Some(_) = self.files.iter().position(|f| f.path == file) {
            return Ok(());
        }
        let md = match metadata(&file) {
            Ok(m) => m,
            Err(e) => {
                return Err(BackendError::ReadFailed(TagError {
                    public_message: format!(
                        "Failed to read metadata for {}: {}",
                        file.display(),
                        e
                    ),
                    internal_message: format!(
                        "Failed to read metadata for {}: {}",
                        file.display(),
                        e
                    ),
                    path: file.display().to_string(),
                }))
            }
        };

        if md.is_file() {
            let detected = self.backend.read(&file);
            match detected {
                Ok(f) => {
                    self.files.push(f);
                    println!("Imported file: {}\n", file.display());
                    return Ok(());
                }
                Err(e) => {
                    return Err(e);
                }
            }
        } else {
            let entries = fs::read_dir(file);
            if entries.is_ok() {
                let entries = entries.unwrap();
                for entry in entries {
                    if entry.is_ok() {
                        let entry = entry.unwrap();
                        let path = entry.path();
                        print!("Importing from dir: {}\n", path.clone().display());
                        let _ = self.import(path)?;

                        continue;
                    }
                }
                return Ok(());
            } else {
                return Ok(());
            }
        }
    }
    pub fn get_file(&self, id: Uuid) -> Option<&File> {
        self.files.iter().find(|f| f.id == id)
    }
    pub fn clean_up_file_names(
        &mut self,
        file_paths: Vec<String>,
        options: Vec<CleanupRule>,
    ) -> Vec<(String, String, Result<(), String>)> {
        let mut results = Vec::new();

        for path_str in file_paths {
            let path = PathBuf::from(&path_str);

            if let Some(file) = self.files.iter_mut().find(|x| x.path == path) {
                let mut new_name = file
                    .path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("untitled")
                    .to_string();
                for rule in &options {
                    match rule {
                        CleanupRule::ReplaceUnderscores => {
                            new_name = new_name.replace('_', " ");
                        }
                        CleanupRule::NormalizeDashes => {
                            new_name = new_name
                                .chars()
                                .map(|c| if c == '–' || c == '—' { '-' } else { c })
                                .collect();
                        }
                        CleanupRule::NormalizeFeat => {
                            let patterns = vec![
                                " feat. ",
                                " ft. ",
                                " featuring ",
                                "Feat. ",
                                "Ft. ",
                                "Featuring ",
                                " FEAT. ",
                                " FT. ",
                                " FEATURING ",
                            ];
                            for p in patterns {
                                if new_name.contains(p) {
                                    new_name = new_name.replace(p, " feat. ");
                                }
                            }
                        }
                        CleanupRule::RemoveSuffixes => {
                            let suffixes = vec![
                                "(Official Video)",
                                "[Official Video]",
                                "(Official Music Video)",
                                "[Official Music Video]",
                                "(Lyric Video)",
                                "[Lyric Video]",
                                "(Audio)",
                                "[Audio]",
                            ];
                            for suffix in suffixes {
                                if new_name.ends_with(suffix) {
                                    new_name = new_name.trim_end_matches(suffix).trim().to_string();
                                }
                            }
                        }

                        CleanupRule::RemoveBrackets => {
                            let patterns = vec![('(', ')'), ('[', ']'), ('{', '}'), ('<', '>')];
                            for (open, close) in patterns {
                                loop {
                                    if let Some(start) = new_name.find(open) {
                                        if let Some(end) = new_name[start..].find(close) {
                                            let end = start + end;
                                            new_name.replace_range(start..=end, "");
                                            new_name = new_name.trim().to_string();
                                        } else {
                                            break;
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                        }
                        CleanupRule::FixCapitalization => {
                            fn capitalize_word(word: &str) -> String {
                                let mut chars = word.chars();
                                match chars.next() {
                                    Some(first) => {
                                        first.to_uppercase().collect::<String>() + chars.as_str()
                                    }
                                    None => String::new(),
                                }
                            }
                            const LOWERS: &[&str] = &[
                                "the", "a", "an", "and", "or", "but", "for", "nor", "as", "at",
                                "by", "in", "on", "of", "per", "to", "vs",
                            ];

                            let words: Vec<&str> = new_name.split_whitespace().collect();

                            let mut result: Vec<String> = Vec::with_capacity(words.len());

                            for (i, word) in words.iter().enumerate() {
                                let w = word.to_lowercase();

                                if i == 0 {
                                    result.push(capitalize_word(&w));
                                } else if LOWERS.contains(&w.as_str()) {
                                    result.push(w);
                                } else {
                                    result.push(capitalize_word(&w));
                                }
                            }

                            new_name = result.join(" ");
                        }

                        CleanupRule::CollapseSpaces => {
                            let mut collapsed = String::new();
                            let mut prev_space = false;
                            for c in new_name.chars() {
                                if c.is_whitespace() {
                                    if !prev_space {
                                        collapsed.push(' ');
                                        prev_space = true;
                                    }
                                } else {
                                    collapsed.push(c);
                                    prev_space = false;
                                }
                            }
                            new_name = collapsed;
                        }
                        CleanupRule::TrimWhitespace => {
                            new_name = new_name.trim().to_string();
                        }
                    }
                }

                let ext = file.path.extension().and_then(|e| e.to_str()).unwrap_or("");
                if !ext.is_empty() {
                    new_name = format!("{}.{}", new_name, ext);
                }
                let parent = file.path.parent().unwrap_or(Path::new("."));
                let target = parent.join(&new_name);
                if target != file.path {
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
                }
            }
        }
        results
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
            for (k, vec_v) in &file.tags {
                let key = k.to_string();
                let concatenated = vec_v
                    .iter()
                    .filter_map(|v| match v {
                        TagValue::Text(s) => Some(s.clone()),
                        _ => None,
                    })
                    .collect::<Vec<_>>()
                    .join("/");
                if !concatenated.is_empty() {
                    map.insert(key, concatenated);
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
