use std::path::Path;
use std::time::{Duration, UNIX_EPOCH};

use notify::{RecommendedWatcher, Watcher};
use notify_debouncer_full::{new_debouncer, DebouncedEvent, Debouncer, FileIdMap};

use sqlx::{QueryBuilder, Sqlite};
use tauri::{async_runtime, AppHandle, Manager};
use walkdir::WalkDir;

use crate::database::Database;
use crate::utils::database::get_library_roots;
use crate::utils::errors::DatabaseError;
use crate::AppState;

#[derive(Debug)]
pub struct FileWatcher {
    debouncer: Debouncer<RecommendedWatcher, FileIdMap>,

    app_handle: AppHandle,
}

impl FileWatcher {
    pub fn new(app: &AppHandle) -> Result<Self, DatabaseError> {
        let app_handle = app.clone();

        let debouncer = new_debouncer(
            Duration::from_millis(500),
            None,
            move |res: Result<Vec<DebouncedEvent>, _>| match res {
                Ok(events) => {
                    FileWatcher::handle_events(&app_handle, &events);
                }
                Err(e) => eprintln!("file watcher error: {:?}", e),
            },
        )
        .map_err(|_| DatabaseError::Unknown(String::from("Unknown")))?;
        let new_watcher = Self {
            app_handle: app.clone(),
            debouncer: debouncer,
        };

        Ok(new_watcher)
    }
    pub async fn init(&mut self) -> Result<(), DatabaseError> {
        let app_handle = self.app_handle.clone();
        let state: tauri::State<'_, AppState> = app_handle.state::<AppState>();
        let db: &Database = &state.db;
        let roots = get_library_roots(&db.pool).await?;

        self.scan_folders(roots.clone()).await?;

        for root in roots {
            let pth = Path::new(&root);
            if pth.exists() == false {
                continue;
            }
            if pth.is_file() {
                continue;
            }
            let _ = self
                .debouncer
                .watcher()
                .watch(pth, notify::RecursiveMode::Recursive);
        }

        Ok(())
    }
    pub fn watch_folders(&mut self, folders: Vec<String>) {
        for root in folders {
            let pth = Path::new(&root);
            if pth.exists() == false {
                continue;
            }
            if pth.is_file() {
                continue;
            }

            let _ = self
                .debouncer
                .watcher()
                .watch(pth, notify::RecursiveMode::Recursive);
        }
    }
    pub fn handle_events(app: &AppHandle, events: &Vec<DebouncedEvent>) {
        for event in events {
            println!("{:?}", event.kind)
        }
    }
    pub async fn scan_folders(&self, roots: Vec<String>) -> Result<(), DatabaseError> {
        let state: tauri::State<'_, AppState> = self.app_handle.state::<AppState>();
        let db: &Database = &state.db;

        let (tx_chan, mut rx_chan) = async_runtime::channel::<(String, i64, i64)>(1000);
        let walk_handle = async_runtime::spawn_blocking(move || {
            for root in roots {
                for entry in WalkDir::new(&root).into_iter().filter_map(|e| e.ok()) {
                    if !entry.file_type().is_file() || !is_audio_file(entry.path()) {
                        continue;
                    }

                    let Ok(meta) = entry.metadata() else { continue };
                    let modified_at = meta
                        .modified()
                        .ok()
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs() as i64)
                        .unwrap_or(0);
                    let size = meta.len() as i64;

                    if tx_chan
                        .blocking_send((
                            entry.path().to_string_lossy().to_string(),
                            modified_at,
                            size,
                        ))
                        .is_err()
                    {
                        break;
                    }
                }
            }
        });

        let mut tx = db
            .pool
            .begin()
            .await
            .map_err(|err| DatabaseError::Sqlx(err))?;
        sqlx::query(
            "CREATE TEMP TABLE scan_results (path TEXT PRIMARY KEY, modified_at INTEGER, size INTEGER)",
        )
        .execute(&mut *tx)
        .await.map_err(|err| DatabaseError::Sqlx(err))?;

        let mut batch = Vec::with_capacity(300);
        while let Some(item) = rx_chan.recv().await {
            batch.push(item);
            if batch.len() >= 300 {
                FileWatcher::flush_batch(&mut tx, &mut batch)
                    .await
                    .map_err(|err| DatabaseError::Sqlx(err))?;
            }
        }
        FileWatcher::flush_batch(&mut tx, &mut batch)
            .await
            .map_err(|err| DatabaseError::Sqlx(err))?;

        walk_handle.await.map_err(|e| DatabaseError::Tauri(e))?;

        let added: Vec<String> = sqlx::query_scalar(
            "SELECT path FROM scan_results WHERE path NOT IN (SELECT path FROM files)",
        )
        .fetch_all(&mut *tx)
        .await
        .map_err(|err| DatabaseError::Sqlx(err))?;

        // let removed: Vec<(i64, String)> = sqlx::query_as(
        //     "SELECT id, path FROM files WHERE path NOT IN (SELECT path FROM scan_results)",
        // )
        // .fetch_all(&mut *tx)
        // .await
        // .map_err(|err| DatabaseError::Sqlx(err))?;

        let modified: Vec<(i64, String)> = sqlx::query_as(
            "SELECT t.id, s.path FROM scan_results s
     JOIN files t ON s.path = t.path
     WHERE s.modified_at != t.modified_at OR s.size != t.size",
        )
        .fetch_all(&mut *tx)
        .await
        .map_err(|err| DatabaseError::Sqlx(err))?;
        let combined: Vec<String> = added
            .iter()
            .cloned()
            .chain(modified.iter().map(|(_, p)| p.clone()))
            .collect();

        sqlx::query("DROP TABLE scan_results")
            .execute(&mut *tx)
            .await
            .map_err(|err| DatabaseError::Sqlx(err))?;
        tx.commit().await.map_err(|err| DatabaseError::Sqlx(err))?;

        let mut to_process: Vec<String> = vec![];

        for file in combined {
            let file_path = Path::new(&file);
            if file_path.exists() == false {
                continue;
            }
            if file_path.is_file() == false {
                continue;
            }
            if is_audio_file(&file_path) == false {
                continue;
            }

            to_process.push(file);
        }

        for chunk in to_process.chunks(999) {
            let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(
                "INSERT INTO files (path, file_name, size, modified_at, status) ",
            );

            query_builder.push_values(chunk, |mut b, file| {
                let f = Path::new(&file);
                let file_name = f.file_name().unwrap_or_default().to_str().unwrap_or("file");
                b.push_bind(file);
                b.push_bind(file_name.to_string());
                b.push_bind(0);
                b.push_bind(0);
                b.push_bind("pending");
            });

            query_builder.push(
                " ON CONFLICT(path) DO UPDATE SET \
         file_name = excluded.file_name, \
         status = excluded.status",
            );
            query_builder
                .build()
                .execute(&db.pool)
                .await
                .map_err(|err| DatabaseError::Sqlx(err))?;
        }

        Ok(())
    }

    async fn flush_batch(
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        batch: &mut Vec<(String, i64, i64)>,
    ) -> Result<(), sqlx::Error> {
        if batch.is_empty() {
            return Ok(());
        }

        let mut query_builder: QueryBuilder<Sqlite> =
            QueryBuilder::new("INSERT INTO scan_results (path, modified_at, size)");

        query_builder.push_values(&mut *batch, |mut b, (path, modified_at, size)| {
            b.push_bind(path.to_string())
                .push_bind(modified_at.to_owned())
                .push_bind(size.to_owned());
        });
        query_builder.build().execute(&mut **tx).await?;

        batch.clear();
        Ok(())
    }
}
fn is_audio_file(p: &Path) -> bool {
    const SUPPORTED_EXTENSIONS: [&str; 15] = [
        "m4a", "mp4", "qt", "m4b", "m4v", "mov", "ogg", "opus", "oga", "spx", "ogv", "mp3", "mp2",
        "mp1", "flac",
    ];
    p.extension().is_some_and(|v| {
        v.to_str()
            .is_some_and(|s| SUPPORTED_EXTENSIONS.contains(&&s))
    })
}
// fn systemtime_to_unix(time: SystemTime) -> i64 {
//     time.duration_since(UNIX_EPOCH)
//         .unwrap_or(Duration::from_secs(0))
//         .as_secs() as i64
// }
