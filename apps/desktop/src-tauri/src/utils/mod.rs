use serde::Serialize;
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
