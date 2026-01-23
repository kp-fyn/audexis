use std::process::Command;

use tauri::command;
#[command]
pub fn open(path: &str) {
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg("-R").arg(path).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("explorer").args(["/select,", path]).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let p = Path::new(path);
        let dir = p.parent().unwrap_or_else(|| Path::new(path));
        let _ = Command::new("xdg-open").arg(dir).spawn();
    }
}
