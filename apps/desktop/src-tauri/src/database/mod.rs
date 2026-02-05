use rusqlite::{Connection, Result};
use std::path::PathBuf;

mod utils;
pub use utils::{create_indexes, create_tables, create_triggers, insert_initial_data};
pub fn init_database(db_path: &PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        PRAGMA temp_store = MEMORY;
    ",
    )?;

    create_schema(&conn)?;

    Ok(conn)
}

fn create_schema(conn: &Connection) -> Result<()> {
    let table_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='files'",
            [],
            |row| row.get(0),
        )
        .map(|count: i32| count > 0)?;

    if table_exists {
        return Ok(());
    }

    create_tables(conn)?;
    create_indexes(conn)?;
    create_triggers(conn)?;
    insert_initial_data(conn)?;

    Ok(())
}
