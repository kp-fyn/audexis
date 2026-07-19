use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use sqlx::Executor;
use std::fs;
use std::path::PathBuf;

#[derive(Clone)]
pub struct Database {
    pub pool: SqlitePool,
}

impl Database {
    pub async fn init(db_path: &PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let config_folder = db_path.parent();
        if config_folder.is_none() {
            panic!("No Config folder bruh");
        }
        let config_folder = config_folder.unwrap();
        println!("{}", &config_folder.as_os_str().display());
        fs::create_dir_all(config_folder).expect("Could not create config folder");

        let exists = fs::exists(db_path)?.then(|| ());
        exists.is_none().then(|| {
            fs::File::create(db_path).expect("Failed to create database file");
        });

        let connection_options = SqliteConnectOptions::new()
            .create_if_missing(true)
            .filename(db_path);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .after_connect(|conn, _| {
                Box::pin(async move {
                    conn.execute("PRAGMA journal_mode=WAL;").await?;
                    Ok(())
                })
            })
            .connect_with(connection_options)
            .await?;

        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }
}
