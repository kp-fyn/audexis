use rusqlite::{Connection, Result};
pub fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS files (
            path TEXT PRIMARY KEY,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            duration_ms INTEGER,
            last_modified INTEGER,
            last_validated INTEGER,
            status TEXT DEFAULT 'pending',
            metadata_status TEXT DEFAULT 'pending',
            
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
            picture_type INTEGER NOT NULL DEFAULT 3,
            description TEXT NOT NULL DEFAULT '',
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
            description TEXT NOT NULL DEFAULT '',
          
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
            description TEXT NOT NULL DEFAULT '',
          
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
        text TEXT NOT NULL,
        encoding TEXT NOT NULL,
        language TEXT NOT NULL,
        description TEXT NOT NULL,
        
      
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
         
             last_scanned INTEGER,
             status TEXT DEFAULT 'active'  -- 'active', 'removed', 'missing'
           ); ",
        [],
    )?;

    Ok(())
}

pub fn create_indexes(conn: &Connection) -> Result<()> {
    Ok(())
}
pub fn create_triggers(conn: &Connection) -> Result<()> {
    Ok(())
}
