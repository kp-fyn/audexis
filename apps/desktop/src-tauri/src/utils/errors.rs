use thiserror::Error;

/// All errors to do with the db
#[derive(Error, Debug)]
pub enum DatabaseError {
    /// sqlx err
    #[error("data store disconnected")]
    Sqlx(sqlx::Error),
    #[error("Errr")]
    Tauri(tauri::Error),
    #[error("Errr")]
    Unknown(String),
}
