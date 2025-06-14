use log::{error, trace, warn};
use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    path::PathBuf,
    sync::{mpsc::channel, Arc, LazyLock, Mutex},
    time::{Duration, Instant},
};
use tauri::{async_runtime::spawn_blocking, command, AppHandle, Emitter};
use RecursiveMode::{NonRecursive, Recursive};

/// Stores each repo watcher in a HashMap
static WATCHER_STORE: LazyLock<Arc<Mutex<HashMap<String, RecommendedWatcher>>>> =
    LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

/// Stores the yet unwatched dynamic directories of each currently watched repo
static DYNAMIC_DIRS_MAP: LazyLock<Arc<Mutex<HashMap<String, Vec<(PathBuf, RecursiveMode)>>>>> =
    LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepoEvents {
    head_event: String,
    fetch_event: String,
    status_event: String,
}

#[command]
pub async fn setup_watchers(
    app_handle: AppHandle,
    repo_path: String,
    repo_events: RepoEvents,
) -> Result<(), String> {
    let mut watchers = match WATCHER_STORE.lock() {
        Ok(guard) => guard,
        Err(e) => {
            let msg = format!("Error obtaining WATCHER_STORE lock: Mutex is poisoned - {e}");
            error!("{msg}");
            return Err(msg);
        }
    };

    if watchers.contains_key(&repo_path) {
        return Ok(());
    }

    let base_path = PathBuf::from(&repo_path);
    let git_path = base_path.join(".git");
    let mut paths_to_watch: Vec<(PathBuf, RecursiveMode)> = vec![
        (base_path, Recursive),
        (git_path.join("HEAD"), NonRecursive),
    ];

    let mut unwatched_dirs_map = match DYNAMIC_DIRS_MAP.lock() {
        Ok(guard) => guard,
        Err(e) => {
            let err = format!("Error obtaining UNWATCHED_DIRS_MAP lock: Mutex is poisoned - {e}");
            error!("{err}");
            return Err(err);
        }
    };

    let unwatched_dirs = unwatched_dirs_map
        .entry(repo_path.clone())
        .or_insert_with(Vec::new);

    let mut has_unwatched_dirs = false;

    let dynamic_paths: Vec<(PathBuf, RecursiveMode)> = vec![
        (git_path.join("index"), NonRecursive),
        (git_path.join("FETCH_HEAD"), NonRecursive),
        (git_path.join("refs").join("remotes"), Recursive),
        (git_path.join("refs").join("stash"), NonRecursive),
        (git_path.join("refs").join("tags"), NonRecursive),
        (
            git_path.join("logs").join("refs").join("stash"),
            NonRecursive,
        ),
    ];

    for entry in &dynamic_paths {
        let (path, _) = entry;

        if !path.exists() {
            unwatched_dirs.push(entry.clone());
            has_unwatched_dirs = true;
        } else {
            paths_to_watch.push(entry.clone());
        }
    }

    let (tx, rx) = channel();
    let event_app_handle = app_handle.clone();

    let repo_path_str = repo_path.clone().replace('\\', "/");
    let mut watcher = RecommendedWatcher::new(
        move |result: Result<notify::Event, notify::Error>| {
            if let Ok(event) = result {
                if let Some(path) = event.paths.first() {
                    let path_str = path.to_string_lossy().replace('\\', "/");

                    let is_create = matches!(event.kind, EventKind::Create(_));

                    if has_unwatched_dirs
                        && is_create
                        && path_str.contains("/.git/")
                        && (path_str.contains("FETCH_HEAD")
                            || path_str.contains("refs")
                            || path_str.contains("stash"))
                    {
                        tx.send((".git", ())).ok();
                    }
                    if path.ends_with("HEAD") && !path.ends_with("FETCH_HEAD") {
                        tx.send(("head", ())).ok();
                    } else if path.ends_with("FETCH_HEAD")
                        || path_str.contains("/refs/remotes/")
                        || path_str.contains("/refs/tags")
                    {
                        tx.send(("fetch", ())).ok();
                    } else if path_str.contains("/refs/stash")
                        || path_str.contains("/logs/refs/stash")
                    {
                        tx.send(("status", ())).ok();
                    } else if path.ends_with("index")
                        || path.ends_with("index.lock")
                        || (path_str.contains(&repo_path_str) && !path_str.contains("/.git/"))
                    {
                        tx.send(("status", ())).ok();
                    }
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| format!("Error while creating repo watchers: {e}"))?;

    for (path, recursive_mode) in paths_to_watch {
        watcher
            .watch(&path, recursive_mode)
            .map_err(|e| format!("Error while watching <{:#?}>: {}", path, e))?;
    }

    watchers.insert(repo_path.clone(), watcher);

    let RepoEvents {
        head_event,
        fetch_event,
        status_event,
    } = repo_events;

    spawn_blocking(move || {
        while let Ok((event_type, ())) = rx.recv() {
            let mut events = HashSet::new();
            events.insert(event_type);

            let collection_end = Instant::now() + Duration::from_millis(50);

            while Instant::now() < collection_end {
                match rx.recv_timeout(collection_end - Instant::now()) {
                    Ok((more_event_type, ())) => {
                        events.insert(more_event_type);
                    }
                    Err(_) => break,
                }
            }

            for unique_event in events {
                match unique_event {
                    ".git" => {
                        trace!("--.git event--");
                        handle_dynamic_dirs(&repo_path);
                    }
                    "head" => {
                        trace!("--Head event--");
                        event_app_handle.emit(&head_event, ()).ok();
                    }
                    "fetch" => {
                        trace!("--Fetch event--");
                        event_app_handle.emit(&fetch_event, ()).ok();
                    }
                    "status" => {
                        trace!("--Status event--");
                        event_app_handle.emit(&status_event, ()).ok();
                    }
                    _ => {}
                }
            }
        }
    });

    Ok(())
}

fn handle_dynamic_dirs(repo_path: &String) {
    let mut unwatched_dirs_map = match DYNAMIC_DIRS_MAP.lock() {
        Ok(guard) => guard,
        Err(e) => {
            error!("Error obtaining UNWATCHED_DIRS_MAP lock: Mutex is poisoned - {e}");
            return;
        }
    };
    let entries = match unwatched_dirs_map.get_mut(repo_path) {
        Some(e) => e,
        None => return,
    };

    let mut watcher_store = match WATCHER_STORE.lock() {
        Ok(guard) => guard,
        Err(e) => {
            error!("Error obtaining WATCHER_STORE lock: Mutex is poisoned - {e}");
            return;
        }
    };

    let watcher = match watcher_store.get_mut(repo_path) {
        Some(w) => w,
        None => return,
    };

    let count = entries.len();
    for i in (0..count).rev() {
        let (path, recursive_mode) = &entries[i];

        if let Err(e) = watcher.watch(path, *recursive_mode) {
            trace!("Failed to watch dynamic path {}: {}", path.display(), e);
            continue;
        }
    }
}

#[command]
pub async fn stop_git_watcher(repo_path: String) -> Result<(), String> {
    let watcher_removed = match WATCHER_STORE.lock() {
        Ok(mut guard) => guard.remove(&repo_path),
        Err(e) => {
            let err = format!("Error obtaining WATCHER_STORE lock: Mutex is poisoned - {e}");
            error!("{err}");
            return Err(err);
        }
    };

    let dynamic_entries_removed = match DYNAMIC_DIRS_MAP.lock() {
        Ok(mut guard) => guard.remove(&repo_path),
        Err(e) => {
            let err = format!("Error obtaining UNWATCHED_DIRS_MAP lock: Mutex is poisoned - {e}");
            error!("{err}");
            return Err(err);
        }
    };

    if watcher_removed.is_none() {
        warn!("No watcher found for {}", repo_path);
    }

    if !dynamic_entries_removed.is_none() {
        warn!("No dynamic directories entry found for {}", repo_path);
    }

    Ok(())
}
