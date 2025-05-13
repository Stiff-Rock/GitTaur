use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::{
    collections::HashMap,
    path::Path,
    sync::{mpsc::channel, Arc, LazyLock, Mutex},
    thread::spawn,
    time::{Duration, Instant},
};
use tauri::{command, AppHandle, Emitter};

static WATCHER_STORE: LazyLock<Arc<Mutex<HashMap<String, RecommendedWatcher>>>> =
    LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

#[command]
pub async fn watch_git_status(app_handle: AppHandle, repo_path: String) -> Result<(), String> {
    let mut watchers = WATCHER_STORE.lock().unwrap();
    if watchers.contains_key(&repo_path) {
        return Ok(());
    }

    let git_index_path = format!("{}/.git/index", repo_path);
    let (tx, rx) = channel();
    let event_app_handle = app_handle.clone();
    let event_repo_path = repo_path.clone();

    let watcher = RecommendedWatcher::new(
        move |result| {
            if let Ok(_) = result {
                tx.send(()).ok();
            }
        },
        Config::default(),
    )
    .map_err(|e| e.to_string())?;

    watchers.insert(repo_path.clone(), watcher);

    if let Some(watcher) = watchers.get_mut(&repo_path) {
        watcher
            .watch(Path::new(&git_index_path), RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;

        watcher
            .watch(Path::new(&repo_path), RecursiveMode::Recursive)
            .map_err(|e| e.to_string())?;
    } else {
        return Err("Watcher disappeared unexpectedly".to_string());
    }

    spawn(move || {
        let mut last_emit = Instant::now() - Duration::from_secs(3);
        while let Ok(()) = rx.recv() {
            let now = Instant::now();
            if now.duration_since(last_emit) > Duration::from_millis(500) {
                event_app_handle
                    .emit("git-status-changed", &event_repo_path)
                    .ok();
                last_emit = now;
            }
        }
    });

    Ok(())
}

#[command]
pub async fn stop_git_watcher(repo_path: String) -> Result<(), String> {
    let removed = WATCHER_STORE.lock().unwrap().remove(&repo_path);

    if removed.is_some() {
        Ok(())
    } else {
        Err(format!("No watcher found for {}", repo_path))
    }
}
