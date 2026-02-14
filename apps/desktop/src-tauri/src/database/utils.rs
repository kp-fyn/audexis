use rusqlite::{Connection, Result};
pub fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS files (
            path TEXT PRIMARY KEY,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            duration_ms INTEGER,
            imported_at INTEGER DEFAULT (strftime('%s', 'now')),
            last_modified INTEGER,
            last_validated INTEGER,
            status TEXT DEFAULT 'pending',
            metadata_status TEXT DEFAULT 'pending',
            error_message TEXT,
            tag_format TEXT,
            tag_formats TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tag_text (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
          
            FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE
        )",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tag_pictures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            key TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            data BLOB NOT NULL,
          
            FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE
        )",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tag_user_text (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
          
            FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE
        )",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tag_user_url (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            key TEXT NOT NULL,
            url TEXT NOT NULL,
          
            FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE
        )",
        [],
    )?;
    conn.execute(
        "
    CREATE TABLE IF NOT EXISTS tag_comment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        key TEXT NOT NULL,
        comment TEXT NOT NULL,
      
        FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE
)",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS freeform_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            description TEXT NOT NULL,
            value TEXT NOT NULL,
            FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS folders (
            path TEXT PRIMARY KEY,
            parent_path TEXT,
            name TEXT NOT NULL,
            depth INTEGER NOT NULL,
            file_count INTEGER DEFAULT 0,
            total_file_count INTEGER DEFAULT 0,
            FOREIGN KEY (parent_path) REFERENCES folders(path) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS import_roots (
             path TEXT PRIMARY KEY,
             imported_at INTEGER DEFAULT (strftime('%s', 'now')),
             last_scanned INTEGER,
             status TEXT DEFAULT 'active'  -- 'active', 'removed', 'missing'
           ); ",
        [],
    )?;

    Ok(())
}

pub fn create_indexes(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_files_status ON files(status)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_files_metadata_status ON files(metadata_status)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_files_imported_at ON files(imported_at)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_files_path_prefix ON files(path)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tags_file_path ON tags(file_path)",
        [],
    )?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tags_key ON tags(key)", [])?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tags_file_key ON tags(file_path, key)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_pictures_file_path ON pictures(file_path)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_import_roots_status ON import_roots(status);",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_pictures_hash ON pictures(data_hash)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_freeform_file_path ON freeform_tags(file_path)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_path)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_folders_depth ON folders(depth)",
        [],
    )?;

    Ok(())
}
pub fn create_triggers(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS tags_fts USING fts5(
            file_path,
            key,
            value,
            content=tags,
            content_rowid=id
        )",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS tags_ai AFTER INSERT ON tags BEGIN
            INSERT INTO tags_fts(rowid, file_path, key, value)
            VALUES (new.id, new.file_path, new.key, new.value);
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS tags_ad AFTER DELETE ON tags BEGIN
            DELETE FROM tags_fts WHERE rowid = old.id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS tags_au AFTER UPDATE ON tags BEGIN
            UPDATE tags_fts 
            SET file_path = new.file_path, key = new.key, value = new.value
            WHERE rowid = new.id;
        END",
        [],
    )?;

    Ok(())
}
