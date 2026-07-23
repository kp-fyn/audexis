-- Add migration script here
CREATE TABLE
    IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at INTEGER NOT NULL DEFAULT (strftime ('%s', 'now')),
        path TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        duration_ms INTEGER,
        last_modified INTEGER,
        last_validated INTEGER,
        status TEXT DEFAULT 'pending',
        metadata_status TEXT DEFAULT 'pending',
        tag_format TEXT,
        tag_formats TEXT
    );

CREATE TABLE
    IF NOT EXISTS tag_text (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS tag_pictures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        data BLOB NOT NULL,
        picture_type INTEGER NOT NULL DEFAULT 3,
        description TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS tag_user_text (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS tag_user_url (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS tag_comment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        text TEXT NOT NULL,
        encoding TEXT NOT NULL,
        language TEXT NOT NULL,
        description TEXT NOT NULL,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS freeform_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        value TEXT NOT NULL,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS folders (
        path TEXT PRIMARY KEY,
        parent_path TEXT,
        name TEXT NOT NULL,
        depth INTEGER NOT NULL,
        file_count INTEGER DEFAULT 0,
        total_file_count INTEGER DEFAULT 0,
        FOREIGN KEY (parent_path) REFERENCES folders (path) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS import_roots (
        path TEXT PRIMARY KEY,
        last_scanned INTEGER,
        status TEXT DEFAULT 'active'
    );